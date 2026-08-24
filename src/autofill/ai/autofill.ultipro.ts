import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  UltiproCandidateField,
  collectUltiproCandidateFields,
  getUltiproNativeSelectOptions,
  isUltiproCountryField,
  isUltiproStateField,
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

const notifyUltiproControl = async (element: HTMLElement): Promise<void> => {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);

  const jquery = (window as any).jQuery || (window as any).$;
  try {
    jquery?.(element)?.trigger?.("change");
  } catch {
    // jQuery is optional — native events already fired.
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

  target.option.selected = true;
  setNativeValue(select, target.option.value);
  select.focus();
  await notifyUltiproControl(select);
  return select.value === target.option.value;
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

const fillField = async (
  field: UltiproCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableUltiproAnswer(answer)) return false;

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

const sortFieldsForFill = (
  fields: UltiproCandidateField[],
): UltiproCandidateField[] => {
  const score = (field: UltiproCandidateField): number => {
    if (isUltiproCountryField(field.element)) return 10;
    if (isUltiproStateField(field.element)) return 90;
    return 50;
  };
  return [...fields].sort((a, b) => score(a) - score(b));
};

/**
 * Applies AI fill answers to the current UKG / Ultipro apply form.
 * Country is filled before State so Knockout can load state options.
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

      const ok = await fillField(field, answer as string);
      if (ok) {
        filled += 1;

        if (isUltiproCountryField(field.element)) {
          const stateSelect = findStateSelect(candidates);
          if (stateSelect) {
            await delay(200);
            await waitForSelectOptions(stateSelect);
          }
        }
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
