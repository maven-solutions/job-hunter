import { delay, handleValueChanges } from "../helper";
import {
  closeJobdivaFlyout,
  collectJobdivaCandidateFields,
  ensureJobdivaEducationCards,
  ensureJobdivaWorkExperienceCards,
  getJobdivaDropdownRoot,
  JobdivaCandidateField,
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

/**
 * Keep digits. The shared lower-case helper strips them, so "Address 1" and
 * "Address 2" collapse to the same key and an empty Address 2 skips Address 1.
 */
const normalizeLabel = (label: string): string =>
  cleanLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

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

const educationFieldKey = (label: string): string =>
  cleanLabelText(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/** Profile and API keys mapped onto this form's education labels. */
const JOBDIVA_EDUCATION_FIELD_MAP: Record<string, string> = {
  school: "School",
  schoolname: "School",
  university: "School",
  college: "School",
  degree: "Degree/Diploma",
  diploma: "Degree/Diploma",
  degreediploma: "Degree/Diploma",
  major: "Major",
  fieldofstudy: "Major",
  field: "Major",
  graduationyear: "Graduation Year",
  graduation: "Graduation Year",
  year: "Graduation Year",
  endyear: "Graduation Year",
  enddate: "Graduation Year",
  to: "Graduation Year",
  lastyearattended: "Graduation Year",
};

const EDUCATION_ENTRY_META_KEYS = new Set([
  "label",
  "type",
  "required",
  "options",
  "count",
  "description",
  "id",
]);

const graduationYearAnswer = (value: unknown): string => {
  const text = coerceAnswerString(value);
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : text;
};

const coerceEducationEntry = (
  item: unknown,
): Record<string, unknown> | null => {
  if (item == null) return null;

  if (Array.isArray(item)) {
    const record: Record<string, unknown> = {};
    for (const field of item) {
      if (field == null || typeof field !== "object") continue;
      const row = field as Record<string, unknown>;
      const fieldName = String(row.name ?? row.label ?? row.field ?? "").trim();
      if (!fieldName) continue;
      record[fieldName] = row.value ?? row.answer ?? row.fill ?? row.text;
    }
    return Object.keys(record).length > 0 ? record : null;
  }

  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const looksLikeField =
      ("name" in obj || "label" in obj) &&
      ("value" in obj || "answer" in obj) &&
      !("school" in obj) &&
      !("degree" in obj) &&
      !("major" in obj);
    if (looksLikeField) {
      const fieldName = String(obj.name ?? obj.label ?? "").trim();
      if (!fieldName) return null;
      const fieldValue = obj.value ?? obj.answer;
      if (
        fieldValue != null &&
        typeof fieldValue === "object" &&
        !Array.isArray(fieldValue)
      ) {
        return coerceEducationEntry(fieldValue);
      }
      return { [fieldName]: fieldValue };
    }
    return obj;
  }

  return null;
};

const normalizeEducationEntries = (raw: unknown): Record<string, unknown>[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    if (raw.length > 0 && Array.isArray(raw[0])) {
      return raw
        .map((item) => coerceEducationEntry(item))
        .filter((item): item is Record<string, unknown> => !!item);
    }
    if (
      raw.length > 0 &&
      typeof raw[0] === "object" &&
      raw[0] != null &&
      ("name" in (raw[0] as object) || "label" in (raw[0] as object)) &&
      ("value" in (raw[0] as object) || "answer" in (raw[0] as object)) &&
      !Array.isArray((raw[0] as { value?: unknown }).value) &&
      typeof (raw[0] as { value?: unknown }).value !== "object"
    ) {
      const firstName = String(
        (raw[0] as { name?: unknown; label?: unknown }).name ??
          (raw[0] as { label?: unknown }).label ??
          "",
      );
      if (/school|degree|major|graduation|diploma/i.test(firstName)) {
        const single = coerceEducationEntry(raw);
        return single ? [single] : [];
      }
    }
    return raw
      .map((item) => coerceEducationEntry(item))
      .filter((item): item is Record<string, unknown> => !!item);
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["entries", "items", "data", "records", "education"]) {
      if (Array.isArray(obj[key])) return normalizeEducationEntries(obj[key]);
    }
    if (
      "label" in obj &&
      ("type" in obj || "options" in obj) &&
      !("school" in obj) &&
      !("degree" in obj)
    ) {
      return normalizeEducationEntries(
        obj.answer ?? obj.value ?? obj.fill ?? obj.data,
      );
    }
    const coerced = coerceEducationEntry(obj);
    return coerced ? [coerced] : [];
  }
  return [];
};

const educationAnswerCount = (answers: JobdivaAiAnswer[]): number =>
  answers.reduce((max, item) => {
    const match = item.label.match(/^education\s*(\d+)\s*-/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ROLE_LABEL = "Describe your role and responsibilities";

/** Profile and API keys mapped onto this form's work-experience labels. */
const JOBDIVA_WORK_FIELD_MAP: Record<string, string> = {
  company: "Company",
  companyname: "Company",
  employer: "Company",
  jobtitle: "Job Title",
  title: "Job Title",
  position: "Job Title",
  description: ROLE_LABEL,
  roledescription: ROLE_LABEL,
  responsibilities: ROLE_LABEL,
  role: ROLE_LABEL,
  describeyourroleandresponsibilities: ROLE_LABEL,
  frommonth: "From Month",
  startmonth: "From Month",
  tomonth: "To Month",
  endmonth: "To Month",
  fromyear: "From Year",
  startyear: "From Year",
  toyear: "To Year",
  endyear: "To Year",
};

const monthNameFrom = (value: unknown): string => {
  const text = coerceAnswerString(value);
  const named = MONTH_NAMES.find((month) =>
    text.toLowerCase().includes(month.toLowerCase()),
  );
  if (named) return named;
  const iso = text.match(/\b(?:19|20)\d{2}[-/](\d{1,2})\b/);
  if (iso) {
    const month = Number(iso[1]);
    if (month >= 1 && month <= 12) return MONTH_NAMES[month - 1];
  }
  const us = text.match(/\b(\d{1,2})[-/](?:19|20)\d{2}\b/);
  if (us) {
    const month = Number(us[1]);
    if (month >= 1 && month <= 12) return MONTH_NAMES[month - 1];
  }
  return "";
};

const yearFrom = (value: unknown): string => {
  const text = coerceAnswerString(value);
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
};

const normalizeWorkEntries = (raw: unknown): Record<string, unknown>[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    if (raw.length > 0 && Array.isArray(raw[0])) {
      return raw
        .map((item) => coerceEducationEntry(item))
        .filter((item): item is Record<string, unknown> => !!item);
    }
    if (
      raw.length > 0 &&
      typeof raw[0] === "object" &&
      raw[0] != null &&
      ("name" in (raw[0] as object) || "label" in (raw[0] as object)) &&
      ("value" in (raw[0] as object) || "answer" in (raw[0] as object)) &&
      !Array.isArray((raw[0] as { value?: unknown }).value) &&
      typeof (raw[0] as { value?: unknown }).value !== "object"
    ) {
      const firstName = String(
        (raw[0] as { name?: unknown; label?: unknown }).name ??
          (raw[0] as { label?: unknown }).label ??
          "",
      );
      if (/company|job\s*title|from|to|describe|role|responsibilit/i.test(firstName)) {
        const single = coerceEducationEntry(raw);
        return single ? [single] : [];
      }
    }
    return raw
      .map((item) => coerceEducationEntry(item))
      .filter((item): item is Record<string, unknown> => !!item);
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["entries", "items", "data", "records", "jobs", "employment"]) {
      if (Array.isArray(obj[key])) return normalizeWorkEntries(obj[key]);
    }
    if (
      "label" in obj &&
      ("type" in obj || "options" in obj) &&
      !("company" in obj) &&
      !("jobTitle" in obj)
    ) {
      return normalizeWorkEntries(obj.answer ?? obj.value ?? obj.fill ?? obj.data);
    }
    const coerced = coerceEducationEntry(obj);
    return coerced ? [coerced] : [];
  }
  return [];
};

const workAnswerCount = (answers: JobdivaAiAnswer[]): number =>
  answers.reduce((max, item) => {
    const match = item.label.match(/^work\s*experience\s*(\d+)\s*-/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

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

  const pushEducationGroup = (raw: unknown): void => {
    const entries = normalizeEducationEntries(raw);
    entries.forEach((entry, index) => {
      const prefix = `Education ${index + 1}`;
      const seen = new Set<string>();
      for (const [key, value] of Object.entries(entry)) {
        if (value == null) continue;
        if (EDUCATION_ENTRY_META_KEYS.has(key.toLowerCase())) continue;

        let fieldName = key;
        let fieldValue: unknown = value;
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
          fieldName = String(nested.name ?? nested.label ?? key);
          fieldValue = nested.answer ?? nested.value;
        }

        const fieldLabel = JOBDIVA_EDUCATION_FIELD_MAP[educationFieldKey(fieldName)];
        if (!fieldLabel || seen.has(fieldLabel)) continue;
        seen.add(fieldLabel);

        const answer =
          fieldLabel === "Graduation Year"
            ? graduationYearAnswer(fieldValue)
            : coerceAnswerString(fieldValue);
        const labeled = `${prefix} - ${fieldLabel}`;
        if (!answer) {
          markEmpty(labeled);
          continue;
        }
        answers.push({ label: labeled, answer });
      }
    });
  };

  const pushWorkPart = (
    prefix: string,
    fieldLabel: string,
    answer: string,
    seen: Set<string>,
  ): void => {
    if (seen.has(fieldLabel)) return;
    seen.add(fieldLabel);
    const labeled = `${prefix} - ${fieldLabel}`;
    if (!answer) {
      markEmpty(labeled);
      return;
    }
    answers.push({ label: labeled, answer });
  };

  const pushWorkGroup = (raw: unknown): void => {
    const entries = normalizeWorkEntries(raw);
    entries.forEach((entry, index) => {
      const prefix = `Work Experience ${index + 1}`;
      const seen = new Set<string>();
      for (const [key, value] of Object.entries(entry)) {
        if (value == null) continue;
        if (EDUCATION_ENTRY_META_KEYS.has(key.toLowerCase())) continue;

        let fieldName = key;
        let fieldValue: unknown = value;
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
          fieldName = String(nested.name ?? nested.label ?? key);
          fieldValue = nested.answer ?? nested.value;
        }

        const keyNorm = educationFieldKey(fieldName);
        if (keyNorm === "from" || keyNorm === "startdate" || keyNorm === "start") {
          pushWorkPart(prefix, "From Month", monthNameFrom(fieldValue), seen);
          pushWorkPart(prefix, "From Year", yearFrom(fieldValue), seen);
          continue;
        }
        if (keyNorm === "to" || keyNorm === "enddate" || keyNorm === "end") {
          pushWorkPart(prefix, "To Month", monthNameFrom(fieldValue), seen);
          pushWorkPart(prefix, "To Year", yearFrom(fieldValue), seen);
          continue;
        }

        const fieldLabel = JOBDIVA_WORK_FIELD_MAP[keyNorm];
        if (!fieldLabel) continue;
        const answer = fieldLabel.endsWith("Month")
          ? monthNameFrom(fieldValue) || coerceAnswerString(fieldValue)
          : fieldLabel.endsWith("Year")
            ? yearFrom(fieldValue) || coerceAnswerString(fieldValue)
            : coerceAnswerString(fieldValue);
        pushWorkPart(prefix, fieldLabel, answer, seen);
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
      pushEducationGroup(raw ?? item.entries ?? item.items ?? item.data);
      return;
    }
    if (
      typeStr === "employment" ||
      typeStr === "workexperience" ||
      /^work experience$/i.test(label) ||
      /^employment$/i.test(label)
    ) {
      pushWorkGroup(raw ?? item.entries ?? item.jobs ?? item.items ?? item.data);
      return;
    }

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
      if (
        /^education$/i.test(label) &&
        (Array.isArray(value) || (value != null && typeof value === "object"))
      ) {
        pushEducationGroup(value);
        continue;
      }
      if (
        /^(work experience|employment|employment_history)$/i.test(label) &&
        (Array.isArray(value) || (value != null && typeof value === "object"))
      ) {
        pushWorkGroup(value);
        continue;
      }
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
  const normalizedAnswer = normalizeLabel(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (normalizeLabel(option) === normalizedAnswer) return option;
  }

  for (const option of options) {
    const normalizedOption = normalizeLabel(option);
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

const checkboxShouldBeChecked = (
  answer: string,
  label: string,
): boolean | null => {
  const value = cleanLabelText(answer).toLowerCase();
  if (/^(no|false|off|unchecked|disagree|n)$/i.test(value)) return false;
  if (/^(yes|true|on|checked|check|agree|agreed|consent|y)$/i.test(value)) {
    return true;
  }
  const answerKey = normalizeLabel(answer);
  const labelKey = normalizeLabel(label);
  if (answerKey && labelKey && answerKey === labelKey) return true;
  if (
    answerKey.length >= 12 &&
    labelKey.length >= 12 &&
    (answerKey.includes(labelKey) || labelKey.includes(answerKey))
  ) {
    return true;
  }
  if (
    /\b(consent|agree)\b/i.test(value) &&
    !/\b(do not|don't|dont|decline|refuse)\b/i.test(value)
  ) {
    return true;
  }
  return null;
};

const fillRadioGroup = async (
  group: HTMLElement,
  answer: string,
): Promise<boolean> => {
  const rows = Array.from(group.querySelectorAll<HTMLElement>(".radio-button"));
  const labels = rows.map((row) =>
    cleanLabelText(row.querySelector(".radio-buttons-label")?.textContent ?? ""),
  );
  const matched = matchOption(answer, labels.filter((label) => label.length > 0));
  if (!matched) return false;

  const row = rows.find(
    (item) =>
      cleanLabelText(item.querySelector(".radio-buttons-label")?.textContent ?? "") ===
      matched,
  );
  const input = row?.querySelector<HTMLInputElement>("input[type='radio']");
  if (!row || !input) return false;
  if (input.checked) return true;

  row.scrollIntoView({ block: "nearest", inline: "nearest" });
  input.click();
  if (!input.checked) row.click();
  if (input.checked) return true;

  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "checked",
  );
  const tracker = (
    input as HTMLInputElement & {
      _valueTracker?: { setValue: (value: string) => void };
    }
  )._valueTracker;
  tracker?.setValue(String(input.checked));
  descriptor?.set?.call(input, true);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(input);
  return input.checked;
};

const fillCheckbox = (
  input: HTMLInputElement,
  answer: string,
  label: string,
): boolean => {
  const desired = checkboxShouldBeChecked(answer, label);
  if (desired === null) return false;
  if (input.checked === desired) return true;

  const wrap = input.closest("label.jd-checkbox");
  const inner =
    input.id && wrap instanceof HTMLElement
      ? wrap.querySelector<HTMLElement>(`label[for="${CSS.escape(input.id)}"]`)
      : null;
  // Click the text label once. The outer label also wraps the input, so a
  // second click there toggles the box back off.
  (inner ?? input).click();
  if (input.checked === desired) return true;

  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "checked",
  );
  const tracker = (
    input as HTMLInputElement & {
      _valueTracker?: { setValue: (value: string) => void };
    }
  )._valueTracker;
  tracker?.setValue(String(input.checked));
  descriptor?.set?.call(input, desired);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return input.checked === desired;
};

const dropdownSelectionLanded = (
  element: HTMLElement,
  matchedLabel: string,
  target: HTMLElement,
): boolean => {
  const root = getJobdivaDropdownRoot(element);
  const truncate = root.querySelector(".text-truncate");
  if (
    truncate &&
    valuesMatch(cleanLabelText(truncate.textContent ?? ""), matchedLabel)
  ) {
    return true;
  }
  const selected = root.querySelector(".dropdown-item.selected");
  if (
    selected &&
    valuesMatch(cleanLabelText(selected.textContent ?? ""), matchedLabel)
  ) {
    return true;
  }
  if (
    target.classList.contains("selected") &&
    valuesMatch(cleanLabelText(target.textContent ?? ""), matchedLabel)
  ) {
    return true;
  }
  return (
    valuesMatch(getControlDisplayValue(element), matchedLabel) ||
    target.getAttribute("aria-selected") === "true"
  );
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

  const root = getJobdivaDropdownRoot(element);
  let options = readJobdivaMenuOptions(root, false);
  if (options.length === 0) {
    try {
      options = await openJobdivaCombobox(element);
    } catch {
      closeJobdivaFlyout();
      return false;
    }
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

  if (dropdownSelectionLanded(element, matchedLabel, target.element)) {
    return true;
  }

  const trigger =
    element instanceof HTMLButtonElement
      ? element
      : root.querySelector<HTMLElement>("button[data-bs-toggle='dropdown']");
  if (trigger && trigger.getAttribute("aria-expanded") !== "true") {
    trigger.click();
  }
  clickOptionElement(target.element);

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    await handleValueChanges(element);
  }

  const selectionLanded = (): boolean =>
    dropdownSelectionLanded(element, matchedLabel, target.element);

  const ok = await new Promise<boolean>((resolve) => {
    if (selectionLanded()) {
      resolve(true);
      return;
    }
    const watchRoot = root;
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

  if (field.kind === "checkbox" && field.element instanceof HTMLInputElement) {
    return fillCheckbox(field.element, answer, field.label);
  }

  if (field.kind === "radio") {
    return fillRadioGroup(field.element, answer);
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
  const educationNeeded = educationAnswerCount(answers);
  if (educationNeeded > 0) {
    await ensureJobdivaEducationCards(educationNeeded);
  }
  const workNeeded = workAnswerCount(answers);
  if (workNeeded > 0) {
    await ensureJobdivaWorkExperienceCards(workNeeded);
  }
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
