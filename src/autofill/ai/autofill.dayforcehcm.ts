import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  collectDayforceHcmCandidateFields,
  DayforceHcmCandidateField,
  getDayforceHcmAntSelectRoot,
  getDayforceHcmComboboxInput,
  getDayforceHcmListbox,
  isDayforceHcmFieldFilled,
  isDayforceHcmPhoneCountryCombobox,
} from "./scan.dayforcehcm";

export interface DayforceHcmAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface DayforceHcmAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

const cleanLabelText = (text: string): string =>
  text.replace(/\*/g, "").replace(/\s+/g, " ").trim();

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

export const isUsableDayforceHcmAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableDayforceHcmAnswer(v));
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
    return isUsableDayforceHcmAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableDayforceHcmAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableDayforceHcmAnswer(v))
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
  return !!(compact && emptyLabelKeys.has(compact));
};

export interface DayforceHcmParsedFillResponse {
  answers: DayforceHcmAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseDayforceHcmAiFillResponse = (
  response: unknown,
): DayforceHcmParsedFillResponse => {
  const answers: DayforceHcmAiAnswer[] = [];
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
    if (!isUsableDayforceHcmAnswer(raw)) {
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
      if (!isUsableDayforceHcmAnswer(value)) {
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

export const normalizeDayforceHcmAiAnswers = (
  response: unknown,
): DayforceHcmAiAnswer[] => parseDayforceHcmAiFillResponse(response).answers;

const matchOption = (answer: string, options: string[]): string | null => {
  if (!isUsableDayforceHcmAnswer(answer)) return null;
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

const stripFlagEmoji = (text: string): string =>
  text
    .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const parseDialAndCountry = (
  text: string,
): { dial: string; name: string; raw: string } => {
  const raw = stripFlagEmoji(text).toLowerCase();
  const match = raw.match(/^\+?(\d+)\s*(.*)$/);
  return {
    raw,
    dial: match?.[1] ?? "",
    name: (match?.[2] ?? raw).trim(),
  };
};

/**
 * Match answers like "United States", "+1", "US", "🇺🇸 +1 United States of America"
 * to Dayforce options like "🇺🇸 +1 United States of America".
 */
const matchPhoneCountryOption = (
  answer: string,
  options: string[],
): string | null => {
  if (!isUsableDayforceHcmAnswer(answer) || options.length === 0) return null;

  const parsedAnswer = parseDialAndCountry(answer);
  const aliases: Record<string, string> = {
    us: "united states",
    usa: "united states",
    uk: "united kingdom",
    gb: "united kingdom",
  };
  const answerName =
    aliases[parsedAnswer.name.replace(/\./g, "")] || parsedAnswer.name;

  let best: string | null = null;
  let bestScore = 0;

  for (const option of options) {
    const parsedOption = parseDialAndCountry(option);
    let score = 0;

    if (parsedOption.raw === parsedAnswer.raw) score = 100;
    if (
      answerName &&
      parsedOption.name === answerName &&
      answerName.length >= 2
    ) {
      score = Math.max(score, 95);
    }
    if (
      answerName &&
      answerName.length >= 4 &&
      parsedOption.name.includes(answerName)
    ) {
      score = Math.max(score, 88);
    }
    if (
      answerName &&
      parsedOption.name.length >= 4 &&
      answerName.includes(parsedOption.name)
    ) {
      score = Math.max(score, 82);
    }
    if (
      parsedAnswer.dial &&
      parsedOption.dial === parsedAnswer.dial &&
      answerName &&
      parsedOption.name.includes(answerName)
    ) {
      score = Math.max(score, 90);
    }
    if (
      parsedAnswer.dial &&
      !answerName &&
      parsedOption.dial === parsedAnswer.dial &&
      /united states/.test(parsedOption.name)
    ) {
      score = Math.max(score, 75);
    }

    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }

  if (best && bestScore >= 75) return best;
  return matchOption(answer, options);
};

const getPhoneCountrySearchQuery = (answer: string): string => {
  const cleaned = stripFlagEmoji(answer);
  const match = cleaned.match(/^\+?\d+\s+(.+)$/);
  if (match?.[1]) return match[1].trim();
  const aliases: Record<string, string> = {
    us: "United States",
    usa: "United States",
    uk: "United Kingdom",
  };
  const lower = cleaned.toLowerCase().replace(/\./g, "");
  return aliases[lower] || cleaned;
};

const findAnswerForLabel = (
  label: string,
  answers: DayforceHcmAiAnswer[],
): DayforceHcmAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  const isCountryCodeLabel =
    /countrycode|dialingcode|dialing/.test(normalized) ||
    /country code|dialing code/i.test(label);
  if (!isCountryCodeLabel) return undefined;

  return answers.find((item) => {
    const n = normalizeLabel(item.label);
    if (!n) return false;
    if (normalized.includes("home") && n.includes("home")) return true;
    if (normalized.includes("mobile") && n.includes("mobile")) return true;
    return (
      n.includes("countrycode") ||
      n.includes("dialing") ||
      n === "phonecountrycode"
    );
  });
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const waitUntil = (
  predicate: () => boolean,
  timeoutMs: number,
): Promise<boolean> =>
  new Promise((resolve) => {
    if (predicate()) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const poll = window.setInterval(() => {
      if (predicate()) {
        window.clearInterval(poll);
        resolve(true);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        window.clearInterval(poll);
        resolve(false);
      }
    }, 150);
  });

const setNativeInputValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

const clickOptionElement = (optionEl: HTMLElement): void => {
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  optionEl.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.click();
};

const getVisibleAntDropdown = (): HTMLElement | null => {
  const dropdowns = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
    ),
  ).filter((node) => {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  });
  return dropdowns[dropdowns.length - 1] ?? null;
};

const getOpenListbox = (selectRoot: HTMLElement): HTMLElement | null =>
  getDayforceHcmListbox(selectRoot) ?? getVisibleAntDropdown();

const scanDropdownOptions = (
  dropdown: HTMLElement,
): Array<{ label: string; element: HTMLElement }> => {
  const results: Array<{ label: string; element: HTMLElement }> = [];
  const seen = new Set<string>();

  dropdown
    .querySelectorAll<HTMLElement>(
      ".ant-select-item-option, [role='option']",
    )
    .forEach((optionEl) => {
      if (
        optionEl.getAttribute("aria-disabled") === "true" ||
        optionEl.classList.contains("ant-select-item-option-disabled")
      ) {
        return;
      }
      const content =
        optionEl.querySelector(".ant-select-item-option-content")
          ?.textContent ?? optionEl.textContent;
      const label = cleanLabelText(content ?? "");
      if (!label || seen.has(label)) return;
      seen.add(label);
      results.push({ label, element: optionEl });
    });

  return results;
};

const closeAntSelect = async (): Promise<void> => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await delay(80);
};

const openAntSelect = async (selectRoot: HTMLElement): Promise<boolean> => {
  if (selectRoot.classList.contains("ant-select-open")) {
    await closeAntSelect();
    await delay(80);
  }

  const selector =
    selectRoot.querySelector<HTMLElement>(".ant-select-selector") ?? selectRoot;
  selector.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  selector.click();

  const input = getDayforceHcmComboboxInput(selectRoot);
  if (input && !input.readOnly) {
    input.focus();
    input.click();
  }

  await waitForDomUpdate();
  await delay(160);

  return (
    selectRoot.classList.contains("ant-select-open") ||
    getOpenListbox(selectRoot) != null
  );
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableDayforceHcmAnswer(answer)) return false;
  element.focus();
  setNativeInputValue(element, answer);
  await handleValueChanges(element);
  return isUsableDayforceHcmAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableDayforceHcmAnswer(answer)) return false;
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

const fillDayforceHcmCombobox = async (
  selectRoot: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableDayforceHcmAnswer(answer)) return false;

  if (selectRoot.classList.contains("ant-select-disabled")) {
    const enabled = await waitUntil(
      () => !selectRoot.classList.contains("ant-select-disabled"),
      8000,
    );
    if (!enabled) return false;
  }

  const input = getDayforceHcmComboboxInput(selectRoot);
  if (!input) return false;

  const opened = await openAntSelect(selectRoot);
  if (!opened) return false;

  const isPhoneCountry = isDayforceHcmPhoneCountryCombobox(selectRoot);
  const searchable =
    selectRoot.classList.contains("ant-select-show-search") && !input.readOnly;
  const searchQuery = isPhoneCountry
    ? getPhoneCountrySearchQuery(answer)
    : answer;

  if (searchable) {
    input.focus();
    setNativeInputValue(input, "");
    await delay(60);
    setNativeInputValue(input, searchQuery);
    await delay(280);
    await waitForDomUpdate();
  }

  let dropdown = getOpenListbox(selectRoot);
  let scanned = dropdown ? scanDropdownOptions(dropdown) : [];
  if (scanned.length === 0) {
    await delay(280);
    dropdown = getOpenListbox(selectRoot);
    scanned = dropdown ? scanDropdownOptions(dropdown) : [];
  }

  if (scanned.length === 0) {
    await closeAntSelect();
    return false;
  }

  const labels = scanned.map((opt) => opt.label);
  const matchedLabel = isPhoneCountry
    ? matchPhoneCountryOption(answer, labels)
    : matchOption(answer, labels);
  if (!matchedLabel) {
    await closeAntSelect();
    return false;
  }

  const target = scanned.find((opt) => opt.label === matchedLabel);
  if (!target) {
    await closeAntSelect();
    return false;
  }

  clickOptionElement(target.element);
  await delay(220);

  const selected = selectRoot.querySelector(".ant-select-selection-item");
  return !!selected?.textContent?.trim();
};

const isCountryField = (label: string): boolean => {
  const n = normalizeLabel(label);
  return n === "country" || n === "countryregion";
};

const waitForStateSelectEnabled = async (): Promise<void> => {
  const stateInput = document.querySelector<HTMLInputElement>(
    "#jobPostingApplication_personalInfo_stateCode",
  );
  const root =
    (stateInput && getDayforceHcmAntSelectRoot(stateInput)) ||
    (document
      .querySelector<HTMLElement>("[test-id='state-province-selector']")
      ?.querySelector(".ant-select") as HTMLElement | null);
  if (!root) return;

  await waitUntil(() => !root.classList.contains("ant-select-disabled"), 8000);
  await delay(200);
};

const fillField = async (
  field: DayforceHcmCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableDayforceHcmAnswer(answer)) return false;

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox" && field.selectRoot) {
    return fillDayforceHcmCombobox(field.selectRoot, answer);
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
 * Applies AI fill answers to remaining empty Dayforce HCM fields.
 * Fields already populated by resume parse are skipped (not overwritten).
 */
export const autofillDayforceHcmWithAi = async (
  response: unknown,
): Promise<DayforceHcmAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseDayforceHcmAiFillResponse(response);

  const candidates = collectDayforceHcmCandidateFields();

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
    if (isDayforceHcmFieldFilled(field)) {
      skipped += 1;
      continue;
    }

    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableDayforceHcmAnswer(answer)) {
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
        if (isCountryField(field.label)) {
          await waitForStateSelectEnabled();
        }
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }

    await delay(160);
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
