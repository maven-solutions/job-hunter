import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  MetacareersCandidateField,
  cleanMetacareersLabelText,
  collectMetacareersCandidateFields,
  getMetacareersChoiceOptionLabel,
} from "./scan.metacareers";

export interface MetacareersAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface MetacareersAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

const cleanLabelText = cleanMetacareersLabelText;

const normalizeLabel = (label: string): string =>
  fromatStirngInLowerCase(cleanLabelText(label)) ?? "";

const EMPTY_ANSWER_TOKENS = new Set([
  "",
  "null",
  "undefined",
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

export const isUsableMetacareersAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableMetacareersAnswer(v));
  }

  if (typeof value === "object") {
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
    return isUsableMetacareersAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableMetacareersAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableMetacareersAnswer(v))
      .join("; ");
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

const extractRawAnswer = (item: any): unknown => {
  if (item == null || typeof item !== "object") return undefined;
  if ("answer" in item) return item.answer;
  if ("value" in item) return item.value;
  if ("fill" in item) return item.fill;
  if ("text" in item) return item.text;
  if ("data" in item) return item.data;
  return undefined;
};

const isEmptyApiAnswer = (raw: unknown): boolean =>
  !isUsableMetacareersAnswer(raw);

const addLabelKey = (set: Set<string>, label: string): void => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return;
  const n = normalizeLabel(cleaned);
  if (n) set.add(n);
  const compact = cleaned
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  if (compact) set.add(compact);
};

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

  if (n && n.length >= 8) {
    for (const key of emptyLabelKeys) {
      if (key.length < 8) continue;
      if (n === key || n.includes(key) || key.includes(n)) return true;
    }
  }
  return false;
};

export interface MetacareersParsedFillResponse {
  answers: MetacareersAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseMetacareersAiFillResponse = (
  response: unknown,
): MetacareersParsedFillResponse => {
  const answers: MetacareersAiAnswer[] = [];
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

export const normalizeMetacareersAiAnswers = (
  response: unknown,
): MetacareersAiAnswer[] => parseMetacareersAiFillResponse(response).answers;

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

  for (const option of options) {
    if (cleanLabelText(option) === cleanAnswer) return option;
  }

  for (const option of options) {
    if (normalizeForMatch(option) === normalizedAnswer) return option;
  }

  const legacyAnswer = fromatStirngInLowerCase(cleanAnswer);
  if (legacyAnswer) {
    for (const option of options) {
      if (fromatStirngInLowerCase(option) === legacyAnswer) return option;
    }
  }

  if (YES_ANSWERS.has(normalizedAnswer) || YES_ANSWERS.has(legacyAnswer ?? "")) {
    const hit = options.find((o) => YES_ANSWERS.has(normalizeForMatch(o)));
    if (hit) return hit;
  }
  if (NO_ANSWERS.has(normalizedAnswer) || NO_ANSWERS.has(legacyAnswer ?? "")) {
    const hit = options.find((o) => normalizeForMatch(o) === "no");
    if (hit) return hit;
  }

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

/** City, ST locations must not split on commas. */
const matchLocationOptions = (answer: string, options: string[]): string[] => {
  const normalizedAnswer = normalizeForMatch(answer);
  const included = options.filter((opt) => {
    const n = normalizeForMatch(opt);
    return n.length >= 4 && normalizedAnswer.includes(n);
  });
  if (included.length > 0) return included;

  const parts = answer
    .split(/\s*[;|\n]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const matched: string[] = [];
  for (const part of parts) {
    const hit = matchOption(part, options);
    if (hit && !matched.includes(hit)) matched.push(hit);
  }
  if (matched.length > 0) return matched;

  const whole = matchOption(answer, options);
  return whole ? [whole] : [];
};

const findAnswerForLabel = (
  label: string,
  answers: MetacareersAiAnswer[],
): MetacareersAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  if (normalized.length >= 12) {
    const soft = answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 8) return false;
      return n.includes(normalized) || normalized.includes(n);
    });
    if (soft) return soft;
  }

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

const fullClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const opts = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent("pointerdown", opts));
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(new PointerEvent("pointerup", opts));
  element.dispatchEvent(new MouseEvent("mouseup", opts));
  element.dispatchEvent(new MouseEvent("click", opts));
  try {
    element.click();
  } catch {
    /* ignore */
  }
};

const clickOptionElement = (optionEl: HTMLElement): void => {
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  fullClick(optionEl);
};

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

const setNativeChecked = (input: HTMLInputElement, checked: boolean): void => {
  const descriptor =
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input) as HTMLInputElement,
      "checked",
    ) || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
  if (descriptor?.set) {
    descriptor.set.call(input, checked);
  } else {
    input.checked = checked;
  }
};

const isChoiceSelected = (input: HTMLInputElement): boolean =>
  input.checked || input.getAttribute("aria-checked") === "true";

const selectChoiceInput = async (input: HTMLInputElement): Promise<boolean> => {
  if (input.disabled) return false;
  if (isChoiceSelected(input)) return true;

  const label = input.closest("label") as HTMLElement | null;
  if (label) {
    fullClick(label);
    await delay(60);
    if (isChoiceSelected(input)) return true;
  }

  fullClick(input);
  setNativeChecked(input, true);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await delay(40);
  return isChoiceSelected(input) || !!label;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableMetacareersAnswer(answer)) return false;

  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      data: answer,
      inputType: "insertText",
    }),
  );
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  return isUsableMetacareersAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableMetacareersAnswer(answer)) return false;
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

const collectVisibleOptionElements = (): HTMLElement[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      "[role='listbox'] [role='option'], [role='option']",
    ),
  ).filter((opt) => {
    if (!opt.isConnected) return false;
    const style = window.getComputedStyle(opt);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = opt.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

const waitForOptionElements = (timeoutMs = 800): Promise<HTMLElement[]> =>
  new Promise((resolve) => {
    const existing = collectVisibleOptionElements();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const opts = collectVisibleOptionElements();
      if (opts.length > 0) {
        observer.disconnect();
        window.clearTimeout(timer);
        resolve(opts);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(collectVisibleOptionElements());
    }, timeoutMs);
  });

const findPopoverSearchInput = (combobox: HTMLElement): HTMLInputElement | null => {
  const controls = combobox.getAttribute("aria-controls");
  if (controls) {
    const popover = document.getElementById(controls);
    const inPopover = popover?.querySelector<HTMLInputElement>(
      "input:not([type='hidden']):not([type='file']):not([type='checkbox']):not([type='radio'])",
    );
    if (inPopover) return inPopover;
  }

  const expanded = document.querySelectorAll<HTMLInputElement>(
    "input[role='combobox'], [role='dialog'] input, [role='listbox'] ~ input, [aria-expanded='true'] input",
  );
  for (const input of Array.from(expanded)) {
    const style = window.getComputedStyle(input);
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (input.getBoundingClientRect().height > 0) return input;
  }

  return null;
};

const typeIntoSearch = async (
  input: HTMLInputElement,
  answer: string,
): Promise<void> => {
  input.focus();
  setNativeValue(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await delay(40);
  setNativeValue(input, answer);
  input.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      data: answer,
      inputType: "insertText",
    }),
  );
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(input);
};

const fillMetacareersCombobox = async (
  element: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableMetacareersAnswer(answer)) return false;

  const current = cleanLabelText(element.textContent ?? "");
  if (current && normalizeForMatch(current) === normalizeForMatch(answer)) {
    return true;
  }

  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(80);
  }

  element.focus();
  fullClick(element);
  await waitForDomUpdate();

  const searchInput = findPopoverSearchInput(element);
  if (searchInput) {
    await typeIntoSearch(searchInput, answer);
    await delay(200);
  } else if (element instanceof HTMLInputElement) {
    await typeIntoSearch(element, answer);
    await delay(200);
  }

  let optionEls = await waitForOptionElements(800);
  if (optionEls.length === 0) {
    await delay(200);
    await waitForDomUpdate();
    optionEls = collectVisibleOptionElements();
  }

  if (optionEls.length > 0) {
    const labels = optionEls.map((opt) =>
      cleanLabelText(opt.textContent ?? ""),
    );
    const matchedLabel = matchOption(answer, labels);
    if (matchedLabel) {
      const target = optionEls.find(
        (opt) => cleanLabelText(opt.textContent ?? "") === matchedLabel,
      );
      if (target) {
        clickOptionElement(target);
        await delay(200);
        return true;
      }
    }
  }

  if (searchInput) {
    searchInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    searchInput.dispatchEvent(
      new KeyboardEvent("keyup", { key: "Enter", bubbles: true }),
    );
    await delay(150);
    closeListbox();
    return true;
  }

  closeListbox();
  return false;
};

const fillCheckboxGroup = async (
  entry: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableMetacareersAnswer(answer)) return false;

  const checkboxes = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  );
  if (checkboxes.length === 0) return false;

  const labeled = checkboxes
    .map((cb) => ({
      input: cb,
      label: getMetacareersChoiceOptionLabel(cb),
    }))
    .filter((item) => item.label);

  if (labeled.length === 0) return false;

  const optionLabels = labeled.map((item) => item.label);
  const targets = matchLocationOptions(answer, optionLabels);
  if (targets.length === 0) return false;

  let filledAny = false;
  for (const matched of targets) {
    const target = labeled.find((item) => item.label === matched);
    if (!target) continue;
    if (isChoiceSelected(target.input)) {
      filledAny = true;
      continue;
    }
    const ok = await selectChoiceInput(target.input);
    if (ok || isChoiceSelected(target.input)) filledAny = true;
  }

  return filledAny;
};

const fillOptionGroup = async (
  entry: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableMetacareersAnswer(answer)) return false;

  const radios = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  ).filter((radio) => !radio.disabled);

  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => ({
    input: radio,
    label: getMetacareersChoiceOptionLabel(radio),
  }));
  const labels = labeled.map((item) => item.label).filter(Boolean);
  const matched = matchOption(answer, labels);
  if (!matched) return false;

  const target = labeled.find((item) => item.label === matched);
  if (!target) return false;
  return selectChoiceInput(target.input);
};

const KIND_ORDER: Record<MetacareersCandidateField["kind"], number> = {
  "checkbox-group": 0,
  text: 1,
  select: 2,
  combobox: 2,
  "phone-country": 2,
  "option-group": 3,
};

const fillField = async (
  field: MetacareersCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableMetacareersAnswer(answer)) return false;

  if (field.kind === "checkbox-group") {
    return fillCheckboxGroup(field.element, answer);
  }

  if (field.kind === "option-group") {
    return fillOptionGroup(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox" || field.kind === "phone-country") {
    return fillMetacareersCombobox(field.element, answer);
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(field.element, answer);
  }

  return false;
};

const waitForEnabledRadios = async (
  group: HTMLElement,
  timeoutMs = 1200,
): Promise<boolean> => {
  if (group.querySelector("input[type='radio']:not([disabled])")) {
    return true;
  }

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (group.querySelector("input[type='radio']:not([disabled])")) {
        observer.disconnect();
        window.clearTimeout(timer);
        resolve(true);
      }
    });
    observer.observe(group, {
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled"],
      childList: true,
    });
    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(!!group.querySelector("input[type='radio']:not([disabled])"));
    }, timeoutMs);
  });
};

/**
 * Applies AI fill answers to the current Meta Careers job application form.
 */
export const autofillMetacareersWithAi = async (
  response: unknown,
): Promise<MetacareersAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseMetacareersAiFillResponse(response);
  const candidates = collectMetacareersCandidateFields().slice().sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind],
  );

  let filled = 0;
  let failed = 0;
  let skipped = 0;

  if (answers.length === 0 && emptyCount === 0) {
    return {
      total: 0,
      filled: 0,
      failed: 0,
      skipped: candidates.length,
    };
  }

  let filledLocationGroup = false;

  for (const field of candidates) {
    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableMetacareersAnswer(answer)) {
      skipped += 1;
      continue;
    }

    try {
      if (field.kind === "option-group" && filledLocationGroup) {
        await waitForEnabledRadios(field.element);
      }

      field.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      await delay(120);

      const ok = await fillField(field, answer as string);
      if (ok) {
        filled += 1;
        if (field.kind === "checkbox-group") {
          filledLocationGroup = true;
          await delay(250);
        }
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }

    await delay(150);
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
