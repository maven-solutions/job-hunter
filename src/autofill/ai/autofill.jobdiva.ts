import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  closeJobdivaFlyout,
  collectJobdivaCandidateFields,
  JobdivaCandidateField,
  JobdivaOptionNode,
  openJobdivaCombobox,
  readJobdivaMenuOptions,
} from "./scan.jobdiva";

export interface JobdivaAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface JobdivaAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

export interface JobdivaAiFillOptions {
  /** Profile password used for Set a Password and Confirm Password together. */
  password?: string | null;
}

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
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

export const isUsableJobdivaAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((item) => isUsableJobdivaAnswer(item));
  }

  if (typeof value === "object") {
    const nested =
      (value as { answer?: unknown }).answer ??
      (value as { value?: unknown }).value ??
      (value as { fill?: unknown }).fill ??
      (value as { text?: unknown }).text ??
      (value as { data?: unknown }).data;
    if (nested === undefined && Object.keys(value as object).length === 0) {
      return false;
    }
    if (nested === undefined) return false;
    return isUsableJobdivaAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableJobdivaAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item).trim())
      .filter((item) => isUsableJobdivaAnswer(item))
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

const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableJobdivaAnswer(raw);

const addLabelKey = (set: Set<string>, label: string): void => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return;
  const normalized = normalizeLabel(cleaned);
  if (normalized) set.add(normalized);
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
  const normalized = normalizeLabel(label);
  if (normalized && emptyLabelKeys.has(normalized)) return true;
  const compact = cleanLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  if (compact && emptyLabelKeys.has(compact)) return true;

  if (normalized && normalized.length >= 8) {
    for (const key of emptyLabelKeys) {
      if (key.length < 8) continue;
      if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
        return true;
      }
    }
  }
  return false;
};

interface JobdivaParsedFillResponse {
  answers: JobdivaAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

const parseJobdivaAiFillResponse = (
  response: unknown,
): JobdivaParsedFillResponse => {
  const answers: JobdivaAiAnswer[] = [];
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

/** Usable `{ label, answer }` rows. Empty strings, nulls, and `[]` are dropped. */
export const normalizeJobdivaAiAnswers = (
  response: unknown,
): JobdivaAiAnswer[] => parseJobdivaAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableJobdivaAnswer(answer)) return null;
  const normalizedAnswer = fromatStirngInLowerCase(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (fromatStirngInLowerCase(option) === normalizedAnswer) return option;
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
  answers: JobdivaAiAnswer[],
): JobdivaAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find((item) => normalizeLabel(item.label) === normalized);
  if (byNorm) return byNorm;

  if (normalized.length >= 12) {
    return answers.find((item) => {
      const key = normalizeLabel(item.label);
      if (!key || key.length < 8) return false;
      return key.includes(normalized) || normalized.includes(key);
    });
  }

  return undefined;
};

const isConfirmPasswordLabel = (label: string): boolean => {
  const normalized = normalizeLabel(label);
  return normalized.includes("confirm") && normalized.includes("password");
};

const isSetPasswordLabel = (label: string): boolean => {
  const normalized = normalizeLabel(label);
  return normalized.includes("password") && !normalized.includes("confirm");
};

const resolvePasswordAnswer = (
  field: JobdivaCandidateField,
  answers: JobdivaAiAnswer[],
  profilePassword: string,
): string => {
  if (isUsableJobdivaAnswer(profilePassword)) return profilePassword.trim();

  const setAnswer = answers.find(
    (item) => isSetPasswordLabel(item.label) && isUsableJobdivaAnswer(item.answer),
  );
  const own = findAnswerForLabel(field.label, answers);

  if (isConfirmPasswordLabel(field.label)) {
    return setAnswer?.answer || own?.answer || "";
  }
  return own?.answer || setAnswer?.answer || "";
};

type TrackableControl = (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) & {
  _valueTracker?: { setValue: (value: string) => void };
};

export const setJobdivaNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
): void => {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  const lastValue = element.value;
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  const tracker = (element as TrackableControl)._valueTracker;
  if (tracker) tracker.setValue(lastValue);
};

const valuesMatch = (actual: string, expected: string): boolean => {
  const left = actual.trim();
  const right = expected.trim();
  if (!left || !right) return false;
  if (left === right) return true;
  return left.replace(/\s+/g, "") === right.replace(/\s+/g, "");
};

export const fillJobdivaTextControl = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobdivaAnswer(answer)) return false;
  element.focus();
  setJobdivaNativeValue(element, answer);
  await handleValueChanges(element);
  return valuesMatch(element.value, answer);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobdivaAnswer(answer)) return false;
  const labels = Array.from(select.options).map((opt) =>
    cleanLabelText(opt.textContent ?? opt.value),
  );
  const matched = matchOption(answer, labels);
  if (!matched) return false;

  for (const option of Array.from(select.options)) {
    const optionText = cleanLabelText(option.textContent ?? option.value);
    if (optionText !== matched && option.value !== matched) continue;
    option.selected = true;
    setJobdivaNativeValue(select, option.value);
    await handleValueChanges(select);
    return true;
  }

  return false;
};

const clickOptionElement = (optionEl: HTMLElement): void => {
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  optionEl.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }),
  );
  optionEl.click();
};

const dedupeOptions = (options: JobdivaOptionNode[]): JobdivaOptionNode[] => {
  const seen = new Set<string>();
  const results: JobdivaOptionNode[] = [];
  options.forEach((option) => {
    if (seen.has(option.label)) return;
    seen.add(option.label);
    results.push(option);
  });
  return results;
};

const getControlDisplayValue = (element: HTMLElement): string => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value.trim();
  }
  const clone = element.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("[role='listbox'], .dropdown-menu, svg")
    .forEach((node) => node.remove());
  return cleanLabelText(clone.textContent ?? "");
};

const fillCombobox = async (
  element: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobdivaAnswer(answer)) return false;

  if (element instanceof HTMLInputElement && element.list?.options.length) {
    const labels = Array.from(element.list.options).map((opt) =>
      cleanLabelText(opt.label || opt.value),
    );
    const matched = matchOption(answer, labels) ?? answer;
    return fillJobdivaTextControl(element, matched);
  }

  const layout = element.closest(".jd-form-layout");
  let options: JobdivaOptionNode[] = [];
  try {
    options = dedupeOptions([
      ...(await openJobdivaCombobox(element)),
      ...(layout ? readJobdivaMenuOptions(layout, false) : []),
    ]);
  } catch {
    closeJobdivaFlyout();
    return false;
  }

  const matchedLabel = matchOption(
    answer,
    options.map((option) => option.label),
  );
  if (!matchedLabel) {
    closeJobdivaFlyout();
    return false;
  }

  const target = options.find((option) => option.label === matchedLabel);
  if (!target) {
    closeJobdivaFlyout();
    return false;
  }

  clickOptionElement(target.element);

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    await handleValueChanges(element);
  }

  const selectionLanded = (): boolean =>
    valuesMatch(getControlDisplayValue(element), matchedLabel) ||
    target.element.getAttribute("aria-selected") === "true";

  const ok = await new Promise<boolean>((resolve) => {
    if (selectionLanded()) {
      resolve(true);
      return;
    }
    const watchRoot = layout ?? element.parentElement ?? element;
    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(selectionLanded());
    }, 400);
    observer = new MutationObserver(() => {
      if (!selectionLanded()) return;
      window.clearTimeout(timer);
      observer?.disconnect();
      resolve(true);
    });
    observer.observe(watchRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  });

  if (element.getAttribute("aria-expanded") === "true") {
    closeJobdivaFlyout();
  }
  return ok;
};

const fillField = async (
  field: JobdivaCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobdivaAnswer(answer)) return false;

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox") {
    return fillCombobox(field.element, answer);
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillJobdivaTextControl(field.element, answer);
  }

  return false;
};

/**
 * Apply AI answers to the visible JobDiva step.
 * Set a Password and Confirm Password share one value: the profile password
 * when present, otherwise the AI answer for the set-password field.
 */
export const autofillJobdivaWithAi = async (
  response: unknown,
  options: JobdivaAiFillOptions = {},
): Promise<JobdivaAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseJobdivaAiFillResponse(response);
  const fields = collectJobdivaCandidateFields();
  const profilePassword = options.password?.trim() ?? "";

  let filled = 0;
  let failed = 0;
  let skipped = 0;

  if (answers.length === 0 && emptyCount === 0 && !profilePassword) {
    return {
      total: 0,
      filled: 0,
      failed: 0,
      skipped: fields.length,
    };
  }

  for (const field of fields) {
    const passwordField = field.kind === "password";
    if (
      !passwordField &&
      isFieldMarkedEmpty(field.label, emptyLabelKeys)
    ) {
      skipped += 1;
      continue;
    }

    const answer = passwordField
      ? resolvePasswordAnswer(field, answers, profilePassword)
      : findAnswerForLabel(field.label, answers)?.answer;

    if (!isUsableJobdivaAnswer(answer)) {
      skipped += 1;
      continue;
    }

    try {
      field.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      await delay(100);
      const ok = await fillField(field, answer as string);
      if (ok) filled += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
