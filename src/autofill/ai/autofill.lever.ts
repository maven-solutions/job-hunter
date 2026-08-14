import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  collectLeverCandidateFields,
  LeverCandidateField,
} from "./scan.lever";

export interface LeverAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface LeverAiFillResult {
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

export const isUsableLeverAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableLeverAnswer(v));
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
    return isUsableLeverAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableLeverAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableLeverAnswer(v))
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

const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableLeverAnswer(raw);

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

export interface LeverParsedFillResponse {
  answers: LeverAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseLeverAiFillResponse = (
  response: unknown,
): LeverParsedFillResponse => {
  const answers: LeverAiAnswer[] = [];
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

export const normalizeLeverAiAnswers = (
  response: unknown,
): LeverAiAnswer[] => parseLeverAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableLeverAnswer(answer)) return null;
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
  answers: LeverAiAnswer[],
): LeverAiAnswer | undefined => {
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
      /* fall through */
    }
  }

  return trimmed
    .split(/\s*[,;|]\s*|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
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

const getChoiceLabel = (input: HTMLInputElement): string => {
  const alt = input.parentElement?.querySelector(
    ".application-answer-alternative",
  );
  if (alt?.textContent) {
    return cleanLabelText(alt.textContent);
  }

  const wrappingLabel = input.closest("label");
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, svg, .required").forEach((el) => el.remove());
    const text = cleanLabelText(clone.textContent ?? "");
    if (text) return text;
  }

  return cleanLabelText(input.value || "");
};

const selectChoiceInput = async (input: HTMLInputElement): Promise<boolean> => {
  const label = input.closest("label") as HTMLElement | null;
  if (label) {
    label.click();
    await delay(40);
    if (input.checked) return true;
  }

  setNativeChecked(input, true);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("click", { bubbles: true }));
  await delay(40);
  return input.checked;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableLeverAnswer(answer)) return false;
  element.focus();
  setNativeValue(element, answer);
  await handleValueChanges(element);
  return isUsableLeverAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableLeverAnswer(answer)) return false;
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

const waitForLeverLocationResults = (
  container: HTMLElement | null,
  timeoutMs = 800,
): Promise<HTMLElement[]> =>
  new Promise((resolve) => {
    const read = (): HTMLElement[] => {
      if (!container) return [];
      const resultsRoot = container.querySelector(".dropdown-results");
      if (!resultsRoot) return [];
      return Array.from(resultsRoot.children).filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement &&
          !!cleanLabelText(el.textContent ?? "") &&
          el.getBoundingClientRect().height > 0,
      );
    };

    const existing = read();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    if (!container) {
      resolve([]);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(read());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const items = read();
      if (items.length > 0) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(items);
      }
    });
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  });

/**
 * Lever "Current location" is a typeahead. Type the answer, then click a
 * matching dropdown result when Lever returns suggestions.
 */
const fillLeverLocationTypeahead = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableLeverAnswer(answer)) return false;

  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);

  const container =
    element
      .closest(".application-field")
      ?.querySelector<HTMLElement>(".dropdown-container") ?? null;
  const results = await waitForLeverLocationResults(container);
  if (results.length > 0) {
    const labels = results.map((el) => cleanLabelText(el.textContent ?? ""));
    const matched = matchOption(answer, labels);
    const target = matched
      ? results[labels.indexOf(matched)] ?? results[0]
      : results[0];
    target.scrollIntoView({ block: "nearest" });
    target.click();
    await delay(150);
  }

  return isUsableLeverAnswer(element.value);
};

const fillCheckboxGroup = async (
  question: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableLeverAnswer(answer)) return false;

  const checkboxes = Array.from(
    question.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  );
  if (checkboxes.length === 0) return false;

  const labeled = checkboxes
    .map((cb) => ({ input: cb, label: getChoiceLabel(cb) }))
    .filter((item) => item.label);
  if (labeled.length === 0) return false;

  const optionLabels = labeled.map((item) => item.label);
  const parts = parseAnswerList(answer);
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

const fillRadioGroup = async (
  question: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableLeverAnswer(answer)) return false;

  const radios = Array.from(
    question.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => ({
    input: radio,
    label: getChoiceLabel(radio),
  }));
  const labels = labeled.map((item) => item.label).filter(Boolean);
  const matched = matchOption(answer, labels);
  if (!matched) return false;

  const target = labeled.find((item) => item.label === matched);
  if (!target) return false;
  return selectChoiceInput(target.input);
};

const fillField = async (
  field: LeverCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableLeverAnswer(answer)) return false;

  if (field.kind === "checkbox-group") {
    return fillCheckboxGroup(field.element, answer);
  }

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "location" && field.element instanceof HTMLInputElement) {
    return fillLeverLocationTypeahead(field.element, answer);
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
 * Applies AI fill answers to the current Lever job application form.
 *
 * Stats:
 * - `filled` = only fields with a usable non-empty API answer AND successful DOM write
 * - empty string / empty array / null / placeholders → skipped
 */
export const autofillLeverWithAi = async (
  response: unknown,
): Promise<LeverAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseLeverAiFillResponse(response);

  const candidates = collectLeverCandidateFields();

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

    if (!isUsableLeverAnswer(answer)) {
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
