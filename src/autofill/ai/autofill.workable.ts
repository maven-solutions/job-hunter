import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  collectWorkableCandidateFields,
  WorkableCandidateField,
} from "./scan.workable";

export interface WorkableAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface WorkableAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

const cleanLabelText = (text: string): string =>
  text
    .replace(/\(optional\)/gi, "")
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

export const isUsableWorkableAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableWorkableAnswer(v));
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
    return isUsableWorkableAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (typeof raw === "boolean") return raw ? "YES" : "NO";
  if (!isUsableWorkableAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableWorkableAnswer(v))
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

const extractRawAnswer = (item: any): unknown => {
  if (item == null || typeof item !== "object") return undefined;
  if ("answer" in item) return item.answer;
  if ("value" in item) return item.value;
  if ("fill" in item) return item.fill;
  if ("text" in item) return item.text;
  if ("data" in item) return item.data;
  return undefined;
};

const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableWorkableAnswer(raw);

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

export interface WorkableParsedFillResponse {
  answers: WorkableAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseWorkableAiFillResponse = (
  response: unknown,
): WorkableParsedFillResponse => {
  const answers: WorkableAiAnswer[] = [];
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
        typeof value !== "boolean" &&
        !Array.isArray(value)
      ) {
        processItem({ label, ...(value as object) });
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

/** Alias used by README naming. */
export const normalizeWorkableAiAnswers = (
  response: unknown,
): WorkableAiAnswer[] => parseWorkableAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  const normalizedAnswer = fromatStirngInLowerCase(answer) ?? "";
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
  answers: WorkableAiAnswer[],
): WorkableAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const exactNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (exactNorm) return exactNorm;

  if (normalized && normalized.length >= 8) {
    return answers.find((item) => {
      const other = normalizeLabel(item.label);
      if (!other || other.length < 8) return false;
      return other.includes(normalized) || normalized.includes(other);
    });
  }

  return undefined;
};

const fullClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const opts = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent("pointerdown", opts));
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(new MouseEvent("mouseup", opts));
  element.dispatchEvent(new PointerEvent("pointerup", opts));
  element.dispatchEvent(new MouseEvent("click", opts));
  try {
    element.click();
  } catch {
    /* ignore */
  }
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
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "checked") ||
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
  if (descriptor?.set) {
    descriptor.set.call(input, checked);
  } else {
    input.checked = checked;
  }
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const closeWorkableMenus = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkableAnswer(answer)) return false;
  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  element.blur();
  return isUsableWorkableAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkableAnswer(answer)) return false;
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

const getRadioOptionLabel = (optionEl: HTMLElement): string => {
  const named = optionEl.querySelector<HTMLElement>("[id^='radio_label_']");
  if (named?.textContent) return cleanLabelText(named.textContent);

  const clone = optionEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("input, svg").forEach((el) => el.remove());
  return cleanLabelText(clone.textContent ?? "");
};

const yesNoMatch = (
  answer: string,
  optionLabel: string,
  optionValue: string,
): boolean => {
  const a = answer.trim().toLowerCase();
  const label = optionLabel.trim().toLowerCase();
  const value = optionValue.trim().toLowerCase();

  const answerYes = /^(yes|y|true|1)$/.test(a);
  const answerNo = /^(no|n|false|0)$/.test(a);
  const optionYes = /^(yes|y|true|1)$/.test(label) || value === "true";
  const optionNo = /^(no|n|false|0)$/.test(label) || value === "false";

  if (answerYes && optionYes) return true;
  if (answerNo && optionNo) return true;
  return false;
};

const fillRadioGroup = async (
  fieldset: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkableAnswer(answer)) return false;

  const options = Array.from(
    fieldset.querySelectorAll<HTMLElement>(
      "[data-ui='option'][role='radio'], [role='radio']",
    ),
  );

  const labeled = options.map((optionEl) => {
    const input = optionEl.querySelector<HTMLInputElement>("input[type='radio']");
    return {
      optionEl,
      input,
      label: getRadioOptionLabel(optionEl),
      value: input?.value ?? "",
    };
  });

  if (labeled.length === 0) {
    fieldset.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach((input) => {
      labeled.push({
        optionEl: (input.closest("label") as HTMLElement) || input,
        input,
        label: cleanLabelText(
          input.closest("label")?.textContent ?? input.value,
        ),
        value: input.value,
      });
    });
  }

  const labels = labeled.map((item) => item.label).filter(Boolean);
  let matched =
    matchOption(answer, labels) ||
    matchOption(
      answer,
      labeled.map((item) => item.value),
    );

  if (!matched) {
    const byYesNo = labeled.find((item) =>
      yesNoMatch(answer, item.label, item.value),
    );
    matched = byYesNo?.label ?? null;
  }

  if (!matched) return false;

  const target =
    labeled.find((item) => item.label === matched) ||
    labeled.find((item) => item.value === matched);
  if (!target) return false;

  fullClick(target.optionEl);
  await delay(80);

  if (target.optionEl.getAttribute("aria-checked") === "true") return true;
  if (target.input?.checked) return true;

  if (target.input) {
    setNativeChecked(target.input, true);
    await handleValueChanges(target.input);
    await delay(40);
    return target.input.checked;
  }

  return false;
};

const getComboboxWrapper = (element: HTMLElement): HTMLElement | null =>
  element.closest("[data-input-type='select']") as HTMLElement | null;

const getListboxForCombobox = (
  element: HTMLInputElement,
): HTMLElement | null => {
  const owns =
    element.getAttribute("aria-controls") || element.getAttribute("aria-owns");
  if (owns) {
    const byId = document.getElementById(owns);
    if (byId) return byId;
  }
  return (
    getComboboxWrapper(element)?.querySelector<HTMLElement>("[role='listbox']") ||
    document.querySelector<HTMLElement>("[role='listbox']")
  );
};

const scanSelectOptionsFromDom = (
  element: HTMLInputElement,
): { label: string; element: HTMLElement }[] => {
  const results: { label: string; element: HTMLElement }[] = [];
  const seen = new Set<string>();

  const addOption = (optionEl: HTMLElement) => {
    const label = cleanLabelText(optionEl.textContent ?? "");
    if (!label || seen.has(label)) return;
    seen.add(label);
    results.push({ label, element: optionEl });
  };

  getListboxForCombobox(element)
    ?.querySelectorAll<HTMLElement>("[role='option']")
    .forEach(addOption);

  if (results.length === 0) {
    document
      .querySelectorAll<HTMLElement>("[role='listbox'] [role='option']")
      .forEach(addOption);
  }

  return results;
};

const openWorkableCombobox = async (
  element: HTMLInputElement,
): Promise<void> => {
  const wrapper = getComboboxWrapper(element);
  if (
    wrapper?.getAttribute("data-open") === "true" ||
    element.getAttribute("aria-expanded") === "true"
  ) {
    return;
  }
  fullClick(element);
  await delay(200);
  await waitForDomUpdate();
  if (
    wrapper?.getAttribute("data-open") !== "true" &&
    element.getAttribute("aria-expanded") !== "true" &&
    wrapper
  ) {
    fullClick(wrapper);
    await delay(200);
    await waitForDomUpdate();
  }
};

const fillWorkableCombobox = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkableAnswer(answer)) return false;

  if (element.getAttribute("aria-expanded") === "true") {
    closeWorkableMenus();
    await delay(120);
  }

  await openWorkableCombobox(element);
  await delay(150);
  await waitForDomUpdate();

  let scanned = scanSelectOptionsFromDom(element);
  if (scanned.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    scanned = scanSelectOptionsFromDom(element);
  }

  if (scanned.length === 0) {
    closeWorkableMenus();
    return false;
  }

  const matchedLabel = matchOption(
    answer,
    scanned.map((opt) => opt.label),
  );
  if (!matchedLabel) {
    closeWorkableMenus();
    return false;
  }

  const target = scanned.find((opt) => opt.label === matchedLabel);
  if (!target) {
    closeWorkableMenus();
    return false;
  }

  fullClick(target.element);
  await delay(200);
  await handleValueChanges(element);

  const displayed = cleanLabelText(element.value ?? "");
  const wrapper = getComboboxWrapper(element);
  const hidden = wrapper?.querySelector<HTMLInputElement>(
    "input[name]:not([role='combobox'])",
  );
  const hiddenVal = cleanLabelText(hidden?.value ?? "");

  return (
    displayed.toLowerCase() === matchedLabel.toLowerCase() ||
    hiddenVal.length > 0 ||
    element.getAttribute("aria-expanded") === "false"
  );
};

const fillField = async (
  field: WorkableCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkableAnswer(answer)) return false;

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox" && field.element instanceof HTMLInputElement) {
    return fillWorkableCombobox(field.element, answer);
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
 * Applies AI fill answers to empty Workable fields (resume-parsed values are left alone).
 */
export const autofillWorkableWithAi = async (
  response: unknown,
): Promise<WorkableAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseWorkableAiFillResponse(response);
  const candidates = collectWorkableCandidateFields();

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

  for (const field of candidates) {
    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableWorkableAnswer(answer)) {
      skipped += 1;
      continue;
    }

    try {
      field.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      await delay(80);
      const ok = await fillField(field, String(answer));
      if (ok) {
        filled += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      console.error("[CareerAI Workable] Fill failed:", field.label, error);
      failed += 1;
    }
  }

  return {
    total: answers.length,
    filled,
    failed,
    skipped,
  };
};
