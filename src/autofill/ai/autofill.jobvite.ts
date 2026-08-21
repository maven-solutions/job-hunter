import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  collectJobviteCandidateFields,
  getJobviteNextButton,
  isJobviteStep2Visible,
  JobviteCandidateField,
} from "./scan.jobvite";

export interface JobviteAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface JobviteAiFillResult {
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

export const isUsableJobviteAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableJobviteAnswer(v));
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
    return isUsableJobviteAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableJobviteAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableJobviteAnswer(v))
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

const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableJobviteAnswer(raw);

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

export interface JobviteParsedFillResponse {
  answers: JobviteAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseJobviteAiFillResponse = (
  response: unknown,
): JobviteParsedFillResponse => {
  const answers: JobviteAiAnswer[] = [];
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

export const normalizeJobviteAiAnswers = (
  response: unknown,
): JobviteAiAnswer[] => parseJobviteAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableJobviteAnswer(answer)) return null;
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
  answers: JobviteAiAnswer[],
): JobviteAiAnswer | undefined => {
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

/**
 * Jobvite apply forms are AngularJS. Sync ng-model / $digest after DOM writes
 * so validation (`ng-invalid-required`) picks up the new value.
 */
const syncJobviteAngular = (element: HTMLElement, value?: string): void => {
  const angular = (window as any).angular;
  if (!angular?.element) return;

  try {
    const ngEl = angular.element(element);
    const ngModel = ngEl.controller?.("ngModel");
    if (ngModel && value !== undefined) {
      ngModel.$setViewValue(value);
      ngModel.$render();
    }
    const scope = ngEl.scope?.() ?? ngEl.isolateScope?.();
    if (scope && !scope.$$phase && !scope.$root?.$$phase) {
      scope.$apply();
    }
  } catch {
    // Angular missing or digest already in progress
  }
};

const getChoiceLabel = (input: HTMLInputElement): string => {
  const wrappingLabel = input.closest("label");
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, svg, i, .jv-required-label").forEach((el) =>
      el.remove(),
    );
    const text = cleanLabelText(clone.textContent ?? "");
    if (text) return text;
  }

  const id = input.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) return cleanLabelText(label.textContent);
  }

  return cleanLabelText(input.value || "");
};

const selectChoiceInput = async (input: HTMLInputElement): Promise<boolean> => {
  const label = input.closest("label") as HTMLElement | null;
  const icon = label?.querySelector<HTMLElement>(
    "i[role='radio'], i[role='checkbox'], i.icon",
  );

  if (icon) {
    icon.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        bubbles: true,
        cancelable: true,
      }),
    );
    icon.click();
    await delay(40);
    if (input.checked) {
      syncJobviteAngular(input, input.value);
      return true;
    }
  }

  if (label) {
    label.click();
    await delay(40);
    if (input.checked) {
      syncJobviteAngular(input, input.value);
      return true;
    }
  }

  setNativeChecked(input, true);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("click", { bubbles: true }));
  syncJobviteAngular(input, input.value);
  await delay(40);
  return input.checked;
};

const isAffirmativeAnswer = (answer: string): boolean => {
  const n = fromatStirngInLowerCase(answer) ?? "";
  return (
    /^(yes|true|agree|iagree|ok|checked)$/.test(n) ||
    n.includes("agree") ||
    n.includes("accept")
  );
};

const toDateInputValue = (answer: string): string => {
  const trimmed = answer.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const us = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (us) {
    const month = us[1].padStart(2, "0");
    const day = us[2].padStart(2, "0");
    const year = us[3].length === 2 ? `20${us[3]}` : us[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  return trimmed;
};

const extractCurrencyAmount = (answer: string): string => {
  const numeric = answer.replace(/[^\d.,]/g, "").replace(/,(?=\d{3}\b)/g, "");
  return numeric || answer;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobviteAnswer(answer)) return false;
  element.focus();
  setNativeValue(element, answer);
  await handleValueChanges(element);
  syncJobviteAngular(element, answer);
  return isUsableJobviteAnswer(element.value);
};

const fillCurrencyAmount = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  const amount = extractCurrencyAmount(answer);
  return fillTextLikeField(element, amount);
};

const angularModelValueFromOption = (option: HTMLOptionElement): string => {
  const raw = option.value || "";
  const match = raw.match(/^(string|number|boolean):(.*)$/);
  if (match) return match[2];
  return cleanLabelText(option.textContent ?? option.label ?? raw);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobviteAnswer(answer)) return false;
  const options = Array.from(select.options).map((opt) =>
    cleanLabelText(opt.textContent ?? opt.label ?? opt.value),
  );
  const matched = matchOption(answer, options);
  if (!matched) return false;

  for (const option of select.options) {
    const optionText = cleanLabelText(
      option.textContent ?? option.label ?? option.value,
    );
    if (optionText !== matched) continue;

    select.value = option.value;
    option.selected = true;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    await handleValueChanges(select);
    syncJobviteAngular(select, angularModelValueFromOption(option));
    return true;
  }

  return false;
};

const fillMultiSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobviteAnswer(answer)) return false;

  const labeled = Array.from(select.options).map((opt) => ({
    option: opt,
    label: cleanLabelText(opt.textContent ?? opt.label ?? opt.value),
  }));
  const optionLabels = labeled.map((item) => item.label).filter(Boolean);
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
    target.option.selected = true;
    filledAny = true;
  }

  if (!filledAny) return false;

  select.dispatchEvent(new Event("input", { bubbles: true }));
  await handleValueChanges(select);
  syncJobviteAngular(select);
  return true;
};

const fillCheckboxGroup = async (
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobviteAnswer(answer)) return false;

  const checkboxes = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  );
  if (checkboxes.length === 0) return false;

  const labeled = checkboxes
    .map((cb) => ({ input: cb, label: getChoiceLabel(cb) }))
    .filter((item) => item.label);
  if (labeled.length === 0) return false;

  const optionLabels = labeled.map((item) => item.label);
  if (
    optionLabels.length === 1 &&
    /agree/i.test(optionLabels[0]) &&
    isAffirmativeAnswer(answer)
  ) {
    const target = labeled[0];
    if (target.input.checked) return true;
    return selectChoiceInput(target.input);
  }
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
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobviteAnswer(answer)) return false;

  const radios = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='radio']"),
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
  field: JobviteCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableJobviteAnswer(answer)) return false;

  if (field.kind === "checkbox-group") {
    return fillCheckboxGroup(field.element, answer);
  }

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (
    field.kind === "multi-select" &&
    field.element instanceof HTMLSelectElement
  ) {
    return fillMultiSelect(field.element, answer);
  }

  if (
    field.kind === "currency-amount" &&
    field.element instanceof HTMLInputElement
  ) {
    return fillCurrencyAmount(field.element, answer);
  }

  if (
    field.element instanceof HTMLInputElement &&
    field.element.type === "date"
  ) {
    return fillTextLikeField(field.element, toDateInputValue(answer));
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(field.element, answer);
  }

  return false;
};

const fillCandidates = async (
  candidates: JobviteCandidateField[],
  answers: JobviteAiAnswer[],
  emptyLabelKeys: Set<string>,
  alreadyTried: Set<string>,
): Promise<{ filled: number; failed: number; skipped: number }> => {
  let filled = 0;
  let failed = 0;
  let skipped = 0;

  for (const field of candidates) {
    const fieldKey = `${field.kind}:${field.label}`;
    if (alreadyTried.has(fieldKey)) continue;
    alreadyTried.add(fieldKey);

    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableJobviteAnswer(answer)) {
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

  return { filled, failed, skipped };
};

const waitForJobviteStep2 = (timeoutMs = 4000): Promise<boolean> =>
  new Promise((resolve) => {
    if (isJobviteStep2Visible()) {
      resolve(true);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(isJobviteStep2Visible());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      if (isJobviteStep2Visible()) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  });

const goToJobviteStep2 = async (): Promise<boolean> => {
  if (isJobviteStep2Visible()) return true;
  const next = getJobviteNextButton();
  if (!next) return false;
  next.click();
  await delay(300);
  return waitForJobviteStep2();
};

/**
 * Applies AI fill answers to the current Jobvite job application form.
 *
 * Stats:
 * - `filled` = only fields with a usable non-empty API answer AND successful DOM write
 * - empty string / empty array / null / placeholders → skipped
 * After step 1, clicks Next and fills Canada Screening / prescreen radios.
 */
export const autofillJobviteWithAi = async (
  response: unknown,
): Promise<JobviteAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseJobviteAiFillResponse(response);

  const alreadyTried = new Set<string>();
  const firstPass = collectJobviteCandidateFields();

  if (answers.length === 0 && emptyCount === 0) {
    return {
      total: 0,
      filled: 0,
      failed: 0,
      skipped: firstPass.length,
    };
  }

  const first = await fillCandidates(
    firstPass,
    answers,
    emptyLabelKeys,
    alreadyTried,
  );

  let filled = first.filled;
  let failed = first.failed;
  let skipped = first.skipped;

  const reachedStep2 = await goToJobviteStep2();
  if (reachedStep2) {
    const second = await fillCandidates(
      collectJobviteCandidateFields(),
      answers,
      emptyLabelKeys,
      alreadyTried,
    );
    filled += second.filled;
    failed += second.failed;
    skipped += second.skipped;
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
