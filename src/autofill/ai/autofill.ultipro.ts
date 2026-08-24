import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  UltiproCandidateField,
  collectUltiproCandidateFields,
  getUltiproNativeSelectOptions,
  getUltiproRadioChoiceLabel,
  isInsideUltiproSkippedSection,
  isUltiproCountryField,
  isUltiproReferralDetailField,
  isUltiproStateField,
  isVisibleUltiproElement,
} from "./scan.ultipro";

export interface UltiproAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface UltiproAiFillResult {
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

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "unitedstates",
  us: "unitedstates",
  america: "unitedstates",
  unitedstatesofamerica: "unitedstates",
  uk: "unitedkingdom",
  britain: "unitedkingdom",
  greatbritain: "unitedkingdom",
  england: "unitedkingdom",
  uae: "unitedarabemirates",
};

export const isUsableUltiproAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableUltiproAnswer(v));
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
    return isUsableUltiproAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableUltiproAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableUltiproAnswer(v))
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
  !isUsableUltiproAnswer(raw);

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

export interface UltiproParsedFillResponse {
  answers: UltiproAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseUltiproAiFillResponse = (
  response: unknown,
): UltiproParsedFillResponse => {
  const answers: UltiproAiAnswer[] = [];
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

export const normalizeUltiproAiAnswers = (
  response: unknown,
): UltiproAiAnswer[] => parseUltiproAiFillResponse(response).answers;

const normalizeOptionText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9+]+/g, "");

const aliasOptionText = (value: string): string => {
  const compact = normalizeOptionText(value);
  return COUNTRY_ALIASES[compact] ?? compact;
};

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableUltiproAnswer(answer)) return null;

  const compactAnswer = aliasOptionText(answer);
  if (!compactAnswer) return null;

  for (const option of options) {
    if (aliasOptionText(option) === compactAnswer) {
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
    const compactOption = aliasOptionText(option);
    if (!compactOption) continue;
    const shorter = Math.min(compactAnswer.length, compactOption.length);
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
  answers: UltiproAiAnswer[],
): UltiproAiAnswer | undefined => {
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

const SELECT_SETTLE_MS = 2000;

const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
): void => {
  const proto =
    element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
};

const getJquery = (): any => (window as any).jQuery || (window as any).$;

const notifyUltiproControl = async (element: HTMLElement): Promise<void> => {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);

  try {
    getJquery()?.(element)?.trigger?.("change");
  } catch {
    // jQuery is optional — native events already fired.
  }
};

/** Knockout selects reset if we click them after setting value — skip click. */
const notifyUltiproSelect = async (select: HTMLSelectElement): Promise<void> => {
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));

  try {
    const jquery = getJquery();
    jquery?.(select)?.val?.(select.value)?.trigger?.("change")?.trigger?.("input");
  } catch {
    // jQuery is optional.
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
  if (!isUsableUltiproAnswer(answer)) return false;
  const value = clipToMaxLength(element, answer);
  element.focus();
  setNativeValue(element, value);
  await notifyUltiproControl(element);
  return isUsableUltiproAnswer(element.value);
};

const applySelectValue = (select: HTMLSelectElement, value: string): void => {
  Array.from(select.options).forEach((opt) => {
    opt.selected = opt.value === value;
  });
  setNativeValue(select, value);
  select.selectedIndex = Array.from(select.options).findIndex(
    (opt) => opt.value === value,
  );
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableUltiproAnswer(answer)) return false;

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

  applySelectValue(select, target.option.value);
  await notifyUltiproSelect(select);
  await delay(SELECT_SETTLE_MS);

  if (select.value !== target.option.value) {
    applySelectValue(select, target.option.value);
    await notifyUltiproSelect(select);
    await delay(SELECT_SETTLE_MS);
  }

  return select.value === target.option.value;
};

const toWholeNumber = (answer: string): string => {
  const stripped = answer.replace(/,/g, "").replace(/[^\d.-]/g, " ");
  const match = stripped.match(/-?\d+/);
  return match ? match[0] : "";
};

const fillNumericField = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  const numeric = toWholeNumber(answer);
  if (!numeric) return false;

  element.focus();

  const jquery = getJquery();
  try {
    if (jquery?.fn?.autoNumeric) {
      jquery(element).autoNumeric("set", numeric);
    }
  } catch {
    // Fall through to native setter.
  }

  setNativeValue(element, numeric);
  await notifyUltiproControl(element);
  return isUsableUltiproAnswer(element.value);
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
  await notifyUltiproControl(input);
  return input.checked || input.getAttribute("value") != null;
};

const fillRadioGroup = async (
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableUltiproAnswer(answer)) return false;

  const radios = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => ({
    input: radio,
    label: getUltiproRadioChoiceLabel(radio),
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

  const compactAnswer = normalizeOptionText(answer);
  const target = labeled.find(
    (item) =>
      item.label === matched ||
      item.value === matched ||
      normalizeOptionText(item.label) === compactAnswer ||
      normalizeOptionText(item.value) === compactAnswer ||
      item.value === answer.trim(),
  );
  if (!target) return false;

  if (target.input.checked) return true;
  return selectRadioInput(target.input);
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

const parseDateAnswer = (
  answer: string,
): { iso: string; mdy: string } | null => {
  const trimmed = answer.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const iso = `${year}-${pad2(month)}-${pad2(day)}`;
      return { iso, mdy: `${pad2(month)}/${pad2(day)}/${year}` };
    }
  }

  const mdyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (mdyMatch) {
    let year = Number(mdyMatch[3]);
    if (year < 100) year += 2000;
    const month = Number(mdyMatch[1]);
    const day = Number(mdyMatch[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const iso = `${year}-${pad2(month)}-${pad2(day)}`;
      return { iso, mdy: `${pad2(month)}/${pad2(day)}/${year}` };
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    const iso = `${year}-${pad2(month)}-${pad2(day)}`;
    return { iso, mdy: `${pad2(month)}/${pad2(day)}/${year}` };
  }

  return null;
};

const setUkgHostValue = (host: HTMLElement, iso: string): void => {
  try {
    (host as any).value = iso;
  } catch {
    // Custom element may not expose a JS value setter.
  }
  host.setAttribute("value", iso);
  host.setAttribute("data-date-value", iso);
  host.dispatchEvent(new Event("input", { bubbles: true }));
  host.dispatchEvent(new Event("change", { bubbles: true }));
  host.dispatchEvent(
    new CustomEvent("ukgChange", { bubbles: true, detail: { value: iso } }),
  );
};

const fillUkgDatePicker = async (
  host: HTMLElement,
  answer: string,
): Promise<boolean> => {
  const parsed = parseDateAnswer(answer);
  if (!parsed) return false;

  const ukgInput =
    (host.matches("ukg-input") ? host : null) ||
    host.querySelector<HTMLElement>("ukg-input[type='date'], [data-automation='ukg-datepicker-input']") ||
    host;

  setUkgHostValue(ukgInput, parsed.iso);

  const dateText = ukgInput.querySelector<HTMLElement>("ukg-date-input-text");
  if (dateText) {
    dateText.setAttribute("value", parsed.iso);
    try {
      (dateText as any).value = parsed.iso;
    } catch {
      // ignore
    }
  }

  const shadowInput =
    ((ukgInput as any).shadowRoot as ShadowRoot | null)?.querySelector(
      "input",
    ) || dateText?.shadowRoot?.querySelector("input");
  if (shadowInput instanceof HTMLInputElement) {
    setNativeValue(shadowInput, parsed.iso);
    shadowInput.dispatchEvent(new Event("input", { bubbles: true }));
    shadowInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const lightInput = ukgInput.querySelector<HTMLInputElement>(
    "input[type='date'], input[type='text']",
  );
  if (lightInput) {
    setNativeValue(lightInput, parsed.iso);
    await notifyUltiproControl(lightInput);
  }

  await delay(300);
  return true;
};

const findStateSelect = (
  fields: UltiproCandidateField[],
): HTMLSelectElement | null => {
  const field = fields.find(
    (item) =>
      item.element instanceof HTMLSelectElement &&
      isUltiproStateField(item.element),
  );
  if (field?.element instanceof HTMLSelectElement) return field.element;
  return document.querySelector<HTMLSelectElement>("#State");
};

const waitForSelectOptions = (
  select: HTMLSelectElement,
  timeoutMs = 4000,
): Promise<boolean> =>
  new Promise((resolve) => {
    const hasRealOptions = () => getUltiproNativeSelectOptions(select).length > 0;

    if (hasRealOptions()) {
      resolve(true);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(hasRealOptions());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      if (hasRealOptions()) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(true);
      }
    });
    observer.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  });

const waitUntilVisible = (
  element: HTMLElement,
  timeoutMs = 3000,
): Promise<boolean> =>
  new Promise((resolve) => {
    if (isVisibleUltiproElement(element)) {
      resolve(true);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(isVisibleUltiproElement(element));
    }, timeoutMs);

    observer = new MutationObserver(() => {
      if (isVisibleUltiproElement(element)) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });
  });

const fillField = async (
  field: UltiproCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableUltiproAnswer(answer)) return false;

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "date") {
    return fillUkgDatePicker(field.element, answer);
  }

  if (
    field.kind === "numeric" &&
    field.element instanceof HTMLInputElement
  ) {
    return fillNumericField(field.element, answer);
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(field.element, answer);
  }

  return false;
};

const sortFieldsForFill = (
  fields: UltiproCandidateField[],
): UltiproCandidateField[] => {
  const score = (field: UltiproCandidateField): number => {
    if (isUltiproCountryField(field.element)) return 10;
    if (field.kind === "select" && !isUltiproStateField(field.element)) return 20;
    if (isUltiproStateField(field.element)) return 30;
    if (field.kind === "radio-group") return 40;
    if (field.kind === "date") return 50;
    if (isUltiproReferralDetailField(field.element)) return 80;
    return 60;
  };
  return [...fields].sort((a, b) => score(a) - score(b));
};

/**
 * Applies AI fill answers to the current UKG / Ultipro apply form.
 * Country is filled before State so Knockout can load state options.
 * Native selects settle for ~2s so Knockout keeps the chosen value.
 */
export const autofillUltiproWithAi = async (
  response: unknown,
): Promise<UltiproAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseUltiproAiFillResponse(response);

  const candidates = sortFieldsForFill(collectUltiproCandidateFields());

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
    if (isInsideUltiproSkippedSection(field.element)) {
      skipped += 1;
      continue;
    }

    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableUltiproAnswer(answer)) {
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

      if (
        field.kind === "select" &&
        field.element instanceof HTMLSelectElement &&
        isUltiproStateField(field.element)
      ) {
        await waitForSelectOptions(field.element);
      }

      if (isUltiproReferralDetailField(field.element)) {
        const visible = await waitUntilVisible(field.element);
        if (!visible) {
          skipped += 1;
          continue;
        }
      }

      const ok = await fillField(field, answer as string);
      if (ok) {
        filled += 1;

        if (isUltiproCountryField(field.element)) {
          const stateSelect = findStateSelect(candidates);
          if (stateSelect) {
            await waitForSelectOptions(stateSelect);
          }
        }
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }

    if (field.kind !== "select") {
      await delay(200);
    }
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
