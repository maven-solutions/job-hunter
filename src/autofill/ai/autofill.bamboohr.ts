import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  BambooHrCandidateField,
  collectBambooHrCandidateFields,
  dispatchBambooHrSelectClick,
  openBambooHrFabricSelectMenu,
  closeBambooHrFabricMenu,
} from "./scan.bamboohr";

export interface BambooHrAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface BambooHrAiFillResult {
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

export const isUsableBambooHrAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableBambooHrAnswer(v));
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
    return isUsableBambooHrAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableBambooHrAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableBambooHrAnswer(v))
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

const isEmptyApiAnswer = (raw: unknown): boolean => !isUsableBambooHrAnswer(raw);

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

export interface BambooHrParsedFillResponse {
  answers: BambooHrAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseBambooHrAiFillResponse = (
  response: unknown,
): BambooHrParsedFillResponse => {
  const answers: BambooHrAiAnswer[] = [];
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

export const normalizeBambooHrAiAnswers = (
  response: unknown,
): BambooHrAiAnswer[] => parseBambooHrAiFillResponse(response).answers;

const normalizeForMatch = (text: string): string =>
  cleanLabelText(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const YES_ANSWERS = new Set(["yes", "y", "true", "1"]);
const NO_ANSWERS = new Set(["no", "n", "false", "0"]);

const matchOption = (answer: string, options: string[]): string | null => {
  if (!answer?.trim() || options.length === 0) return null;

  const cleanAnswer = cleanLabelText(answer);
  const normalizedAnswer = normalizeForMatch(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (cleanLabelText(option) === cleanAnswer) return option;
  }

  for (const option of options) {
    if (normalizeForMatch(option) === normalizedAnswer) return option;
  }

  const legacyAnswer = fromatStirngInLowerCase(cleanAnswer);
  if (legacyAnswer) {
    for (const option of options) {
      if (fromatStirngInLowerCase(option) === legacyAnswer) return option;
    }
  }

  if (YES_ANSWERS.has(normalizedAnswer) || YES_ANSWERS.has(legacyAnswer ?? "")) {
    const hit = options.find((o) => YES_ANSWERS.has(normalizeForMatch(o)));
    if (hit) return hit;
  }
  if (NO_ANSWERS.has(normalizedAnswer) || NO_ANSWERS.has(legacyAnswer ?? "")) {
    const hit = options.find((o) => normalizeForMatch(o) === "no");
    if (hit) return hit;
  }

  if (normalizedAnswer.length >= 4) {
    let best: { option: string; score: number } | null = null;
    for (const option of options) {
      const n = normalizeForMatch(option);
      if (!n) continue;
      let score = 0;
      if (n === normalizedAnswer) score = 100;
      else if (n.includes(normalizedAnswer)) score = 50 + normalizedAnswer.length;
      else if (normalizedAnswer.includes(n) && n.length >= 4) score = 40 + n.length;
      if (score > 0 && (!best || score > best.score)) {
        best = { option, score };
      }
    }
    if (best) return best.option;
  }

  return null;
};

const findAnswerForLabel = (
  label: string,
  answers: BambooHrAiAnswer[],
): BambooHrAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  if (normalized.length >= 12) {
    const soft = answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 8) return false;
      return n.includes(normalized) || normalized.includes(n);
    });
    if (soft) return soft;
  }

  const compact = normalizeForMatch(label);
  if (compact.length >= 12) {
    return answers.find((item) => {
      const n = normalizeForMatch(item.label);
      if (!n || n.length < 8) return false;
      return n.includes(compact) || compact.includes(n);
    });
  }

  return undefined;
};

const fullClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const opts = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent("pointerdown", opts));
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(new PointerEvent("pointerup", opts));
  element.dispatchEvent(new MouseEvent("mouseup", opts));
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
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "checked",
    ) || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
  if (descriptor?.set) {
    descriptor.set.call(input, checked);
  } else {
    input.checked = checked;
  }
};

/** BambooHR date picker expects mm/dd/yyyy. */
const toMmDdYyyy = (answer: string): string => {
  const trimmed = answer.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
    const [m, d, y] = trimmed.split("/");
    const year = y.length === 2 ? `20${y}` : y;
    return `${m.padStart(2, "0")}/${d.padStart(2, "0")}/${year}`;
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[2]}/${iso[3]}/${iso[1]}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${parsed.getFullYear()}`;
  }

  return trimmed;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
  asDate = false,
): Promise<boolean> => {
  if (!isUsableBambooHrAnswer(answer)) return false;

  const value = asDate ? toMmDdYyyy(answer) : answer;
  element.focus();
  setNativeValue(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  element.blur();
  return isUsableBambooHrAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableBambooHrAnswer(answer)) return false;
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

const menuItemLabel = (item: HTMLElement): string =>
  cleanLabelText(
    item.querySelector(".fab-MenuOption__row")?.textContent ??
      item.textContent ??
      "",
  );

const fillFabricSelect = async (
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableBambooHrAnswer(answer)) return false;

  const items = await openBambooHrFabricSelectMenu(wrapper);
  if (items.length === 0) {
    await closeBambooHrFabricMenu();
    return false;
  }

  const labels = items.map(menuItemLabel);
  const matched = matchOption(answer, labels);
  if (!matched) {
    await closeBambooHrFabricMenu();
    return false;
  }

  const target = items.find((item) => menuItemLabel(item) === matched);
  if (!target) {
    await closeBambooHrFabricMenu();
    return false;
  }

  dispatchBambooHrSelectClick(target);
  fullClick(target);
  await delay(150);
  return true;
};

const getRadioOptionLabel = (input: HTMLInputElement): string => {
  const row = input.closest("label, .MuiFormControlLabel-root");
  const text = row?.querySelector(".MuiFormControlLabel-label")?.textContent;
  if (text) return cleanLabelText(text);

  if (input.id) {
    const forLabel = document.querySelector(
      `label[for="${CSS.escape(input.id)}"]`,
    );
    if (forLabel?.textContent) return cleanLabelText(forLabel.textContent);
  }

  const parentLabel = input.closest("label");
  if (parentLabel?.textContent) {
    return cleanLabelText(parentLabel.textContent);
  }

  return cleanLabelText(input.value || "");
};

const fillRadioGroup = async (
  fieldset: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableBambooHrAnswer(answer)) return false;

  const radios = Array.from(
    fieldset.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => ({
    input: radio,
    label: getRadioOptionLabel(radio),
    value: radio.value,
  }));
  const labels = labeled.map((item) => item.label).filter(Boolean);
  const matched =
    matchOption(answer, labels) ||
    matchOption(
      answer,
      labeled.map((item) => item.value),
    );

  if (!matched) return false;

  const target =
    labeled.find((item) => item.label === matched) ||
    labeled.find((item) => item.value === matched);
  if (!target) return false;

  const clickTarget =
    (target.input.closest("label") as HTMLElement | null) || target.input;

  fullClick(clickTarget);
  await delay(40);
  if (target.input.checked) return true;

  setNativeChecked(target.input, true);
  await handleValueChanges(target.input);
  await delay(40);
  return target.input.checked;
};

const fillField = async (
  field: BambooHrCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableBambooHrAnswer(answer)) return false;

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "fabric-select") {
    return fillFabricSelect(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(
      field.element,
      answer,
      field.kind === "date",
    );
  }

  return false;
};

const fillOrderRank = (label: string): number => {
  const n = label.toLowerCase();
  if (n === "country" || n.startsWith("country")) return 0;
  if (n === "state" || n.startsWith("state") || n.includes("province")) {
    return 1;
  }
  return 2;
};

/**
 * Applies AI fill answers to the current BambooHR job application form.
 *
 * Stats:
 * - `filled` = only fields with a usable non-empty API answer AND successful DOM write
 * - empty string / empty array / null / placeholders → not filled (skipped)
 */
export const autofillBambooHrWithAi = async (
  response: unknown,
): Promise<BambooHrAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseBambooHrAiFillResponse(response);
  const candidates = [...collectBambooHrCandidateFields()].sort(
    (a, b) => fillOrderRank(a.label) - fillOrderRank(b.label),
  );

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

    if (!isUsableBambooHrAnswer(answer)) {
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
        if (fillOrderRank(field.label) === 0) {
          // Country change reloads State options
          await delay(350);
        }
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }

    await delay(150);
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
