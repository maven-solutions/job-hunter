import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  AmazonCandidateField,
  cleanAmazonLabelText,
  collectAmazonCandidateFields,
  ensureAmazonSectionEditable,
  getAmazonNativeSelectOptions,
  getAmazonRadioOptionLabel,
  isAmazonCurrentlyStudentField,
  isAmazonDateInput,
  isAmazonEducationLevelField,
  isAmazonSelect2NativeSelect,
} from "./scan.amazon";

export interface AmazonAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface AmazonAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

interface DomField {
  element: HTMLElement;
  label: string;
  kind: AmazonCandidateField["kind"];
}

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

const normalizeLabel = (label: string): string =>
  fromatStirngInLowerCase(cleanAmazonLabelText(label)) ?? "";

export const isUsableAmazonAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableAmazonAnswer(v));
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
    return isUsableAmazonAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableAmazonAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableAmazonAnswer(v))
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

const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableAmazonAnswer(raw);

const addLabelKey = (set: Set<string>, label: string): void => {
  const cleaned = cleanAmazonLabelText(label);
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
  const compact = cleanAmazonLabelText(label)
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

export interface AmazonParsedFillResponse {
  answers: AmazonAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseAmazonAiFillResponse = (
  response: unknown,
): AmazonParsedFillResponse => {
  const answers: AmazonAiAnswer[] = [];
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

export const normalizeAmazonAiAnswers = (
  response: unknown,
): AmazonAiAnswer[] => parseAmazonAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableAmazonAnswer(answer)) return null;
  const normalizedAnswer = fromatStirngInLowerCase(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (fromatStirngInLowerCase(option) === normalizedAnswer) {
      return option;
    }
  }

  // Skip short options ("Yes"/"No") for substring matching — "not" would match "No".
  for (const option of options) {
    const normalizedOption = fromatStirngInLowerCase(option);
    if (!normalizedOption || normalizedOption.length < 4) continue;
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
  answers: AmazonAiAnswer[],
): AmazonAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  return answers.find((item) => normalizeLabel(item.label) === normalized);
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

const clickElement = (el: HTMLElement): void => {
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
  el.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
  );
  el.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  el.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  el.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, cancelable: true }),
  );
  el.click();
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const waitUntil = async (
  predicate: () => boolean,
  timeoutMs = 5000,
  intervalMs = 80,
): Promise<boolean> => {
  if (predicate()) return true;
  const start = Date.now();
  return new Promise((resolve) => {
    const timer = window.setInterval(() => {
      if (predicate()) {
        window.clearInterval(timer);
        resolve(true);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, intervalMs);
  });
};

const isCountryRegionLabel = (label: string): boolean => {
  const n = label.toLowerCase();
  return n.includes("country") && !n.includes("phone");
};

const isStateProvinceLabel = (label: string): boolean => {
  const n = label.toLowerCase();
  return n.includes("province") || n.includes("state");
};

/** Phone/country first; education level before its follow-ups; radios/selects before text. */
const amazonFillRank = (field: DomField): number => {
  if (field.kind === "phone-country") return 0;
  if (isCountryRegionLabel(field.label)) return 1;
  if (isAmazonEducationLevelField(field.element, field.label)) return 2;
  if (field.kind === "radio-group") return 3;
  if (field.kind === "select2" || field.kind === "select") return 4;
  if (field.kind === "date") return 5;
  if (isStateProvinceLabel(field.label)) return 10;
  return 6;
};

const fillAmazonDateField = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAmazonAnswer(answer)) return false;
  const value = toYearMonth(answer);
  if (!value) return false;

  element.focus();
  setNativeValue(element, value);
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType: "insertText",
    }),
  );
  await handleValueChanges(element);
  element.dispatchEvent(
    new KeyboardEvent("keyup", { key: "Enter", bubbles: true }),
  );
  element.blur();
  return /year-month|yyyy-mm/i.test(element.placeholder || "")
    ? /^\d{4}-\d{2}/.test(element.value) || element.value.includes(value)
    : isUsableAmazonAnswer(element.value);
};

const MONTH_NAME_TO_NUM: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

const toYearMonth = (answer: string): string => {
  const raw = cleanAmazonLabelText(answer);
  if (!raw) return "";

  let m = raw.match(/^(\d{4})\s*[\/\-.]\s*(\d{1,2})(?:\s*[\/\-.]\s*\d{1,2})?$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;

  m = raw.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;

  m = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const month = MONTH_NAME_TO_NUM[m[1].toLowerCase()];
    if (month) return `${m[2]}-${month}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
  }

  return raw;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAmazonAnswer(answer)) return false;
  if (element.readOnly || element.disabled) return false;

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
  await handleValueChanges(element);
  return isUsableAmazonAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAmazonAnswer(answer)) return false;
  const options = Array.from(select.options).map((opt) =>
    cleanAmazonLabelText(opt.textContent ?? opt.value),
  );
  const matched = matchOption(answer, options);
  if (!matched) return false;

  for (const option of select.options) {
    const optionText = cleanAmazonLabelText(option.textContent ?? option.value);
    if (optionText === matched) {
      option.selected = true;
      select.value = option.value;
      await handleValueChanges(select);
      return true;
    }
  }

  return false;
};

const getSelect2Selection = (
  select: HTMLSelectElement,
): HTMLElement | null => {
  const wrapper = select.closest(
    ".drop-down-menu-select, .drop-down-menu, .country-dropdown, .form-group, .select2-container",
  );
  return (
    wrapper?.querySelector<HTMLElement>(
      ".select2-selection, .select2-selection--single",
    ) ??
    select.parentElement?.querySelector<HTMLElement>(".select2-selection") ??
    null
  );
};

const closeSelect2 = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const getOpenSelect2Options = (): HTMLElement[] => {
  const open =
    document.querySelector(".select2-container--open") ??
    document.querySelector(".select2-dropdown");
  if (!open) return [];

  return Array.from(
    open.querySelectorAll<HTMLElement>(
      ".select2-results__option, [role='treeitem'], [role='option']",
    ),
  ).filter((opt) => {
    const text = cleanAmazonLabelText(opt.textContent ?? "");
    if (!text) return false;
    if (opt.getAttribute("aria-disabled") === "true") return false;
    if (opt.classList.contains("select2-results__option--load-more")) {
      return false;
    }
    if (/no results|no states\/provinces available/i.test(text)) return false;
    return true;
  });
};

const typeSelect2Search = async (text: string): Promise<void> => {
  const search = document.querySelector<HTMLInputElement>(
    ".select2-container--open .select2-search__field, .select2-search--dropdown .select2-search__field",
  );
  if (!search) return;

  search.focus();
  setNativeValue(search, text);
  search.dispatchEvent(new Event("input", { bubbles: true }));
  search.dispatchEvent(
    new KeyboardEvent("keyup", {
      key: text.slice(-1) || "a",
      bubbles: true,
      cancelable: true,
    }),
  );
  await delay(200);
  await waitForDomUpdate();
};

const fillAmazonSelect2 = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAmazonAnswer(answer)) return false;

  if (select.disabled) {
    const ready = await waitUntil(() => !select.disabled, 6000);
    if (!ready) return false;
    await delay(150);
  }

  const nativeOptions = getAmazonNativeSelectOptions(select);
  const isAjaxSearch = nativeOptions.length === 0;
  const matchedNative = matchOption(answer, nativeOptions) ?? answer;

  const selection = getSelect2Selection(select);
  if (!selection) {
    return isAjaxSearch ? false : fillNativeSelect(select, matchedNative);
  }

  clickElement(selection);
  await delay(250);
  await waitForDomUpdate();

  const opened = await waitUntil(
    () =>
      !!document.querySelector(
        ".select2-container--open, .select2-dropdown",
      ),
    2000,
  );
  if (!opened) {
    return isAjaxSearch ? false : fillNativeSelect(select, matchedNative);
  }

  await typeSelect2Search(matchedNative);

  let scanned = getOpenSelect2Options();
  if (scanned.length === 0) {
    await waitUntil(() => getOpenSelect2Options().length > 0, isAjaxSearch ? 2500 : 400);
    scanned = getOpenSelect2Options();
  }

  const labels = scanned.map((opt) =>
    cleanAmazonLabelText(opt.textContent ?? ""),
  );
  const matchedLabel = matchOption(matchedNative, labels);
  if (!matchedLabel) {
    if (isAjaxSearch) {
      const search = document.querySelector<HTMLInputElement>(
        ".select2-container--open .select2-search__field, .select2-search--dropdown .select2-search__field",
      );
      search?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );
      await delay(250);
      const rendered = cleanAmazonLabelText(
        getSelect2Selection(select)?.querySelector(
          ".select2-selection__rendered",
        )?.textContent ?? "",
      );
      if (rendered && matchOption(matchedNative, [rendered])) {
        return true;
      }
    }
    closeSelect2();
    await delay(100);
    return isAjaxSearch ? false : fillNativeSelect(select, matchedNative);
  }

  const target = scanned.find(
    (opt) => cleanAmazonLabelText(opt.textContent ?? "") === matchedLabel,
  );
  if (!target) {
    closeSelect2();
    return false;
  }

  clickElement(target);
  await delay(250);

  const hidden = select
    .closest(".country-dropdown, .form-group")
    ?.querySelector<HTMLInputElement>(
      "input.country-input, input.state-province-input",
    );
  if (hidden && select.value) {
    setNativeValue(hidden, select.value);
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const rendered = getSelect2Selection(select)
    ?.querySelector(".select2-selection__rendered")
    ?.textContent;
  const renderedClean = cleanAmazonLabelText(rendered ?? "");
  const looksSelected =
    !!select.value ||
    (!!renderedClean &&
      !/select a country|no states/i.test(renderedClean) &&
      matchOption(matchedNative, [renderedClean]) != null);

  return looksSelected || (!isAjaxSearch && fillNativeSelect(select, matchedNative));
};

const fillPhoneCountryCode = async (
  field: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAmazonAnswer(answer)) return false;

  const root =
    field.closest(".phone-number, .iti") ??
    document.querySelector(".phone-number") ??
    document;

  const selectedFlag = root.querySelector<HTMLElement>(
    ".iti__selected-flag, .iti__selected-country",
  );
  if (!selectedFlag) return false;

  clickElement(selectedFlag);
  await delay(250);

  const countries = Array.from(
    root.querySelectorAll<HTMLElement>(".iti__country-list .iti__country"),
  );

  const labels = countries.map((item) => {
    const name = cleanAmazonLabelText(
      item.querySelector(".iti__country-name")?.textContent ?? "",
    );
    const dial = cleanAmazonLabelText(
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
  clickElement(target);
  await delay(200);
  return true;
};

const setNativeChecked = (
  input: HTMLInputElement,
  checked: boolean,
): void => {
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

const fillAmazonRadioGroup = async (
  group: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableAmazonAnswer(answer)) return false;

  const radios = Array.from(
    group.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => ({
    input: radio,
    label: getAmazonRadioOptionLabel(radio),
    value: cleanAmazonLabelText(radio.value || ""),
  }));

  const matchedLabel =
    matchOption(
      answer,
      labeled.map((item) => item.label).filter(Boolean),
    ) ??
    matchOption(
      answer,
      labeled.map((item) => item.value).filter(Boolean),
    );
  if (!matchedLabel) return false;

  const target =
    labeled.find((item) => item.label === matchedLabel) ??
    labeled.find((item) => item.value === matchedLabel);
  if (!target) return false;

  const { input } = target;
  const optionLabel = input.id
    ? document.querySelector<HTMLElement>(
        `label[for="${CSS.escape(input.id)}"]`,
      )
    : input
        .closest(".custom-radio, .custom-control")
        ?.querySelector<HTMLElement>("label");

  if (optionLabel) {
    clickElement(optionLabel);
  } else {
    clickElement(input);
  }

  setNativeChecked(input, true);
  input.dispatchEvent(new Event("click", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await delay(150);

  return (
    input.checked ||
    input.getAttribute("aria-checked") === "true"
  );
};

const waitForAmazonStateOptions = async (): Promise<void> => {
  const stateSelect = document.querySelector<HTMLSelectElement>(
    "select.state-province, select.select2-hidden-accessible.state-province",
  );
  if (!stateSelect) return;

  await waitUntil(
    () => !stateSelect.disabled && stateSelect.options.length > 0,
    6000,
  );
  await delay(200);
};

const fillField = async (field: DomField, answer: string): Promise<boolean> => {
  if (!isUsableAmazonAnswer(answer)) return false;

  if (field.kind === "phone-country") {
    return fillPhoneCountryCode(field.element, answer);
  }

  if (field.kind === "radio-group") {
    return fillAmazonRadioGroup(field.element, answer);
  }

  if (field.kind === "select2" && field.element instanceof HTMLSelectElement) {
    return fillAmazonSelect2(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    if (isAmazonSelect2NativeSelect(field.element)) {
      return fillAmazonSelect2(field.element, answer);
    }
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "date" || isAmazonDateInput(field.element)) {
    if (field.element instanceof HTMLInputElement) {
      return fillAmazonDateField(field.element, answer);
    }
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(field.element, answer);
  }

  return false;
};

const fieldKey = (field: DomField): string =>
  `${field.kind}:${normalizeLabel(field.label)}`;

const fillCandidateList = async (
  candidates: DomField[],
  answers: AmazonAiAnswer[],
  emptyLabelKeys: Set<string>,
): Promise<{ filled: number; failed: number; skipped: number }> => {
  let filled = 0;
  let failed = 0;
  let skipped = 0;

  for (const field of candidates) {
    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableAmazonAnswer(answer)) {
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
        if (isCountryRegionLabel(field.label)) {
          await waitForAmazonStateOptions();
        }
        if (isAmazonEducationLevelField(field.element, field.label)) {
          await delay(2000);
        } else if (isAmazonCurrentlyStudentField(field.element, field.label)) {
          await delay(1000);
        } else if (field.kind === "select2" || field.kind === "radio-group") {
          await delay(250);
        }
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

/**
 * Applies AI fill answers to the current amazon.jobs application section.
 */
export const autofillAmazonWithAi = async (
  response: unknown,
): Promise<AmazonAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseAmazonAiFillResponse(response);

  await ensureAmazonSectionEditable();

  const candidates = collectAmazonCandidateFields()
    .map(
      (candidate): DomField => ({
        element: candidate.element,
        label: candidate.label,
        kind: candidate.kind,
      }),
    )
    .sort((a, b) => amazonFillRank(a) - amazonFillRank(b));

  if (answers.length === 0 && emptyCount === 0) {
    return {
      total: 0,
      filled: 0,
      failed: 0,
      skipped: candidates.length,
    };
  }

  const firstPass = await fillCandidateList(
    candidates,
    answers,
    emptyLabelKeys,
  );

  // Education level (and "currently a student") mount follow-up questions.
  // Re-scan the live DOM and fill anything new the API already answered.
  let filled = firstPass.filled;
  let failed = firstPass.failed;
  let skipped = firstPass.skipped;
  const seen = new Set(candidates.map(fieldKey));

  for (let pass = 0; pass < 3; pass += 1) {
    await delay(pass === 0 ? 200 : 400);
    const extras = collectAmazonCandidateFields()
      .map(
        (candidate): DomField => ({
          element: candidate.element,
          label: candidate.label,
          kind: candidate.kind,
        }),
      )
      .filter((field) => !seen.has(fieldKey(field)))
      .sort((a, b) => amazonFillRank(a) - amazonFillRank(b));

    if (extras.length === 0) break;

    extras.forEach((field) => seen.add(fieldKey(field)));
    const extraPass = await fillCandidateList(
      extras,
      answers,
      emptyLabelKeys,
    );
    filled += extraPass.filled;
    failed += extraPass.failed;
    skipped += extraPass.skipped;
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
