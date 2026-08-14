import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  collectIcimsCandidateFields,
  getIcimsDropdownContainer,
  getIcimsDropdownTrigger,
  getIcimsFormDocument,
  IcimsCandidateField,
  isHtmlInput,
  isHtmlSelect,
  isHtmlTextArea,
  isIcimsCustomDropdown,
} from "./scan.icims";

export interface IcimsAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface IcimsAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*required\.?\s*$/i, "")
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

export const isUsableIcimsAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableIcimsAnswer(v));
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
    return isUsableIcimsAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableIcimsAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableIcimsAnswer(v))
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

const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableIcimsAnswer(raw);

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

export interface IcimsParsedFillResponse {
  answers: IcimsAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseIcimsAiFillResponse = (
  response: unknown,
): IcimsParsedFillResponse => {
  const answers: IcimsAiAnswer[] = [];
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

export const normalizeIcimsAiAnswers = (
  response: unknown,
): IcimsAiAnswer[] => parseIcimsAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableIcimsAnswer(answer)) return null;
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
  answers: IcimsAiAnswer[],
): IcimsAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  // Soft match — AI may drop collection prefixes ("Phones Type" ↔ "Type")
  if (normalized.length >= 8) {
    const soft = answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 6) return false;
      return n.includes(normalized) || normalized.includes(n);
    });
    if (soft) return soft;
  }

  return undefined;
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const closeIcimsDropdown = (doc: Document = getIcimsFormDocument()): void => {
  doc.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const clickOptionElement = (optionEl: HTMLElement): void => {
  const view = optionEl.ownerDocument?.defaultView || window;
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  optionEl.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view,
    }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view,
    }),
  );
  optionEl.click();
};

const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  // Use tagName — iframe elements fail instanceof against parent constructors
  const proto =
    element.tagName === "TEXTAREA"
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
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
  if (!isUsableIcimsAnswer(answer)) return false;
  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  return isUsableIcimsAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableIcimsAnswer(answer)) return false;
  const options = Array.from(select.options).map((opt) =>
    cleanLabelText(opt.textContent ?? opt.title ?? opt.value),
  );
  const matched = matchOption(answer, options);
  if (!matched) return false;

  for (const option of select.options) {
    const optionText = cleanLabelText(
      option.textContent ?? option.title ?? option.value,
    );
    if (optionText === matched) {
      select.value = option.value;
      option.selected = true;
      await handleValueChanges(select);
      // iCIMS may hook onchange for dependent fields (e.g. SourceChange)
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }

  return false;
};

const collectVisibleDropdownOptions = (
  container: HTMLElement | null,
): { label: string; element: HTMLElement }[] => {
  if (!container) return [];
  const results: { label: string; element: HTMLElement }[] = [];
  const seen = new Set<string>();

  container
    .querySelectorAll<HTMLElement>(
      "li.result-selectable[role='option'], li.dropdown-result.result-selectable",
    )
    .forEach((li) => {
      if (li.classList.contains("result-unselectable")) return;
      const label = cleanLabelText(
        li.getAttribute("aria-label") ||
          li.getAttribute("title") ||
          li.textContent ||
          "",
      );
      if (!label || seen.has(label)) return;
      if (/make a selection|no results|please select/i.test(label)) return;
      seen.add(label);
      results.push({ label, element: li });
    });

  return results;
};

/**
 * Fill iCIMS custom dropdown (Country / State / referral location, etc.).
 * Opens trigger, optionally types into search, clicks matching option.
 */
const fillIcimsCustomDropdown = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableIcimsAnswer(answer)) return false;

  // Prefer setting native select when options already exist (faster / more reliable)
  if (select.options.length > 1) {
    const nativeOk = await fillNativeSelect(select, answer);
    if (nativeOk) {
      // Sync fake display text if present
      const doc = select.ownerDocument || getIcimsFormDocument();
      const fake = doc.getElementById(
        `${select.id}_fakeSelected_icimsDropdown`,
      );
      if (fake) {
        const matched = Array.from(select.options).find(
          (o) => o.value === select.value,
        );
        if (matched) {
          fake.textContent = cleanLabelText(
            matched.textContent ?? matched.title ?? "",
          );
        }
      }
      return true;
    }
  }

  const trigger = getIcimsDropdownTrigger(select);
  if (!trigger) {
    return fillNativeSelect(select, answer);
  }

  const formDoc = select.ownerDocument || getIcimsFormDocument();
  closeIcimsDropdown(formDoc);
  await delay(100);

  trigger.click();
  await delay(250);
  await waitForDomUpdate();

  let container = getIcimsDropdownContainer(select);
  const search = container?.querySelector<HTMLInputElement>(
    "input.dropdown-search:not(.dropdown-invisible)",
  );
  if (search) {
    search.focus();
    setNativeValue(search, answer);
    search.dispatchEvent(new Event("input", { bubbles: true }));
    search.dispatchEvent(new Event("keyup", { bubbles: true }));
    await delay(300);
    await waitForDomUpdate();
  }

  let scanned = collectVisibleDropdownOptions(container);
  if (scanned.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    container = getIcimsDropdownContainer(select);
    scanned = collectVisibleDropdownOptions(container);
  }

  if (scanned.length === 0) {
    closeIcimsDropdown(formDoc);
    return fillNativeSelect(select, answer);
  }

  const matchedLabel = matchOption(
    answer,
    scanned.map((o) => o.label),
  );
  if (!matchedLabel) {
    closeIcimsDropdown(formDoc);
    return false;
  }

  const target = scanned.find((o) => o.label === matchedLabel);
  if (!target) {
    closeIcimsDropdown(formDoc);
    return false;
  }

  clickOptionElement(target.element);
  await delay(250);
  await handleValueChanges(select);
  select.dispatchEvent(new Event("change", { bubbles: true }));

  // Dependent child dropdowns (Country → State) need a short settle
  const childLink = select.getAttribute("data-ddd-child-link");
  if (childLink) {
    await delay(400);
    await waitForDomUpdate();
  }

  return true;
};

const fillField = async (
  field: IcimsCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableIcimsAnswer(answer)) return false;

  if (field.kind === "select" && isHtmlSelect(field.element)) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "icims-dropdown" && isHtmlSelect(field.element)) {
    return fillIcimsCustomDropdown(field.element, answer);
  }

  // Fallback: select that looked like text during scan
  if (isHtmlSelect(field.element) && isIcimsCustomDropdown(field.element)) {
    return fillIcimsCustomDropdown(field.element, answer);
  }

  if (isHtmlSelect(field.element)) {
    return fillNativeSelect(field.element, answer);
  }

  if (isHtmlInput(field.element) || isHtmlTextArea(field.element)) {
    return fillTextLikeField(field.element, answer);
  }

  return false;
};

/**
 * Applies AI fill answers to the current iCIMS candidate application form.
 */
export const autofillIcimsWithAi = async (
  response: unknown,
): Promise<IcimsAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseIcimsAiFillResponse(response);

  const candidates = collectIcimsCandidateFields();

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

    if (!isUsableIcimsAnswer(answer)) {
      skipped += 1;
      continue;
    }

    try {
      field.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      await delay(120);

      const ok = await fillField(field, answer as string);
      if (ok) {
        filled += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }

    await delay(180);
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
