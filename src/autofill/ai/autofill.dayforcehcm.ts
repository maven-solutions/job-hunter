import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  collectDayforceHcmCandidateFields,
  DayforceHcmCandidateField,
  ensureDayforceHcmEducationRecords,
  getDayforceHcmAntSelectRoot,
  getDayforceHcmComboboxInput,
  getDayforceHcmEducationIndex,
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

const compactLabelKey = (label: string): string =>
  cleanLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const fieldKey = (text: string): string => compactLabelKey(text);

const addLabelKey = (set: Set<string>, label: string): void => {
  const compact = compactLabelKey(label);
  if (compact) set.add(compact);
};

const isFieldMarkedEmpty = (
  label: string,
  emptyLabelKeys: Set<string>,
): boolean => {
  if (emptyLabelKeys.size === 0) return false;
  const compact = compactLabelKey(label);
  return !!(compact && emptyLabelKeys.has(compact));
};

/** Map API education keys onto Dayforce Education History labels. */
const EDUCATION_FIELD_MAP: Record<string, string> = {
  school: "School",
  schooloruniversity: "School",
  schoolname: "School",
  university: "School",
  college: "School",
  degree: "Degree",
  degreename: "Degree",
  fieldofstudy: "Major",
  major: "Major",
  majorname: "Major",
  field: "Major",
  minor: "Minor",
  minorname: "Minor",
  overallresultgpa: "G.P.A.",
  overallresult: "G.P.A.",
  gpa: "G.P.A.",
  gradeaverage: "G.P.A.",
  grade: "G.P.A.",
  from: "Start Date",
  fromyyyy: "Start Date",
  firstyearattended: "Start Date",
  startyear: "Start Date",
  startdate: "Start Date",
  start: "Start Date",
  effectivestart: "Start Date",
  to: "End Date",
  toyyyy: "End Date",
  toactualorexpected: "End Date",
  lastyearattended: "End Date",
  endyear: "End Date",
  enddate: "End Date",
  end: "End Date",
  effectiveend: "End Date",
  country: "Country",
  countrycode: "Country",
  countryregion: "Country",
  state: "State/Province",
  statecode: "State/Province",
  stateprovince: "State/Province",
  province: "State/Province",
  city: "City",
  notcompleted: "Not Completed",
  incomplete: "Not Completed",
  educationnotcompleted: "Not Completed",
};

const EDUCATION_LABEL_ALIASES: string[][] = [
  ["school", "schooloruniversity", "schoolname", "university", "college"],
  ["degree", "degreename"],
  ["major", "majorname", "fieldofstudy", "field"],
  ["minor", "minorname"],
  ["gpa", "overallresultgpa", "overallresult", "gradeaverage", "grade"],
  ["startdate", "from", "fromyyyy", "effectivestart", "start", "startyear"],
  ["enddate", "to", "toyyyy", "effectiveend", "end", "endyear"],
  ["country", "countrycode", "countryregion"],
  ["stateprovince", "state", "statecode", "province"],
  ["city"],
  ["notcompleted", "incomplete", "educationnotcompleted"],
];

const parseEducationPrefixedLabel = (
  label: string,
): { index: number; field: string } | null => {
  const m = cleanLabelText(label).match(/^Education\s*(\d+)\s*-\s*(.+)$/i);
  if (!m) return null;
  return { index: Number(m[1]), field: compactLabelKey(m[2]) };
};

const educationFieldsAliasMatch = (a: string, b: string): boolean => {
  for (const aliases of EDUCATION_LABEL_ALIASES) {
    if (aliases.includes(a) && aliases.includes(b)) return true;
  }
  return false;
};

const GROUP_META_KEYS = new Set([
  "label",
  "type",
  "required",
  "options",
  "count",
  "description",
]);

const coerceGroupEntryRecord = (
  item: unknown,
): Record<string, unknown> | null => {
  if (item == null) return null;

  if (Array.isArray(item)) {
    const record: Record<string, unknown> = {};
    for (const field of item) {
      if (field == null || typeof field !== "object") continue;
      const f = field as Record<string, unknown>;
      const fieldName = String(f.name ?? f.label ?? f.field ?? "").trim();
      if (!fieldName) continue;
      record[fieldName] = f.value ?? f.answer ?? f.fill ?? f.text;
    }
    return Object.keys(record).length > 0 ? record : null;
  }

  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    if (
      ("name" in obj || "label" in obj) &&
      ("value" in obj || "answer" in obj) &&
      !("school" in obj) &&
      !("degree" in obj)
    ) {
      const fieldName = String(obj.name ?? obj.label ?? "").trim();
      if (!fieldName) return null;
      return { [fieldName]: obj.value ?? obj.answer };
    }
    return obj;
  }

  return null;
};

const normalizeGroupEntries = (raw: unknown): Record<string, unknown>[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    if (raw.length > 0 && Array.isArray(raw[0])) {
      return raw
        .map((item) => coerceGroupEntryRecord(item))
        .filter(Boolean) as Record<string, unknown>[];
    }
    if (
      raw.length > 0 &&
      typeof raw[0] === "object" &&
      raw[0] != null &&
      ("name" in (raw[0] as object) || "label" in (raw[0] as object)) &&
      ("value" in (raw[0] as object) || "answer" in (raw[0] as object)) &&
      !Array.isArray((raw[0] as any).value) &&
      typeof (raw[0] as any).value !== "object"
    ) {
      const firstName = String(
        (raw[0] as any).name ?? (raw[0] as any).label ?? "",
      );
      if (/school|degree|major|gpa|from|to|start|end/i.test(firstName)) {
        const single = coerceGroupEntryRecord(raw);
        return single ? [single] : [];
      }
    }
    return raw
      .map((item) => coerceGroupEntryRecord(item))
      .filter(Boolean) as Record<string, unknown>[];
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["entries", "items", "data", "records"]) {
      if (Array.isArray(obj[key])) {
        return normalizeGroupEntries(obj[key]);
      }
    }
    if (
      "label" in obj &&
      ("type" in obj || "options" in obj) &&
      !("school" in obj) &&
      !("degree" in obj)
    ) {
      return normalizeGroupEntries(
        obj.answer ?? obj.value ?? obj.fill ?? obj.data,
      );
    }
    const coerced = coerceGroupEntryRecord(obj);
    return coerced ? [coerced] : [];
  }
  return [];
};

const resolveEducationFieldLabel = (rawLabel: string): string => {
  const mapped = EDUCATION_FIELD_MAP[fieldKey(rawLabel)];
  if (mapped) return mapped;
  let fieldLabel = cleanLabelText(rawLabel);
  if (/^school/i.test(fieldLabel)) return "School";
  if (/field of study/i.test(fieldLabel)) return "Major";
  if (/gpa|overall result/i.test(fieldLabel)) return "G.P.A.";
  if (/^from/i.test(fieldLabel) || /^start/i.test(fieldLabel)) {
    return "Start Date";
  }
  if (/^to/i.test(fieldLabel) || /^end/i.test(fieldLabel)) return "End Date";
  return fieldLabel;
};

const flattenEducationEntry = (
  entry: Record<string, unknown>,
): { fieldLabel: string; value: unknown }[] => {
  const out: { fieldLabel: string; value: unknown }[] = [];
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(entry)) {
    if (value == null) continue;
    if (GROUP_META_KEYS.has(key.toLowerCase())) continue;

    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("answer" in (value as object) ||
        "value" in (value as object) ||
        "name" in (value as object) ||
        "label" in (value as object))
    ) {
      const nested = value as {
        name?: string;
        label?: string;
        answer?: unknown;
        value?: unknown;
      };
      const fieldLabel = resolveEducationFieldLabel(
        String(nested.name ?? nested.label ?? key),
      );
      if (seen.has(fieldLabel)) continue;
      seen.add(fieldLabel);
      out.push({ fieldLabel, value: nested.answer ?? nested.value });
      continue;
    }

    const fieldLabel = resolveEducationFieldLabel(key);
    if (seen.has(fieldLabel)) continue;
    seen.add(fieldLabel);
    out.push({ fieldLabel, value });
  }

  return out;
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

  const pushAnswer = (item: DayforceHcmAiAnswer): void => {
    answers.push(item);
  };

  const pushEducationGroup = (raw: unknown): void => {
    const entries = normalizeGroupEntries(raw);
    if (entries.length === 0) {
      markEmpty("Education");
      return;
    }

    entries.forEach((entry, index) => {
      const prefix = `Education ${index + 1}`;
      const fields = flattenEducationEntry(entry);
      for (const { fieldLabel, value } of fields) {
        if (!isUsableDayforceHcmAnswer(value)) {
          markEmpty(`${prefix} - ${fieldLabel}`);
          continue;
        }
        pushAnswer({
          label: `${prefix} - ${fieldLabel}`,
          answer: coerceAnswerString(value),
        });
      }
    });
  };

  const processItem = (item: any): void => {
    if (!item || typeof item !== "object") return;
    const label = String(item.label ?? item.field ?? item.name ?? "").trim();
    if (!label) return;

    const typeStr = String(item.type ?? "").toLowerCase();
    const raw = extractRawAnswer(item);

    if (typeStr === "education" || /^education$/i.test(label)) {
      pushEducationGroup(
        raw ?? item.entries ?? item.data ?? item.items,
      );
      return;
    }

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
    if (Array.isArray(payload.education)) {
      pushEducationGroup(payload.education);
    }

    const reserved = new Set([
      "elements",
      "answers",
      "fields",
      "fill_data_list",
      "education",
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
      if (/^education$/i.test(label) && typeof value === "object") {
        pushEducationGroup(value);
        continue;
      }
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

  const compact = compactLabelKey(label);
  const byCompact = answers.find(
    (item) => compactLabelKey(item.label) === compact,
  );
  if (byCompact) return byCompact;

  const parsedField = parseEducationPrefixedLabel(label);
  if (parsedField) {
    const aliased = answers.find((item) => {
      const parsedAnswer = parseEducationPrefixedLabel(item.label);
      if (!parsedAnswer || parsedAnswer.index !== parsedField.index) {
        return false;
      }
      if (parsedAnswer.field === parsedField.field) return true;
      return educationFieldsAliasMatch(parsedField.field, parsedAnswer.field);
    });
    if (aliased) return aliased;
  }

  const normalized = normalizeLabel(label);
  const normMatches = answers.filter(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (normMatches.length === 1) return normMatches[0];

  const isCountryCodeLabel =
    /countrycode|dialingcode|dialing/.test(normalized || "") ||
    /country code|dialing code/i.test(label);
  if (!isCountryCodeLabel) return undefined;

  return answers.find((item) => {
    const n = normalizeLabel(item.label);
    if (!n) return false;
    if ((normalized || "").includes("home") && n.includes("home")) return true;
    if ((normalized || "").includes("mobile") && n.includes("mobile")) {
      return true;
    }
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
  const tracker = (element as HTMLInputElement & {
    _valueTracker?: { setValue: (v: string) => void };
  })._valueTracker;
  tracker?.setValue("");
  setter?.call(element, value);
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertFromPaste",
      data: value,
    }),
  );
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableDayforceHcmAnswer(answer)) return false;
  const max = element.maxLength;
  const value =
    max > 0 && answer.length > max ? answer.slice(0, max) : answer;
  element.scrollIntoView({ block: "center", inline: "nearest" });
  element.focus();
  element.click();
  setNativeInputValue(element, value);
  await handleValueChanges(element);
  element.blur();
  return (element.value ?? "").trim().length > 0;
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
  const compact = compactLabelKey(label);
  if (/phone|dialing/i.test(label) && /country code/i.test(label)) {
    return false;
  }
  if (compact.includes("phonecountry") || compact.endsWith("countrycode")) {
    return false;
  }
  return compact === "country" || compact.endsWith("country");
};

const waitForStateSelectEnabled = async (
  context?: HTMLElement,
): Promise<void> => {
  const scope: ParentNode = context?.closest("form") ?? document;
  const stateInput =
    scope.querySelector<HTMLInputElement>("[id$='_stateCode']") ||
    document.querySelector<HTMLInputElement>(
      "#jobPostingApplication_personalInfo_stateCode",
    );
  const root =
    (stateInput && getDayforceHcmAntSelectRoot(stateInput)) ||
    (scope
      .querySelector<HTMLElement>("[test-id='state-province-selector']")
      ?.querySelector(".ant-select") as HTMLElement | null);
  if (!root) return;

  await waitUntil(() => !root.classList.contains("ant-select-disabled"), 8000);
  await delay(200);
};

const isTruthyCheckboxAnswer = (answer: string): boolean =>
  /^(true|yes|y|1|checked|on|not completed|incomplete)$/i.test(answer.trim());

const coerceToIsoDate = (answer: string): string => {
  const t = answer.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

  const ymd = t.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
  }

  const ym = t.match(/^(\d{4})[/\-.](\d{1,2})$/);
  if (ym) return `${ym[1]}-${ym[2].padStart(2, "0")}-01`;

  const my = t.match(/^(\d{1,2})[/\-.](\d{4})$/);
  if (my) return `${my[2]}-${my[1].padStart(2, "0")}-01`;

  const y = t.match(/^(\d{4})$/);
  if (y) return `${y[1]}-06-01`;

  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  return t;
};

const fillCheckboxField = (
  element: HTMLInputElement,
  answer: string,
): boolean => {
  const want = isTruthyCheckboxAnswer(answer);
  if (element.checked === want) return true;
  const clickTarget =
    (element.closest(".ant-checkbox-wrapper") as HTMLElement | null) ??
    element;
  clickTarget.click();
  return element.checked === want;
};

const fillField = async (
  field: DayforceHcmCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableDayforceHcmAnswer(answer)) return false;

  if (field.kind === "checkbox" && field.element instanceof HTMLInputElement) {
    return fillCheckboxField(field.element, answer);
  }

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
    const value =
      field.kind === "date" ||
      (field.element instanceof HTMLInputElement &&
        field.element.type === "date")
        ? coerceToIsoDate(answer)
        : answer;
    return fillTextLikeField(field.element, value);
  }

  return false;
};

const countEducationAnswers = (answers: DayforceHcmAiAnswer[]): number => {
  const nums = new Set<number>();
  for (const item of answers) {
    const m = item.label.match(/^Education\s*(\d+)\s*-/i);
    if (m) nums.add(Number(m[1]));
  }
  return nums.size;
};

const educationFieldSortKey = (label: string): number => {
  const edu = label.match(/^Education\s*(\d+)\s*-\s*(.+)$/i);
  if (edu) {
    const idx = Number(edu[1]) || 1;
    const bare = edu[2].toLowerCase();
    let fieldOrder = 50;
    if (/school/.test(bare)) fieldOrder = 1;
    else if (/^degree/.test(bare)) fieldOrder = 2;
    else if (/major|field of study/.test(bare)) fieldOrder = 3;
    else if (/minor/.test(bare)) fieldOrder = 4;
    else if (/start date|^from/.test(bare)) fieldOrder = 5;
    else if (/end date|^to /.test(bare) || /^to$/.test(bare.trim()))
      fieldOrder = 6;
    else if (/country/.test(bare) && !/code/.test(bare)) fieldOrder = 7;
    else if (/state|province/.test(bare)) fieldOrder = 8;
    else if (/^city/.test(bare)) fieldOrder = 9;
    else if (/g\.?p\.?a|overall result/.test(bare)) fieldOrder = 10;
    else if (/not completed/.test(bare)) fieldOrder = 11;
    return 5000 + idx * 20 + fieldOrder;
  }

  const compact = compactLabelKey(label);
  if (compact === "country") return 10;
  if (compact === "stateprovince" || compact === "state") return 11;
  return 100;
};

const clickEducationUpdate = async (index: number): Promise<void> => {
  const form = document.querySelector<HTMLFormElement>(
    `#educationHistory-${index}, form[id="educationHistory-${index}"]`,
  );
  const btn = form?.querySelector<HTMLButtonElement>(
    '[test-id="educationHistory-update-button"]',
  );
  if (!btn) return;
  btn.click();
  await delay(500);
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

  const eduNeeded = countEducationAnswers(answers);
  if (eduNeeded > 0) {
    await ensureDayforceHcmEducationRecords(eduNeeded);
  }

  const candidates = collectDayforceHcmCandidateFields();
  const ordered = [...candidates].sort(
    (a, b) => educationFieldSortKey(a.label) - educationFieldSortKey(b.label),
  );

  let filled = 0;
  let failed = 0;
  let skipped = 0;
  let lastEducationIndex: number | null = null;

  if (answers.length === 0 && emptyCount === 0) {
    return {
      total: 0,
      filled: 0,
      failed: 0,
      skipped: candidates.length,
    };
  }

  for (const field of ordered) {
    const educationIndex = getDayforceHcmEducationIndex(field.element);
    if (
      lastEducationIndex != null &&
      educationIndex !== lastEducationIndex &&
      (educationIndex == null || educationIndex > lastEducationIndex)
    ) {
      await clickEducationUpdate(lastEducationIndex);
    }
    if (educationIndex != null) lastEducationIndex = educationIndex;

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
          await waitForStateSelectEnabled(field.element);
        }
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }

    await delay(160);
  }

  if (lastEducationIndex != null) {
    await clickEducationUpdate(lastEducationIndex);
  }

  // Known Ant Design ids — fill if still empty (e.g. Address Line 1 skipped
  // because "Address Line 2" emptied the digit-stripped label key).
  const knownTextIds: Array<{ id: string; keys: string[] }> = [
    {
      id: "jobPostingApplication_personalInfo_address1",
      keys: ["addressline1", "address1"],
    },
    {
      id: "jobPostingApplication_personalInfo_address2",
      keys: ["addressline2", "address2"],
    },
  ];

  for (const known of knownTextIds) {
    const input = document.getElementById(known.id);
    if (
      !(input instanceof HTMLInputElement) &&
      !(input instanceof HTMLTextAreaElement)
    ) {
      continue;
    }
    if ((input.value ?? "").trim()) continue;

    const match = answers.find((item) =>
      known.keys.includes(compactLabelKey(item.label)),
    );
    if (!isUsableDayforceHcmAnswer(match?.answer)) continue;

    try {
      const ok = await fillTextLikeField(input, match!.answer);
      if (ok) filled += 1;
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
