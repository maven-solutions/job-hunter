import { handleValueChanges } from "../helper";
import {
  closeSearchCareersCombobox,
  collectSearchCareersCandidateFields,
  getSearchCareersChoiceLabel,
  openSearchCareersCombobox,
  readSearchCareersListboxOptions,
  SearchCareersCandidateField,
  SearchCareersOptionNode,
  waitForSearchCareersFieldsToSettle,
} from "./scan.searchcareers";
import { Applicant } from "../data";

export interface SearchCareersAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface SearchCareersAiFillResult {
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
  cleanLabelText(label).toLowerCase().replace(/\s+/g, " ").trim();

const compactLabel = (label: string): string =>
  normalizeLabel(label).replace(/[^a-z0-9+]+/g, "");

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

const AFFIRMATIVE_RE =
  /^(yes|y|true|agree|i agree|i consent|consent|accept|accepted|checked)$/i;

const NEGATIVE_RE = /^(no|n|false|disagree|decline|declined|unchecked)$/i;

export const isUsableSearchCareersAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((item) => isUsableSearchCareersAnswer(item));
  }

  if (typeof value === "object") {
    const nested =
      (value as { answer?: unknown }).answer ??
      (value as { value?: unknown }).value ??
      (value as { fill?: unknown }).fill ??
      (value as { text?: unknown }).text ??
      (value as { data?: unknown }).data;
    if (nested === undefined) return false;
    return isUsableSearchCareersAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableSearchCareersAnswer(raw)) return "";
  if (typeof raw === "boolean") return raw ? "Yes" : "No";

  if (Array.isArray(raw)) {
    return raw
      .map((item) => coerceAnswerString(item))
      .filter((item) => isUsableSearchCareersAnswer(item))
      .join(", ");
  }

  if (typeof raw === "object" && raw != null) {
    const nested =
      (raw as { answer?: unknown }).answer ??
      (raw as { value?: unknown }).value ??
      (raw as { fill?: unknown }).fill ??
      (raw as { text?: unknown }).text ??
      (raw as { data?: unknown }).data;
    return coerceAnswerString(nested);
  }

  return String(raw).trim();
};

const extractRawAnswer = (item: Record<string, unknown>): unknown => {
  if ("answer" in item) return item.answer;
  if ("value" in item) return item.value;
  if ("fill" in item) return item.fill;
  if ("text" in item) return item.text;
  if ("data" in item) return item.data;
  return undefined;
};

const addLabelKey = (set: Set<string>, label: string): void => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return;
  const normalized = normalizeLabel(cleaned);
  if (normalized) set.add(normalized);
  const compact = compactLabel(cleaned);
  if (compact) set.add(compact);
};

const isFieldMarkedEmpty = (label: string, emptyLabelKeys: Set<string>): boolean => {
  if (emptyLabelKeys.size === 0) return false;
  const normalized = normalizeLabel(label);
  if (normalized && emptyLabelKeys.has(normalized)) return true;
  const compact = compactLabel(label);
  if (compact && emptyLabelKeys.has(compact)) return true;

  if (normalized && normalized.length >= 12) {
    for (const key of emptyLabelKeys) {
      if (key.length < 12) continue;
      if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
        return true;
      }
    }
  }
  return false;
};

export interface SearchCareersParsedFillResponse {
  answers: SearchCareersAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseSearchCareersAiFillResponse = (
  response: unknown,
): SearchCareersParsedFillResponse => {
  const answers: SearchCareersAiAnswer[] = [];
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
    if (!isUsableSearchCareersAnswer(raw)) {
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
      if (!isUsableSearchCareersAnswer(value)) {
        markEmpty(label);
        continue;
      }
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean" &&
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

export const normalizeSearchCareersAiAnswers = (
  response: unknown,
): SearchCareersAiAnswer[] => parseSearchCareersAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableSearchCareersAnswer(answer)) return null;
  const normalizedAnswer = normalizeLabel(answer);
  const compactAnswer = compactLabel(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (normalizeLabel(option) === normalizedAnswer) return option;
  }

  if (compactAnswer) {
    for (const option of options) {
      if (compactLabel(option) === compactAnswer) return option;
    }
  }

  for (const option of options) {
    const normalizedOption = normalizeLabel(option);
    if (!normalizedOption || normalizedOption.length < 2) continue;
    if (
      normalizedOption.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedOption)
    ) {
      return option;
    }
  }

  return null;
};

const findAnswerForLabel = (
  label: string,
  answers: SearchCareersAiAnswer[],
): SearchCareersAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const compact = compactLabel(label);
  const normalizedMatch = answers.find(
    (item) =>
      normalizeLabel(item.label) === normalized ||
      (compact && compactLabel(item.label) === compact),
  );
  if (normalizedMatch) return normalizedMatch;

  if (normalized.length >= 24) {
    return answers.find((item) => {
      const candidate = normalizeLabel(item.label);
      if (candidate.length < 24) return false;
      return candidate.includes(normalized) || normalized.includes(candidate);
    });
  }

  return undefined;
};

const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
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
  if (!isUsableSearchCareersAnswer(answer)) return false;
  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  return isUsableSearchCareersAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableSearchCareersAnswer(answer)) return false;
  const options = Array.from(select.options).map((option) =>
    cleanLabelText(option.textContent ?? option.label ?? option.value),
  );
  const matched = matchOption(answer, options);
  if (!matched) return false;

  for (const option of select.options) {
    const optionText = cleanLabelText(
      option.textContent ?? option.label ?? option.value,
    );
    if (optionText === matched) {
      select.value = option.value;
      option.selected = true;
      await handleValueChanges(select);
      return true;
    }
  }
  return false;
};

const clickOption = (optionEl: HTMLElement): void => {
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  optionEl.click();
};

const selectComboboxOption = async (
  input: HTMLInputElement,
  options: SearchCareersOptionNode[],
  answer: string,
): Promise<boolean> => {
  const matchedLabel = matchOption(
    answer,
    options.map((option) => option.label),
  );
  if (!matchedLabel) return false;
  const target = options.find((option) => option.label === matchedLabel);
  if (!target) return false;

  const valueMatches = (): boolean => {
    const value = normalizeLabel(input.value || "");
    const expected = normalizeLabel(matchedLabel);
    return !!value && !!expected && value === expected;
  };

  clickOption(target.element);

  const applied = await new Promise<boolean>((resolve) => {
    if (valueMatches() || target.element.getAttribute("aria-selected") === "true") {
      resolve(true);
      return;
    }

    let observer: MutationObserver | null = null;
    const finish = (ok: boolean) => {
      window.clearTimeout(timer);
      observer?.disconnect();
      resolve(ok);
    };
    const timer = window.setTimeout(() => {
      finish(
        valueMatches() || target.element.getAttribute("aria-selected") === "true",
      );
    }, 800);

    observer = new MutationObserver(() => {
      if (valueMatches() || target.element.getAttribute("aria-selected") === "true") {
        finish(true);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["value", "aria-selected", "aria-expanded", "class"],
    });
  });
  return applied;
};

const fillCombobox = async (
  input: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableSearchCareersAnswer(answer)) return false;

  let options = await openSearchCareersCombobox(input);
  if (await selectComboboxOption(input, options, answer)) {
    return true;
  }

  input.focus();
  setNativeValue(input, answer);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  options = await new Promise<SearchCareersOptionNode[]>((resolve) => {
    window.setTimeout(() => {
      resolve(readSearchCareersListboxOptions(input));
    }, 250);
  });

  if (await selectComboboxOption(input, options, answer)) {
    return true;
  }

  await closeSearchCareersCombobox(input);
  return false;
};

const isAffirmative = (answer: string): boolean =>
  AFFIRMATIVE_RE.test(cleanLabelText(answer));

const isNegative = (answer: string): boolean =>
  NEGATIVE_RE.test(cleanLabelText(answer));

const setCheckboxChecked = (input: HTMLInputElement, shouldCheck: boolean): boolean => {
  if (input.checked === shouldCheck) return true;
  const label = input.id
    ? document.querySelector<HTMLElement>(`label[for="${CSS.escape(input.id)}"]`)
    : null;
  (label ?? input).click();
  if (input.checked !== shouldCheck) {
    input.click();
  }
  return input.checked === shouldCheck;
};

const checkboxInputs = (field: SearchCareersCandidateField): HTMLInputElement[] => {
  if (field.kind === "checkbox" && field.element instanceof HTMLInputElement) {
    return [field.element];
  }
  return Array.from(
    field.element.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  );
};

const fillCheckboxField = (field: SearchCareersCandidateField, answer: string): boolean => {
  if (!isUsableSearchCareersAnswer(answer)) return false;
  const boxes = checkboxInputs(field)
    .map((input) => ({ input, label: getSearchCareersChoiceLabel(input) }))
    .filter((item) => item.label || item.input);
  if (boxes.length === 0) return false;

  const optionLabels = (field.options ?? boxes.map((item) => item.label)).filter(Boolean);
  const singleYes =
    boxes.length === 1 &&
    (optionLabels.length === 0 ||
      optionLabels.every((label) => /^(yes|y|true|agree)$/i.test(label)) ||
      field.kind === "checkbox");

  if (singleYes && (isAffirmative(answer) || matchOption(answer, optionLabels))) {
    return setCheckboxChecked(boxes[0].input, true);
  }
  if (singleYes && isNegative(answer)) {
    return setCheckboxChecked(boxes[0].input, false);
  }

  const parts = answer
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const candidates = parts.length > 1 ? parts : [answer];
  let filledAny = false;

  for (const part of candidates) {
    const matched = matchOption(
      part,
      boxes.map((item) => item.label),
    );
    if (!matched) continue;
    const target = boxes.find((item) => item.label === matched);
    if (!target) continue;
    if (setCheckboxChecked(target.input, !isNegative(part))) {
      filledAny = true;
    }
  }

  return filledAny;
};

const fillRadioGroup = (field: SearchCareersCandidateField, answer: string): boolean => {
  if (!isUsableSearchCareersAnswer(answer)) return false;
  const radios = Array.from(
    field.element.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((input) => ({
    input,
    label: getSearchCareersChoiceLabel(input),
  }));
  const matched = matchOption(
    answer,
    labeled.map((item) => item.label),
  );
  if (!matched) return false;
  const target = labeled.find((item) => item.label === matched);
  if (!target) return false;
  if (target.input.checked) return true;
  const label = target.input.id
    ? document.querySelector<HTMLElement>(
        `label[for="${CSS.escape(target.input.id)}"]`,
      )
    : null;
  (label ?? target.input).click();
  return target.input.checked;
};

const fillField = async (
  field: SearchCareersCandidateField,
  answer: string,
): Promise<boolean> => {
  if (field.kind === "checkbox" || field.kind === "checkbox-group") {
    return fillCheckboxField(field, answer);
  }
  if (field.kind === "radio-group") {
    return fillRadioGroup(field, answer);
  }
  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }
  if (field.kind === "combobox" && field.element instanceof HTMLInputElement) {
    return fillCombobox(field.element, answer);
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
 * Applies AI fill answers to the current SearchCareers application form.
 * Empty / null / placeholder answers are skipped and do not count as filled.
 */
export const autofillSearchCareersWithAi = async (
  response: unknown,
): Promise<SearchCareersAiFillResult> => {
  const { answers, emptyLabelKeys } = parseSearchCareersAiFillResponse(response);
  const candidates = collectSearchCareersCandidateFields();

  let filled = 0;
  let failed = 0;
  let skipped = 0;

  for (const field of candidates) {
    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    if (!match || !isUsableSearchCareersAnswer(match.answer)) {
      skipped += 1;
      continue;
    }

    try {
      field.element.scrollIntoView({ block: "center", inline: "nearest" });
      const ok = await fillField(field, match.answer);
      if (ok) filled += 1;
      else failed += 1;
    } catch (error) {
      console.error("[CareerAI SearchCareers] Fill failed:", field.label, error);
      failed += 1;
    }
  }

  return {
    total: candidates.length,
    filled,
    failed,
    skipped,
  };
};

/**
 * Location questions (legal name, address) render only after Country is set.
 * Select the applicant country before the scan so those fields are in the payload.
 */
export const prepareSearchCareersBeforeScan = async (
  applicantData: Applicant | null | undefined,
): Promise<void> => {
  await waitForSearchCareersFieldsToSettle();
  const country = applicantData?.country?.trim();
  if (!country) return;

  const countryField = collectSearchCareersCandidateFields().find(
    (field) =>
      field.kind === "combobox" &&
      field.label.trim().toLowerCase() === "country",
  );
  if (!(countryField?.element instanceof HTMLInputElement)) return;
  if (countryField.element.value.trim()) return;

  await fillCombobox(countryField.element, country);
  await closeSearchCareersCombobox(countryField.element);
  await waitForSearchCareersFieldsToSettle();
};
