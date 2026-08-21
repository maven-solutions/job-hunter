import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  ApplyToJobCandidateField,
  collectApplyToJobCandidateFields,
  getApplyToJobRadioChoiceLabel,
} from "./scan.applytojob";

export interface ApplyToJobAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface ApplyToJobAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

const cleanLabelText = (text: string): string =>
  text
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

export const isUsableApplyToJobAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableApplyToJobAnswer(v));
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
    return isUsableApplyToJobAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableApplyToJobAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableApplyToJobAnswer(v))
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

const isEmptyApiAnswer = (raw: unknown): boolean =>
  !isUsableApplyToJobAnswer(raw);

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

export interface ApplyToJobParsedFillResponse {
  answers: ApplyToJobAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseApplyToJobAiFillResponse = (
  response: unknown,
): ApplyToJobParsedFillResponse => {
  const answers: ApplyToJobAiAnswer[] = [];
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

export const normalizeApplyToJobAiAnswers = (
  response: unknown,
): ApplyToJobAiAnswer[] => parseApplyToJobAiFillResponse(response).answers;

/**
 * Keep digits — JazzHR salary ranges are values like "80,000-89,999".
 * `fromatStirngInLowerCase` strips numbers and would turn those into "".
 */
const normalizeOptionText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9+]+/g, "");

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableApplyToJobAnswer(answer)) return null;

  const compactAnswer = normalizeOptionText(answer);
  if (!compactAnswer) return null;

  for (const option of options) {
    if (normalizeOptionText(option) === compactAnswer) {
      return option;
    }
  }

  const letterAnswer = fromatStirngInLowerCase(answer);
  if (letterAnswer) {
    for (const option of options) {
      if (fromatStirngInLowerCase(option) === letterAnswer) {
        return option;
      }
    }
  }

  for (const option of options) {
    const compactOption = normalizeOptionText(option);
    if (!compactOption) continue;
    const shorter = Math.min(compactAnswer.length, compactOption.length);
    // Avoid "no" matching "not a protected veteran".
    if (shorter < 8) continue;
    if (
      compactOption.includes(compactAnswer) ||
      compactAnswer.includes(compactOption)
    ) {
      return option;
    }
  }

  return null;
};

const findAnswerForLabel = (
  label: string,
  answers: ApplyToJobAiAnswer[],
): ApplyToJobAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  if (normalized.length >= 12) {
    return answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 8) return false;
      return n.includes(normalized) || normalized.includes(n);
    });
  }

  return undefined;
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

const clipToMaxLength = (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): string => {
  const max = element.maxLength;
  if (max > 0 && answer.length > max) {
    return answer.slice(0, max);
  }
  return answer;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableApplyToJobAnswer(answer)) return false;
  const value = clipToMaxLength(element, answer);
  element.focus();
  setNativeValue(element, value);
  await handleValueChanges(element);

  // JazzHR start-date uses jQuery UI datepicker.
  if (element.classList.contains("hasDatepicker")) {
    const jquery = (window as any).jQuery || (window as any).$;
    try {
      jquery?.(element)?.datepicker?.("setDate", value);
    } catch {
      // Datepicker plugin missing or date unparseable — value is still set.
    }
  }

  return isUsableApplyToJobAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableApplyToJobAnswer(answer)) return false;

  const labeled = Array.from(select.options).map((opt) => ({
    option: opt,
    label: cleanLabelText(opt.textContent ?? opt.label ?? opt.value),
    value: String(opt.value ?? "").trim(),
  }));

  const matched =
    matchOption(
      answer,
      labeled.map((item) => item.label),
    ) ||
    matchOption(
      answer,
      labeled.map((item) => item.value).filter(Boolean),
    );

  const target = labeled.find(
    (item) =>
      item.label === matched ||
      item.value === matched ||
      normalizeOptionText(item.value) === normalizeOptionText(answer) ||
      item.value === answer.trim(),
  );
  if (!target) return false;

  select.value = target.option.value;
  target.option.selected = true;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  await handleValueChanges(select);
  return true;
};

const setNativeChecked = (input: HTMLInputElement, checked: boolean): void => {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "checked",
  );
  if (descriptor?.set) {
    descriptor.set.call(input, checked);
  } else {
    input.checked = checked;
  }
};

const selectRadioInput = async (input: HTMLInputElement): Promise<boolean> => {
  const label = input.closest("label") as HTMLElement | null;
  setNativeChecked(input, true);
  if (label) {
    label.click();
  } else {
    input.click();
  }
  await handleValueChanges(input);
  return input.checked;
};

const fillRadioGroup = async (
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableApplyToJobAnswer(answer)) return false;

  const radios = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => ({
    input: radio,
    label: getApplyToJobRadioChoiceLabel(radio),
    value: String(radio.value ?? "").trim(),
  }));

  const matched =
    matchOption(
      answer,
      labeled.map((item) => item.label).filter(Boolean),
    ) ||
    matchOption(
      answer,
      labeled.map((item) => item.value).filter(Boolean),
    );

  const target = labeled.find(
    (item) =>
      item.label === matched ||
      item.value === matched ||
      normalizeOptionText(item.label) === normalizeOptionText(answer) ||
      item.value === answer.trim(),
  );
  if (!target) return false;

  if (target.input.checked) return true;
  return selectRadioInput(target.input);
};

const fillField = async (
  field: ApplyToJobCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableApplyToJobAnswer(answer)) return false;

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
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
 * Applies AI fill answers to the current JazzHR / ApplyToJob application form.
 */
export const autofillApplyToJobWithAi = async (
  response: unknown,
): Promise<ApplyToJobAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseApplyToJobAiFillResponse(response);

  const candidates = collectApplyToJobCandidateFields();

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

    if (!isUsableApplyToJobAnswer(answer)) {
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
