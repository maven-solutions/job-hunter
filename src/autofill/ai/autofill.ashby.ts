import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { AshbyCandidateField, collectAshbyCandidateFields } from "./scan.ashby";

export interface AshbyAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface AshbyAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeLabel = (label: string): string =>
  fromatStirngInLowerCase(cleanLabelText(label)) ?? "";

/** API placeholders that should not count as a real fill value. */
const EMPTY_ANSWER_TOKENS = new Set([
  "",
  "null",
  "undefined",
  "n/a",
  "na",
  "nil",
  "-",
  "--",
  "[]",
  "{}",
  "empty",
  "not provided",
  "not available",
  "no data",
  "no answer",
]);

/**
 * True only when the API returned a usable non-empty answer.
 * empty string / empty array / null / "null" / "N/A" must NOT count as filled.
 */
export const isUsableAshbyAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  // [] or [null, "", ...] → empty
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableAshbyAnswer(v));
  }

  if (typeof value === "object") {
    // {} with no nested fill value
    const nested =
      (value as any).answer ??
      (value as any).value ??
      (value as any).fill ??
      (value as any).text ??
      (value as any).data;
    if (nested === undefined && Object.keys(value as object).length === 0) {
      return false;
    }
    if (nested === undefined) return false;
    return isUsableAshbyAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false; // "" / whitespace-only
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

/** Coerce a raw API answer into a display/fill string, or "" if unusable. */
const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableAshbyAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableAshbyAnswer(v))
      .join(", ");
  }

  if (typeof raw === "object" && raw != null) {
    const nested =
      (raw as any).answer ??
      (raw as any).value ??
      (raw as any).fill ??
      (raw as any).text ??
      (raw as any).data;
    return coerceAnswerString(nested);
  }

  return String(raw).trim();
};

/** Extract raw answer from an API item (prefers explicit keys over `??` fallback). */
const extractRawAnswer = (item: any): unknown => {
  if (item == null || typeof item !== "object") return undefined;
  if ("answer" in item) return item.answer;
  if ("value" in item) return item.value;
  if ("fill" in item) return item.fill;
  if ("text" in item) return item.text;
  if ("data" in item) return item.data;
  return undefined;
};

/** Empty string, empty array, null, or non-usable tokens all count as “no answer”. */
const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableAshbyAnswer(raw);

const addLabelKey = (set: Set<string>, label: string): void => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return;
  const n = normalizeLabel(cleaned);
  if (n) set.add(n);
  const compact = cleanLabelText(cleaned)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  if (compact) set.add(compact);
};

/** Whether this form field’s API payload was explicitly empty/null/[]. */
const isFieldMarkedEmpty = (
  label: string,
  emptyLabelKeys: Set<string>,
): boolean => {
  if (emptyLabelKeys.size === 0) return false;
  const n = normalizeLabel(label);
  if (n && emptyLabelKeys.has(n)) return true;
  const compact = cleanLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  if (compact && emptyLabelKeys.has(compact)) return true;

  // Soft: API empty-label is a shortened version of the long form label
  if (n && n.length >= 8) {
    for (const key of emptyLabelKeys) {
      if (key.length < 8) continue;
      if (n === key || n.includes(key) || key.includes(n)) return true;
    }
  }
  return false;
};

export interface AshbyParsedFillResponse {
  /** Usable non-empty answers only */
  answers: AshbyAiAnswer[];
  /**
   * Normalized label keys for which the API returned empty string / empty array /
   * null / placeholder — those fields must NOT be filled or soft-matched.
   */
  emptyLabelKeys: Set<string>;
  /** How many API items had an empty/null/[] answer (not set size). */
  emptyCount: number;
}

/**
 * Parse fill API response into usable answers + labels that came back empty.
 */
export const parseAshbyAiFillResponse = (
  response: unknown,
): AshbyParsedFillResponse => {
  const answers: AshbyAiAnswer[] = [];
  const emptyLabelKeys = new Set<string>();
  let emptyCount = 0;

  if (!response) {
    return { answers, emptyLabelKeys, emptyCount };
  }

  let payload: any = response;
  if (payload?.data != null && typeof payload.data === "object") {
    payload = payload.data;
  }
  if (
    payload?.fill_data_list != null &&
    typeof payload.fill_data_list === "object"
  ) {
    payload = payload.fill_data_list;
  }

  const markEmpty = (label: string): void => {
    addLabelKey(emptyLabelKeys, label);
    emptyCount += 1;
  };

  const processItem = (item: any): void => {
    if (!item || typeof item !== "object") return;
    const label = String(item.label ?? item.field ?? item.name ?? "").trim();
    if (!label) return;

    const raw = extractRawAnswer(item);

    // Missing answer, null, "", [], placeholders → mark empty (not filled)
    if (isEmptyApiAnswer(raw)) {
      markEmpty(label);
      return;
    }

    const answer = coerceAnswerString(raw);
    if (!answer) {
      markEmpty(label);
      return;
    }

    answers.push({
      label,
      answer,
      type: item.type ? String(item.type) : undefined,
    });
  };

  if (Array.isArray(payload)) {
    payload.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (Array.isArray(payload?.elements)) {
    payload.elements.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (Array.isArray(payload?.answers)) {
    payload.answers.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (Array.isArray(payload?.fields)) {
    payload.fields.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (typeof payload === "object") {
    const reserved = new Set([
      "elements",
      "answers",
      "fields",
      "fill_data_list",
      "resumeId",
      "userId",
      "parser",
      "source",
      "url",
      "token",
      "fromAgent",
      "message",
      "success",
      "status",
      "error",
    ]);
    for (const [label, value] of Object.entries(payload)) {
      if (reserved.has(label)) continue;
      if (isEmptyApiAnswer(value)) {
        markEmpty(label);
        continue;
      }
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        !Array.isArray(value)
      ) {
        continue;
      }
      const answer = coerceAnswerString(value);
      if (!answer) {
        markEmpty(label);
        continue;
      }
      answers.push({ label, answer });
    }
  }

  return { answers, emptyLabelKeys, emptyCount };
};

/** Usable answers only (empty string / [] filtered out). */
export const normalizeAshbyAiAnswers = (response: unknown): AshbyAiAnswer[] =>
  parseAshbyAiFillResponse(response).answers;

/**
 * Normalize for option matching while **keeping digits**.
 * `fromatStirngInLowerCase` strips digits, which breaks Ashby age radios
 * like "30-39" / "40-49" (they collapse to empty and never match).
 */
const normalizeForMatch = (text: string): string =>
  cleanLabelText(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const YES_ANSWERS = new Set(["yes", "y", "true", "1"]);
const NO_ANSWERS = new Set(["no", "n", "false", "0"]);

const matchOption = (answer: string, options: string[]): string | null => {
  if (!answer?.trim() || options.length === 0) return null;

  const cleanAnswer = cleanLabelText(answer);
  const normalizedAnswer = normalizeForMatch(answer);
  if (!normalizedAnswer) return null;

  // 1. Exact (cleaned whitespace / nbsp)
  for (const option of options) {
    if (cleanLabelText(option) === cleanAnswer) return option;
  }

  // 2. Exact after alphanumeric normalize (keeps digits: "30-39" → "3039")
  for (const option of options) {
    if (normalizeForMatch(option) === normalizedAnswer) return option;
  }

  // 3. Also try legacy formatter (letters-only) when both sides survive it
  const legacyAnswer = fromatStirngInLowerCase(cleanAnswer);
  if (legacyAnswer) {
    for (const option of options) {
      if (fromatStirngInLowerCase(option) === legacyAnswer) return option;
    }
  }

  // 4. Yes/No aliases (AI may return true/false/y/n)
  if (YES_ANSWERS.has(normalizedAnswer) || YES_ANSWERS.has(legacyAnswer ?? "")) {
    const hit = options.find((o) => YES_ANSWERS.has(normalizeForMatch(o)));
    if (hit) return hit;
  }
  if (NO_ANSWERS.has(normalizedAnswer) || NO_ANSWERS.has(legacyAnswer ?? "")) {
    // Prefer exact "No" over soft-matching "None of the above"
    const hit = options.find((o) => normalizeForMatch(o) === "no");
    if (hit) return hit;
  }

  // 5. Soft includes — only when answer token is long enough to avoid
  // "no" ⊂ "noneoftheabove" false positives
  if (normalizedAnswer.length >= 4) {
    let best: { option: string; score: number } | null = null;
    for (const option of options) {
      const n = normalizeForMatch(option);
      if (!n) continue;
      let score = 0;
      if (n === normalizedAnswer) score = 100;
      else if (n.includes(normalizedAnswer)) score = 50 + normalizedAnswer.length;
      else if (normalizedAnswer.includes(n) && n.length >= 4) score = 40 + n.length;
      if (score > 0 && (!best || score > best.score)) {
        best = { option, score };
      }
    }
    if (best) return best.option;
  }

  return null;
};

/** Split multi-select AI answers (comma / pipe / JSON array / newlines). */
const parseAnswerList = (answer: string): string[] => {
  const trimmed = answer.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      // fall through to delimiter split
    }
  }

  return trimmed
    .split(/\s*[,;|]\s*|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const getChoiceOptionLabel = (input: HTMLInputElement): string => {
  const id = input.id;
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel?.textContent) {
      return cleanLabelText(forLabel.textContent);
    }
  }

  const optionWrap = input.closest("[class*='_option_']");
  const wrapLabel = optionWrap?.querySelector("label");
  if (wrapLabel?.textContent) {
    return cleanLabelText(wrapLabel.textContent);
  }

  const aria = input.getAttribute("aria-label");
  if (aria) return cleanLabelText(aria);

  if (input.name && !input.name.includes("_systemfield") && input.name.length < 120) {
    return cleanLabelText(input.name);
  }

  if (input.value) return cleanLabelText(input.value);
  return "";
};

const isAshbyYesNoStateCheckbox = (checkbox: HTMLInputElement): boolean => {
  if (checkbox.closest("[class*='_yesno_']")) return true;
  if (!checkbox.id && !checkbox.closest("[class*='_option_']")) return true;
  return false;
};

/** Realistic pointer + mouse sequence for Ashby custom controls (React). */
const fullClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const opts = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent("pointerdown", opts));
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(new PointerEvent("pointerup", opts));
  element.dispatchEvent(new MouseEvent("mouseup", opts));
  element.dispatchEvent(new MouseEvent("click", opts));
  // Fallback for environments where PointerEvent click is ignored
  try {
    element.click();
  } catch {
    /* ignore */
  }
};

/**
 * Set checked via the native property descriptor so React's onChange can see it.
 */
const setNativeChecked = (input: HTMLInputElement, checked: boolean): void => {
  const proto = Object.getPrototypeOf(input) as HTMLInputElement;
  const descriptor =
    Object.getOwnPropertyDescriptor(proto, "checked") ||
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
  if (descriptor?.set) {
    descriptor.set.call(input, checked);
  } else {
    input.checked = checked;
  }
};

const fireInputChangeEvents = (input: HTMLInputElement): void => {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("click", { bubbles: true }));
};

/**
 * Select an Ashby radio/checkbox. Label-only click is often not enough for
 * custom-styled controls; try option row + native checked setter.
 */
const selectChoiceInput = async (input: HTMLInputElement): Promise<boolean> => {
  const optionRow = input.closest(
    "[class*='_option_'], [class*='option']",
  ) as HTMLElement | null;
  const label = input.id
    ? document.querySelector<HTMLElement>(`label[for="${CSS.escape(input.id)}"]`)
    : null;
  const circle =
    optionRow?.querySelector<HTMLElement>(
      "[class*='_circle_'], [class*='_container_']",
    ) ?? null;

  const trySelect = async (fn: () => void): Promise<boolean> => {
    try {
      fn();
    } catch {
      /* continue */
    }
    await delay(40);
    return input.checked;
  };

  // Prefer label (associates via `for`)
  if (label && (await trySelect(() => fullClick(label)))) return true;

  // Visible option row / custom circle
  if (optionRow && (await trySelect(() => fullClick(optionRow)))) return true;
  if (circle && (await trySelect(() => fullClick(circle)))) return true;

  // Native + React bridge
  if (
    await trySelect(() => {
      setNativeChecked(input, true);
      fullClick(input);
      fireInputChangeEvents(input);
    })
  ) {
    return true;
  }

  // Last resort
  setNativeChecked(input, true);
  await handleValueChanges(input);
  await delay(40);
  return input.checked;
};

const findAnswerForLabel = (
  label: string,
  answers: AshbyAiAnswer[],
): AshbyAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  // Soft field match (AI may shorten long Ashby questions)
  if (normalized.length >= 12) {
    const soft = answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 8) return false;
      return n.includes(normalized) || normalized.includes(n);
    });
    if (soft) return soft;
  }

  // Digit-preserving soft match for option-heavy questions
  const compact = normalizeForMatch(label);
  if (compact.length >= 12) {
    return answers.find((item) => {
      const n = normalizeForMatch(item.label);
      if (!n || n.length < 8) return false;
      return n.includes(compact) || compact.includes(n);
    });
  }

  return undefined;
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const closeListbox = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const clickOptionElement = (optionEl: HTMLElement): void => {
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  optionEl.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, cancelable: true }),
  );
  optionEl.click();
};

/**
 * Set value through the native setter so React controlled inputs pick it up.
 */
const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAshbyAnswer(answer)) return false;

  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  return isUsableAshbyAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAshbyAnswer(answer)) return false;
  const options = Array.from(select.options).map((opt) =>
    cleanLabelText(opt.textContent ?? opt.value),
  );
  const matched = matchOption(answer, options);
  if (!matched) return false;

  for (const option of select.options) {
    const optionText = cleanLabelText(option.textContent ?? option.value);
    if (optionText === matched) {
      select.value = option.value;
      option.selected = true;
      await handleValueChanges(select);
      return true;
    }
  }

  return false;
};

/** Location-style combobox: pick list option, or type free-text when options aren't listed. */
const fillAshbyCombobox = async (
  element: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAshbyAnswer(answer)) return false;
  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(100);
  }

  element.focus();
  element.click();
  await delay(200);
  await waitForDomUpdate();

  // Type into combobox when it's an input (helps filter remote options)
  if (element instanceof HTMLInputElement) {
    element.value = answer;
    await handleValueChanges(element);
    await delay(250);
    await waitForDomUpdate();
  }

  let optionEls = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[role='listbox'] [role='option'], [role='option']",
    ),
  ).filter((opt) => {
    const style = window.getComputedStyle(opt);
    return style.display !== "none" && style.visibility !== "hidden";
  });

  if (optionEls.length === 0) {
    await delay(200);
    await waitForDomUpdate();
    optionEls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[role='listbox'] [role='option'], [role='option']",
      ),
    ).filter((opt) => {
      const style = window.getComputedStyle(opt);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }

  if (optionEls.length > 0) {
    const labels = optionEls.map((opt) => cleanLabelText(opt.textContent ?? ""));
    const matchedLabel = matchOption(answer, labels);
    if (matchedLabel) {
      const target = optionEls.find(
        (opt) => cleanLabelText(opt.textContent ?? "") === matchedLabel,
      );
      if (target) {
        clickOptionElement(target);
        await delay(200);
        if (element instanceof HTMLInputElement) {
          await handleValueChanges(element);
        }
        return true;
      }
    }
  }

  // Free-text fallback (e.g. "city and country" location)
  if (element instanceof HTMLInputElement) {
    element.focus();
    element.value = answer;
    await handleValueChanges(element);
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    element.dispatchEvent(
      new KeyboardEvent("keyup", { key: "Enter", bubbles: true }),
    );
    await delay(150);
    closeListbox();
    return true;
  }

  closeListbox();
  return false;
};

/** Multi-select survey checkboxes ("select all that apply"). */
const fillCheckboxGroup = async (
  entry: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAshbyAnswer(answer)) return false;
  const checkboxes = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  ).filter((cb) => !isAshbyYesNoStateCheckbox(cb));

  if (checkboxes.length === 0) return false;

  const labeled = checkboxes
    .map((cb) => ({
      input: cb,
      label: getChoiceOptionLabel(cb),
    }))
    .filter((item) => item.label);

  if (labeled.length === 0) return false;

  const optionLabels = labeled.map((item) => item.label);
  const parts = parseAnswerList(answer);
  // Prefer multi-parts; if single part, still try whole string first
  const wholeMatch = matchOption(answer, optionLabels);
  const candidates =
    parts.length > 1
      ? parts
      : wholeMatch
        ? [wholeMatch]
        : parts.length === 1
          ? parts
          : [answer];

  let filledAny = false;

  for (const part of candidates) {
    const matched = matchOption(part, optionLabels);
    if (!matched) continue;
    const target = labeled.find((item) => item.label === matched);
    if (!target) continue;
    if (target.input.checked) {
      filledAny = true;
      continue;
    }
    const ok = await selectChoiceInput(target.input);
    if (ok || target.input.checked) filledAny = true;
  }

  return filledAny;
};

const fillOptionGroup = async (
  entry: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAshbyAnswer(answer)) return false;
  // Multi-select checkboxes (ethnicity, communities, etc.)
  const labeledCheckboxes = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  ).filter((cb) => !isAshbyYesNoStateCheckbox(cb) && getChoiceOptionLabel(cb));

  if (labeledCheckboxes.length > 0) {
    return fillCheckboxGroup(entry, answer);
  }

  // Native radios (diversity age/gender, etc.)
  const radios = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length > 0) {
    const labeled = radios.map((radio) => ({
      input: radio,
      label: getChoiceOptionLabel(radio),
    }));
    const labels = labeled.map((item) => item.label).filter(Boolean);
    const matched = matchOption(answer, labels);
    if (!matched) {
      // Try each raw label from sibling text if name only
      const altLabels = labeled.map((item) => {
        const row = item.input.closest("[class*='_option_']");
        return cleanLabelText(row?.textContent ?? item.label);
      });
      const altMatch = matchOption(answer, altLabels);
      if (!altMatch) return false;
      const idx = altLabels.indexOf(altMatch);
      const radio = radios[idx];
      if (!radio) return false;
      return selectChoiceInput(radio);
    }

    const target = labeled.find((item) => item.label === matched);
    if (!target) return false;
    return selectChoiceInput(target.input);
  }

  // Button / role-based choices (Ashby Yes/No toggles)
  const buttons = Array.from(
    entry.querySelectorAll<HTMLElement>(
      "button, [role='radio'], [role='option']",
    ),
  ).filter((btn) => {
    const text = cleanLabelText(btn.textContent ?? "");
    if (!text || text.length > 80) return false;
    return !/replace|delete|remove|submit|continue|upload/i.test(text);
  });

  if (buttons.length === 0) return false;

  const labels = buttons.map((btn) => cleanLabelText(btn.textContent ?? ""));
  const matched = matchOption(answer, labels);
  if (!matched) return false;

  const target = buttons.find(
    (btn) => cleanLabelText(btn.textContent ?? "") === matched,
  );
  if (!target) return false;

  fullClick(target);
  await delay(100);
  // Ashby yes/no is button-driven; click is sufficient for React state
  return true;
};

const fillField = async (
  field: AshbyCandidateField,
  answer: string,
): Promise<boolean> => {
  // Never write or score empty / null / placeholder API values as filled
  if (!isUsableAshbyAnswer(answer)) return false;

  if (field.kind === "option-group" || field.kind === "checkbox-group") {
    return fillOptionGroup(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox") {
    return fillAshbyCombobox(field.element, answer);
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(field.element, answer);
  }

  return false;
};

/**
 * Applies AI fill answers to the current Ashby job application form.
 *
 * Stats:
 * - `filled` = only fields with a usable non-empty API answer AND successful DOM write
 * - empty string / empty array / null / placeholders → not filled (skipped)
 * - labels with empty API values never soft-match other answers
 */
export const autofillAshbyWithAi = async (
  response: unknown,
): Promise<AshbyAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseAshbyAiFillResponse(response);
  const candidates = collectAshbyCandidateFields();

  let filled = 0;
  let failed = 0;
  let skipped = 0;

  // No usable answers and no empty markers → every form field is "not filled"
  if (answers.length === 0 && emptyCount === 0) {
    return {
      total: 0,
      filled: 0,
      failed: 0,
      skipped: candidates.length,
    };
  }

  for (const field of candidates) {
    // API returned "" / [] / null for this label → never fill, never soft-match others
    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    // Missing or empty answer → not filled
    if (!isUsableAshbyAnswer(answer)) {
      skipped += 1;
      continue;
    }

    try {
      field.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      await delay(150);

      const ok = await fillField(field, answer as string);
      if (ok) {
        filled += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }

    await delay(200);
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
