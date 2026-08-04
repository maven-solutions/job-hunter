import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { collectGreenhouseCandidateFields } from "./scan.greenhouse";

export interface GreenhouseAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface GreenhouseAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

type FieldKind = "text" | "combobox" | "select" | "phone-country";

interface DomField {
  element: HTMLElement;
  label: string;
  kind: FieldKind;
}

const cleanLabelText = (text: string): string =>
  text.replace(/\*/g, "").replace(/\s+/g, " ").trim();

const normalizeLabel = (label: string): string =>
  fromatStirngInLowerCase(cleanLabelText(label)) ?? "";

/**
 * API placeholders that should not count as a real fill value.
 * Note: "N/A" is a real answer on Greenhouse forms (e.g. previous email) — do NOT treat as empty.
 */
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

/**
 * True only when the API returned a usable non-empty answer.
 * empty string / empty array / null / "null" / "N/A" must NOT count as filled.
 */
export const isUsableGreenhouseAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  // [] or [null, "", ...] → empty
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableGreenhouseAnswer(v));
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
    return isUsableGreenhouseAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

/** Coerce a raw API answer into a display/fill string, or "" if unusable. */
const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableGreenhouseAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableGreenhouseAnswer(v))
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

const isEmptyApiAnswer = (raw: unknown): boolean =>
  !isUsableGreenhouseAnswer(raw);

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

export interface GreenhouseParsedFillResponse {
  /** Usable non-empty answers only */
  answers: GreenhouseAiAnswer[];
  /**
   * Label keys for which the API returned empty string / empty array /
   * null / placeholder — those fields must NOT be filled or soft-matched.
   */
  emptyLabelKeys: Set<string>;
  /** How many API items had an empty/null/[] answer. */
  emptyCount: number;
}

/**
 * Parse fill API response into usable answers + labels that came back empty.
 */
export const parseGreenhouseAiFillResponse = (
  response: unknown,
): GreenhouseParsedFillResponse => {
  const answers: GreenhouseAiAnswer[] = [];
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

/** Usable answers only (empty string / [] filtered out). */
export const normalizeGreenhouseAiAnswers = (
  response: unknown,
): GreenhouseAiAnswer[] => parseGreenhouseAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  const normalizedAnswer = fromatStirngInLowerCase(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (fromatStirngInLowerCase(option) === normalizedAnswer) {
      return option;
    }
  }

  for (const option of options) {
    const normalizedOption = fromatStirngInLowerCase(option);
    if (
      normalizedOption?.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedOption ?? "")
    ) {
      return option;
    }
  }

  return null;
};

const findAnswerForLabel = (
  label: string,
  answers: GreenhouseAiAnswer[],
): GreenhouseAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  return answers.find((item) => normalizeLabel(item.label) === normalized);
};

const getComboboxToggleButton = (
  element: HTMLInputElement,
): HTMLButtonElement | null =>
  element
    .closest(".select-shell, .select__container, .select")
    ?.querySelector(
      'button[aria-label="Toggle flyout"]',
    ) as HTMLButtonElement | null;

const closeCombobox = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const clickToggleFlyout = (toggleBtn: HTMLButtonElement): void => {
  toggleBtn.focus();
  toggleBtn.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  toggleBtn.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  toggleBtn.click();
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const isNodeVisible = (node: HTMLElement): boolean => {
  if (!node.isConnected) return false;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
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

interface ScannedSelectOption {
  label: string;
  element: HTMLElement;
}

const scanSelectOptionsFromDom = (
  element: HTMLInputElement,
): ScannedSelectOption[] => {
  const results: ScannedSelectOption[] = [];
  const seen = new Set<string>();

  const addOption = (optionEl: HTMLElement) => {
    const label = cleanLabelText(optionEl.textContent ?? "");
    if (!label || seen.has(label)) return;
    seen.add(label);
    results.push({ label, element: optionEl });
  };

  if (element.id) {
    const listbox = document.getElementById(
      `react-select-${element.id}-listbox`,
    );
    listbox
      ?.querySelectorAll<HTMLElement>(
        ".select__option[role='option'], [role='option']",
      )
      .forEach(addOption);
  }

  document.querySelectorAll<HTMLElement>(".select__menu").forEach((menu) => {
    if (element.id) {
      const linkedListbox = menu.querySelector(
        `#react-select-${element.id}-listbox`,
      );
      if (linkedListbox) {
        linkedListbox
          .querySelectorAll<HTMLElement>(
            ".select__option[role='option'], [role='option']",
          )
          .forEach(addOption);
        return;
      }
    }

    if (isNodeVisible(menu)) {
      menu
        .querySelectorAll<HTMLElement>(
          ".select__option[role='option'], [role='option']",
        )
        .forEach(addOption);
    }
  });

  if (results.length === 0) {
    document
      .querySelectorAll<HTMLElement>(
        `[id="react-select-${element.id}-listbox"] .select__option, .select__menu-list [role="option"], [role="listbox"] [role="option"]`,
      )
      .forEach(addOption);
  }

  return results;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableGreenhouseAnswer(answer)) return false;
  element.focus();
  element.value = answer;
  await handleValueChanges(element);
  return isUsableGreenhouseAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableGreenhouseAnswer(answer)) return false;
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

const fillGreenhouseCombobox = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableGreenhouseAnswer(answer)) return false;
  if (element.getAttribute("aria-expanded") === "true") {
    closeCombobox();
    await delay(150);
  }

  const toggleBtn = getComboboxToggleButton(element);
  if (!toggleBtn) {
    return false;
  }

  clickToggleFlyout(toggleBtn);
  await delay(300);
  await waitForDomUpdate();

  let scanned = scanSelectOptionsFromDom(element);
  if (scanned.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    scanned = scanSelectOptionsFromDom(element);
  }

  if (scanned.length === 0) {
    closeCombobox();
    return false;
  }

  const matchedLabel = matchOption(
    answer,
    scanned.map((opt) => opt.label),
  );
  if (!matchedLabel) {
    closeCombobox();
    return false;
  }

  const target = scanned.find((opt) => opt.label === matchedLabel);
  if (!target) {
    closeCombobox();
    return false;
  }

  clickOptionElement(target.element);
  await delay(300);
  await handleValueChanges(element);

  const selectedValue = element
    .closest(".select-shell, .select")
    ?.querySelector(".select__single-value");

  return (
    element.getAttribute("aria-expanded") === "false" ||
    !!selectedValue?.textContent?.trim()
  );
};

const openItiCountryDropdown = async (): Promise<boolean> => {
  const selectedFlag =
    document.querySelector<HTMLElement>(".iti__selected-flag") ||
    document.querySelector<HTMLElement>(".iti__selected-country");
  if (!selectedFlag) return false;

  selectedFlag.click();
  await delay(250);
  return true;
};

const fillPhoneCountryCode = async (answer: string): Promise<boolean> => {
  if (!isUsableGreenhouseAnswer(answer)) return false;

  // Prefer Greenhouse react-select country combobox inside phone input
  const greenhouseCountry = document.querySelector<HTMLInputElement>(
    ".phone-input__country input[role='combobox'], .phone-input__country .select__input, #country",
  );
  if (greenhouseCountry) {
    return fillGreenhouseCombobox(greenhouseCountry, answer);
  }

  const opened = await openItiCountryDropdown();
  if (!opened) {
    return false;
  }

  const countries = Array.from(
    document.querySelectorAll<HTMLElement>(".iti__country-list .iti__country"),
  );

  const labels = countries.map((item) => {
    const name = cleanLabelText(
      item.querySelector(".iti__country-name")?.textContent ?? "",
    );
    const dial = cleanLabelText(
      item.querySelector(".iti__dial-code")?.textContent ?? "",
    );
    return `${name} ${dial}`.trim();
  });

  const matched = matchOption(answer, labels);
  if (!matched) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    return false;
  }

  const index = labels.indexOf(matched);
  const target = countries[index];
  if (!target) return false;

  target.scrollIntoView({ block: "nearest" });
  target.click();
  await delay(200);
  return true;
};

const fillField = async (field: DomField, answer: string): Promise<boolean> => {
  // Never write or score empty / null / placeholder API values as filled
  if (!isUsableGreenhouseAnswer(answer)) return false;

  if (field.kind === "phone-country") {
    return fillPhoneCountryCode(answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox" && field.element instanceof HTMLInputElement) {
    return fillGreenhouseCombobox(field.element, answer);
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
 * Applies AI fill answers to the current Greenhouse job application form.
 *
 * Stats:
 * - `filled` = only fields with a usable non-empty API answer AND successful DOM write
 * - empty string / empty array / null / placeholders → not filled (skipped)
 * - labels with empty API values never soft-match other answers
 */
export const autofillGreenhouseWithAi = async (
  response: unknown,
): Promise<GreenhouseAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseGreenhouseAiFillResponse(response);

  const candidates = collectGreenhouseCandidateFields().map(
    (candidate): DomField => ({
      element: candidate.element,
      label: candidate.label,
      kind: candidate.kind,
    }),
  );

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
    if (!isUsableGreenhouseAnswer(answer)) {
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
