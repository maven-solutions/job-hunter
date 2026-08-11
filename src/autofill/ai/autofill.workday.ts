import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { Applicant } from "../data";
import {
  WorkdayCandidateField,
  collectWorkdayCandidateFields,
  ensureWorkdayEntryPanels,
  getWorkdayWorkSectionTitle,
  isWorkdayPrefillExcludedLabel,
  prepareWorkdayExperiencePanels,
} from "./scan.workday";
import { getWorkdayApplySectionId } from "./workday/detect";

export interface WorkdayAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface WorkdayAiFillResult {
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

export const isUsableWorkdayAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableWorkdayAnswer(v));
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
    return isUsableWorkdayAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableWorkdayAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableWorkdayAnswer(v))
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
  !isUsableWorkdayAnswer(raw);

/** Treat "Employment History N" and "Work Experience N" as the same section. */
const normalizeExperienceSectionKey = (label: string): string =>
  normalizeLabel(label)
    .replace(/employment\s*history/g, "workexperience")
    .replace(/work\s*experience/g, "workexperience")
    .replace(/employmenthistory/g, "workexperience")
    .replace(/[^a-z0-9]+/g, "");

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
  const expKey = normalizeExperienceSectionKey(cleaned);
  if (expKey) set.add(expKey);
};

/**
 * Empty-field skip must be exact for Employment/Education N fields.
 * Soft includes previously let "Employment History 1 - Location" (empty)
 * block "Employment History 2 - Location" (present).
 */
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

  const expKey = normalizeExperienceSectionKey(label);
  if (expKey && emptyLabelKeys.has(expKey)) return true;

  // Numbered WE / Education fields: exact section+field only (no soft includes)
  if (
    /^(?:employmenthistory|workexperience|education)\d/.test(compact) ||
    /^(?:employment history|work experience|education)\s*\d+/i.test(
      cleanLabelText(label),
    )
  ) {
    return false;
  }

  if (n && n.length >= 8) {
    for (const key of emptyLabelKeys) {
      if (key.length < 8) continue;
      if (n === key || n.includes(key) || key.includes(n)) return true;
    }
  }
  return false;
};


/** Normalize object keys for employment/education field alias maps. */
const fieldKey = (text: string): string =>
  cleanLabelText(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const entryLooksLikeWork = (entry: Record<string, unknown>): boolean => {
  const keys = Object.keys(entry).map((k) => fieldKey(k));
  return keys.some((k) =>
    /^(jobtitle|title|position|company|companyname|employer|roledescription|currentlyworkhere|icurrentlyworkhere)$/.test(
      k,
    ),
  );
};

const entryLooksLikeEducation = (entry: Record<string, unknown>): boolean => {
  const keys = Object.keys(entry).map((k) => fieldKey(k));
  return keys.some((k) =>
    /^(school|schooloruniversity|schoolname|university|college|degree|fieldofstudy|major|overallresultgpa|gpa|gradeaverage)$/.test(
      k,
    ),
  );
};

/**
 * API sometimes nests employment-shaped rows under "Education" (or vice versa).
 * Prefer actual field shape over the group label.
 */
const resolveGroupKind = (
  declared: "work" | "education",
  entries: Record<string, unknown>[],
): "work" | "education" => {
  const workScore = entries.filter(entryLooksLikeWork).length;
  const eduScore = entries.filter(entryLooksLikeEducation).length;
  if (declared === "education" && workScore > 0 && eduScore === 0) {
    return "work";
  }
  if (declared === "work" && eduScore > 0 && workScore === 0) {
    return "education";
  }
  return declared;
};

/** "Company Name, Chicago, IL" → "Chicago" when Location is blank. */
const extractLocationFromCompany = (company: string): string => {
  const cleaned = cleanLabelText(company);
  if (!cleaned) return "";
  // "... , City, ST" or "... , City, ST 12345"
  const withState = cleaned.match(
    /,\s*([^,]+),\s*([A-Za-z]{2})(?:\s+\d{5}(?:-\d{4})?)?\s*$/,
  );
  if (withState) {
    const city = cleanLabelText(withState[1]);
    if (city && !/inc|llc|ltd|corp|company/i.test(city)) return city;
  }
  return "";
};

const ensureWorkLocationField = (
  fields: { fieldLabel: string; value: unknown }[],
): { fieldLabel: string; value: unknown }[] => {
  const locationIdx = fields.findIndex((f) => f.fieldLabel === "Location");
  const location = locationIdx >= 0 ? fields[locationIdx] : null;
  if (location && isUsableWorkdayAnswer(location.value)) return fields;

  const company = fields.find((f) => f.fieldLabel === "Company");
  if (!company || !isUsableWorkdayAnswer(company.value)) return fields;

  const extracted = extractLocationFromCompany(
    coerceAnswerString(company.value),
  );
  if (!extracted) return fields;

  if (locationIdx >= 0) {
    const next = [...fields];
    next[locationIdx] = { fieldLabel: "Location", value: extracted };
    return next;
  }
  return [...fields, { fieldLabel: "Location", value: extracted }];
};

/** Coerce one employment/education entry into a plain field map. */
const coerceGroupEntryRecord = (
  item: unknown,
): Record<string, unknown> | null => {
  if (item == null) return null;

  // API format: [{ name: "Job Title", value: "..." }, ...]
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
    // Single { name, value } field object — not a full entry
    if (
      ("name" in obj || "label" in obj) &&
      ("value" in obj || "answer" in obj) &&
      !("jobTitle" in obj) &&
      !("company" in obj) &&
      !("school" in obj)
    ) {
      const fieldName = String(obj.name ?? obj.label ?? "").trim();
      if (!fieldName) return null;
      return { [fieldName]: obj.value ?? obj.answer };
    }
    return obj;
  }

  return null;
};

/** Coerce employment/education payload into a list of entry objects. */
const normalizeGroupEntries = (raw: unknown): Record<string, unknown>[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    // Nested list of field arrays: [[{name,value},...], ...]
    if (raw.length > 0 && Array.isArray(raw[0])) {
      return raw
        .map((item) => coerceGroupEntryRecord(item))
        .filter(Boolean) as Record<string, unknown>[];
    }
    // Flat list of entry objects OR flat list of {name,value} fields for one entry
    if (
      raw.length > 0 &&
      typeof raw[0] === "object" &&
      raw[0] != null &&
      ("name" in (raw[0] as object) || "label" in (raw[0] as object)) &&
      ("value" in (raw[0] as object) || "answer" in (raw[0] as object)) &&
      !Array.isArray((raw[0] as any).value) &&
      typeof (raw[0] as any).value !== "object"
    ) {
      // Could be one entry as field list, or multiple entries as objects with name/value
      // Heuristic: if names look like field labels (Job Title, Company), treat as one entry
      const firstName = String(
        (raw[0] as any).name ?? (raw[0] as any).label ?? "",
      );
      if (/job title|company|school|degree|from|to|location/i.test(firstName)) {
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
    for (const key of ["jobs", "entries", "items", "data", "records"]) {
      if (Array.isArray(obj[key])) {
        return normalizeGroupEntries(obj[key]);
      }
    }
    if (
      "label" in obj &&
      ("type" in obj || "options" in obj) &&
      !("jobTitle" in obj) &&
      !("company" in obj) &&
      !("school" in obj)
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

const EMPLOYMENT_FIELD_MAP: Record<string, string> = {
  jobtitle: "Job Title",
  title: "Job Title",
  position: "Job Title",
  company: "Company",
  companyname: "Company",
  employer: "Company",
  location: "Location",
  currentlyworkhere: "I currently work here",
  icurrentlyworkhere: "I currently work here",
  current: "I currently work here",
  iscurrent: "I currently work here",
  from: "From (MM/YYYY)",
  startdate: "From (MM/YYYY)",
  start: "From (MM/YYYY)",
  to: "To (MM/YYYY)",
  enddate: "To (MM/YYYY)",
  end: "To (MM/YYYY)",
  roledescription: "Role Description",
  description: "Role Description",
  responsibilities: "Role Description",
};

const EDUCATION_FIELD_MAP: Record<string, string> = {
  school: "School or University",
  schooloruniversity: "School or University",
  schoolname: "School or University",
  university: "School or University",
  college: "School or University",
  degree: "Degree",
  fieldofstudy: "Field of Study",
  major: "Field of Study",
  field: "Field of Study",
  overallresultgpa: "Overall Result (GPA)",
  overallresult: "Overall Result (GPA)",
  gpa: "Overall Result (GPA)",
  gradeaverage: "Overall Result (GPA)",
  grade: "Overall Result (GPA)",
  from: "From (YYYY)",
  fromyyyy: "From (YYYY)",
  firstyearattended: "From (YYYY)",
  startyear: "From (YYYY)",
  startdate: "From (YYYY)",
  to: "To (Actual or Expected) (YYYY)",
  toyyyy: "To (Actual or Expected) (YYYY)",
  toactualorexpected: "To (Actual or Expected) (YYYY)",
  toactualorexpectedyyyy: "To (Actual or Expected) (YYYY)",
  lastyearattended: "To (Actual or Expected) (YYYY)",
  endyear: "To (Actual or Expected) (YYYY)",
  enddate: "To (Actual or Expected) (YYYY)",
};

const GROUP_META_KEYS = new Set([
  "label",
  "type",
  "required",
  "options",
  "count",
  "description",
]);

const flattenGroupEntry = (
  entry: Record<string, unknown>,
  kind: "work" | "education",
): { fieldLabel: string; value: unknown }[] => {
  const map = kind === "work" ? EMPLOYMENT_FIELD_MAP : EDUCATION_FIELD_MAP;
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
      const nestedName = nested.name ?? nested.label ?? key;
      const fieldLabel =
        map[fieldKey(String(nestedName))] ||
        cleanLabelText(String(nestedName));
      const val = nested.answer ?? nested.value;
      if (seen.has(fieldLabel)) continue;
      seen.add(fieldLabel);
      out.push({ fieldLabel, value: val });
      continue;
    }

    const nKey = fieldKey(key);
    let fieldLabel = map[nKey];
    if (!fieldLabel) {
      fieldLabel = cleanLabelText(key);
      if (kind === "work") {
        if (/^from$/i.test(fieldLabel)) fieldLabel = "From (MM/YYYY)";
        if (/^to$/i.test(fieldLabel)) fieldLabel = "To (MM/YYYY)";
      }
      if (kind === "education") {
        if (/^from$/i.test(fieldLabel)) fieldLabel = "From (YYYY)";
        if (/^to$/i.test(fieldLabel) || /^to \(actual/i.test(fieldLabel)) {
          fieldLabel = "To (Actual or Expected) (YYYY)";
        }
        if (/^school/i.test(fieldLabel)) {
          fieldLabel = "School or University";
        }
        if (/gpa|overall result/i.test(fieldLabel)) {
          fieldLabel = "Overall Result (GPA)";
        }
      }
    }
    if (kind === "work" && (fieldLabel === "From" || fieldLabel === "To")) {
      fieldLabel = `${fieldLabel} (MM/YYYY)`;
    }
    if (kind === "education") {
      if (fieldLabel === "From") fieldLabel = "From (YYYY)";
      if (fieldLabel === "To" || fieldLabel === "To (Actual or Expected)") {
        fieldLabel = "To (Actual or Expected) (YYYY)";
      }
    }

    if (seen.has(fieldLabel)) continue;
    seen.add(fieldLabel);
    out.push({ fieldLabel, value });
  }

  return out;
};

export interface WorkdayParsedFillResponse {
  answers: WorkdayAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseWorkdayAiFillResponse = (
  response: unknown,
): WorkdayParsedFillResponse => {
  const answers: WorkdayAiAnswer[] = [];
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

  const clearEmpty = (label: string): void => {
    const cleaned = cleanLabelText(label);
    if (!cleaned) return;
    const n = normalizeLabel(cleaned);
    if (n) emptyLabelKeys.delete(n);
    const compact = cleaned
      .toLowerCase()
      .replace(/['’`]/g, "")
      .replace(/[^a-z0-9]+/g, "");
    if (compact) emptyLabelKeys.delete(compact);
    const expKey = normalizeExperienceSectionKey(cleaned);
    if (expKey) emptyLabelKeys.delete(expKey);
  };

  const pushAnswer = (item: WorkdayAiAnswer): void => {
    clearEmpty(item.label);
    answers.push(item);
  };

  const workSectionTitle = getWorkdayWorkSectionTitle();

  const pushRepeatableGroup = (
    kind: "work" | "education",
    raw: unknown,
  ): void => {
    const entries = normalizeGroupEntries(raw);
    if (entries.length === 0) {
      markEmpty(kind === "work" ? "Employment" : "Education");
      return;
    }

    const resolvedKind = resolveGroupKind(kind, entries);

    entries.forEach((entry, index) => {
      const prefix =
        resolvedKind === "work"
          ? `${workSectionTitle} ${index + 1}`
          : `Education ${index + 1}`;
      let fields = flattenGroupEntry(entry, resolvedKind);
      if (resolvedKind === "work") {
        fields = ensureWorkLocationField(fields);
      }
      for (const { fieldLabel, value } of fields) {
        if (!isUsableWorkdayAnswer(value)) {
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

    if (
      typeStr === "employment" ||
      /^employment$/i.test(label) ||
      /^work experience$/i.test(label) ||
      /^employment history$/i.test(label)
    ) {
      pushRepeatableGroup(
        "work",
        raw ?? item.entries ?? item.jobs ?? item.data ?? item.items,
      );
      return;
    }
    if (typeStr === "education" || /^education$/i.test(label)) {
      pushRepeatableGroup(
        "education",
        raw ?? item.entries ?? item.data ?? item.items,
      );
      return;
    }

    if (isEmptyApiAnswer(raw)) {
      markEmpty(label);
      return;
    }

    if (
      Array.isArray(raw) &&
      raw.every((v) => typeof v !== "object" || v == null)
    ) {
      const answer = coerceAnswerString(raw);
      if (!answer) {
        markEmpty(label);
        return;
      }
      pushAnswer({
        label,
        answer,
        type: item.type ? String(item.type) : undefined,
      });
      return;
    }

    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object") {
      const sample = raw[0] as Record<string, unknown>;
      // Nested groups: [[{name,value},...], ...]
      if (Array.isArray(raw[0])) {
        const firstField = (raw[0] as unknown[])[0] as
          | Record<string, unknown>
          | undefined;
        const fieldName = String(
          firstField?.name ?? firstField?.label ?? "",
        ).toLowerCase();
        // Prefer education markers before work — "university" must not hit weak "to"
        if (
          /\b(school|university|degree|field of study|major)\b/i.test(fieldName)
        ) {
          pushRepeatableGroup("education", raw);
          return;
        }
        if (
          /\b(job title|company|employer|role description)\b/i.test(fieldName)
        ) {
          pushRepeatableGroup("work", raw);
          return;
        }
      }
      const keys = Object.keys(sample).map((k) => k.toLowerCase());
      const sampleName = String(
        sample.name ?? sample.label ?? "",
      ).toLowerCase();
      if (
        keys.some((k) =>
          /job|title|company|employer|school|degree|university|name|value/.test(
            k,
          ),
        ) ||
        /job|title|company|school|degree/.test(sampleName)
      ) {
        if (
          keys.some((k) =>
            /school|degree|university|education|major/.test(k),
          ) ||
          /school|degree|university|education|major|field/.test(sampleName)
        ) {
          pushRepeatableGroup("education", raw);
        } else {
          pushRepeatableGroup("work", raw);
        }
        return;
      }
    }

    const answer = coerceAnswerString(raw);
    if (!answer) {
      markEmpty(label);
      return;
    }

    pushAnswer({
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

  if (
    Array.isArray(payload?.employment) ||
    Array.isArray(payload?.employment_history)
  ) {
    pushRepeatableGroup(
      "work",
      payload.employment ?? payload.employment_history,
    );
  }
  if (Array.isArray(payload?.education)) {
    pushRepeatableGroup("education", payload.education);
  }

  if (typeof payload === "object") {
    const reserved = new Set([
      "elements",
      "answers",
      "fields",
      "fill_data_list",
      "employment",
      "employment_history",
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
      processItem({ label, answer: value });
    }
  }

  return { answers, emptyLabelKeys, emptyCount };
};

export const normalizeWorkdayAiAnswers = (
  response: unknown,
): WorkdayAiAnswer[] => parseWorkdayAiFillResponse(response).answers;

/** Keep digits (phone codes like +91 need them). */
const normalizeForMatch = (text: string): string =>
  cleanLabelText(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9+]+/g, "");

const YES_ANSWERS = new Set(["yes", "y", "true", "1"]);
const NO_ANSWERS = new Set(["no", "n", "false", "0"]);

/**
 * Applicant values we treat as the United States.
 * Soft-include matching otherwise picks "United States Minor Outlying Islands".
 */
const USA_ANSWER_ALIASES = new Set([
  "unitedstates",
  "unitedstatesofamerica",
  "usa",
  "us",
  "america",
  "theus",
  "theunitedstates",
  "theunitedstatesofamerica",
]);

/**
 * Preferred Workday option labels for the US (first available wins).
 */
const USA_OPTION_PRIORITY = [
  "unitedstatesofamerica",
  "unitedstates",
  "usa",
  "america",
  "us",
] as const;

const isUsaAlias = (normalized: string): boolean =>
  USA_ANSWER_ALIASES.has(normalized);

/**
 * Exact USA name options only — never territories
 * (e.g. United States Minor Outlying Islands).
 */
const matchUsaCountryOption = (options: string[]): string | null => {
  const byNorm = new Map<string, string>();
  for (const option of options) {
    const n = normalizeForMatch(option);
    if (!n || !isUsaAlias(n)) continue;
    if (!byNorm.has(n)) byNorm.set(n, option);
  }

  for (const preferred of USA_OPTION_PRIORITY) {
    const hit = byNorm.get(preferred);
    if (hit) return hit;
  }

  const first = byNorm.values().next();
  return first.done ? null : first.value;
};

const matchOption = (answer: string, options: string[]): string | null => {
  if (!answer?.trim() || options.length === 0) return null;

  const cleanAnswer = cleanLabelText(answer);
  const normalizedAnswer = normalizeForMatch(answer);
  if (!normalizedAnswer) return null;

  // 1. Exact label
  for (const option of options) {
    if (cleanLabelText(option) === cleanAnswer) return option;
  }

  // 2. Exact normalized
  for (const option of options) {
    if (normalizeForMatch(option) === normalizedAnswer) return option;
  }

  // 3. USA aliases before soft-includes (United States → United States of America)
  if (isUsaAlias(normalizedAnswer)) {
    const usa = matchUsaCountryOption(options);
    if (usa) return usa;
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

  // Dial-code match: "+91" ⊂ "India (+91)" — exact dial digits, not substring
  const dialMatch = cleanAnswer.match(/\+?\d{1,4}/);
  if (dialMatch) {
    const digit = dialMatch[0].replace(/\D/g, "");
    if (digit.length >= 1) {
      const hit = options.find((o) => {
        const d = (o.match(/\+\d{1,4}/) ?? o.match(/\d{1,4}/))?.[0]?.replace(
          /\D/g,
          "",
        );
        return d === digit;
      });
      if (hit) return hit;
    }
  }

  // Soft includes — prefer closer (shorter) option labels
  if (normalizedAnswer.length >= 3) {
    let best: { option: string; score: number } | null = null;
    for (const option of options) {
      const n = normalizeForMatch(option);
      if (!n) continue;

      // Block US territories when the answer was a plain USA name
      if (
        isUsaAlias(normalizedAnswer) &&
        n.includes("unitedstates") &&
        !isUsaAlias(n)
      ) {
        continue;
      }

      let score = 0;
      if (n === normalizedAnswer) {
        score = 1000;
      } else if (n.includes(normalizedAnswer)) {
        const lengthPenalty = Math.max(0, n.length - normalizedAnswer.length);
        score = 500 + normalizedAnswer.length * 2 - lengthPenalty;
      } else if (normalizedAnswer.includes(n) && n.length >= 4) {
        const lengthPenalty = Math.max(0, normalizedAnswer.length - n.length);
        score = 300 + n.length * 2 - lengthPenalty;
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { option, score };
      }
    }
    if (best) return best.option;
  }

  return null;
};

/** Strip date-format suffixes so "From (YYYY)" matches "From" / "From (MM/YYYY)". */
const stripDateFormatSuffix = (label: string): string =>
  cleanLabelText(label)
    .replace(/\s*\((?:MM\/YYYY|YYYY|MM\/DD\/YYYY)\)\s*$/i, "")
    .trim();

const findAnswerForLabel = (
  label: string,
  answers: WorkdayAiAnswer[],
): WorkdayAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  // Employment History N ↔ Work Experience N
  const expKey = normalizeExperienceSectionKey(label);
  if (expKey) {
    const byExp = answers.find(
      (item) => normalizeExperienceSectionKey(item.label) === expKey,
    );
    if (byExp) return byExp;
  }

  // Bare field name after section prefix: "Education 1 - School or University"
  const bareLabel = label.includes(" - ")
    ? label.slice(label.lastIndexOf(" - ") + 3).trim()
    : label;
  if (bareLabel !== label) {
    const bareNorm = normalizeLabel(bareLabel);
    const bareNoDate = normalizeLabel(stripDateFormatSuffix(bareLabel));
    const sectionMatch = label.match(
      /^((?:employment history|work experience|education)\s*\d+)\s*-/i,
    );
    const sectionPrefix = sectionMatch?.[1] ?? "";

    // Prefer same-section bare match when multiple WE/Edu entries share field names
    if (sectionPrefix) {
      const sectionKey = normalizeExperienceSectionKey(sectionPrefix);
      const bySectionBare = answers.find((item) => {
        const itemBare = item.label.includes(" - ")
          ? item.label.slice(item.label.lastIndexOf(" - ") + 3).trim()
          : item.label;
        const itemSection = item.label.includes(" - ")
          ? item.label.slice(0, item.label.lastIndexOf(" - ")).trim()
          : "";
        const itemBareNorm = normalizeLabel(itemBare);
        const itemBareNoDate = normalizeLabel(stripDateFormatSuffix(itemBare));
        return (
          (itemBareNorm === bareNorm ||
            itemBareNoDate === bareNoDate ||
            itemBareNorm === bareNoDate ||
            itemBareNoDate === bareNorm) &&
          (normalizeExperienceSectionKey(itemSection) === sectionKey ||
            normalizeLabel(itemSection) === normalizeLabel(sectionPrefix))
        );
      });
      if (bySectionBare) return bySectionBare;
    }

    const byBare = answers.find((item) => {
      const itemBare = item.label.includes(" - ")
        ? item.label.slice(item.label.lastIndexOf(" - ") + 3).trim()
        : item.label;
      const itemBareNorm = normalizeLabel(itemBare);
      const itemBareNoDate = normalizeLabel(stripDateFormatSuffix(itemBare));
      return (
        normalizeLabel(item.label) === bareNorm ||
        itemBareNorm === bareNorm ||
        itemBareNoDate === bareNoDate ||
        itemBareNorm === bareNoDate ||
        itemBareNorm === normalized
      );
    });
    if (byBare) return byBare;
  }

  // Phone label aliases
  if (/country phone code|phone country code/i.test(label)) {
    const phone = answers.find((item) =>
      /country phone code|phone country code|phone code/i.test(item.label),
    );
    if (phone) return phone;
  }

  // Skills field aliases: "Skills" ↔ "Type to Add Skills"
  if (/skill/i.test(label)) {
    const skills = answers.find((item) => /skill/i.test(item.label));
    if (skills) return skills;
  }

  if (normalized.length >= 12) {
    // Avoid soft-matching across different Employment/Education entry indices
    const sectionMatch = label.match(
      /^((?:employment history|work experience|education)\s*\d+)\s*-/i,
    );
    const soft = answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 8) return false;
      if (sectionMatch) {
        const itemSection = item.label.match(
          /^((?:employment history|work experience|education)\s*\d+)\s*-/i,
        )?.[1];
        if (
          itemSection &&
          normalizeExperienceSectionKey(itemSection) !==
            normalizeExperienceSectionKey(sectionMatch[1])
        ) {
          return false;
        }
      }
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

const closeListbox = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const fullClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const rect = element.getBoundingClientRect();
  const clientX = rect.left + Math.max(rect.width / 2, 1);
  const clientY = rect.top + Math.max(Math.min(rect.height / 2, 14), 1);
  const opts: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
    button: 0,
    buttons: 1,
  };
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      ...opts,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(
    new PointerEvent("pointerup", {
      ...opts,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  element.dispatchEvent(new MouseEvent("mouseup", opts));
  element.dispatchEvent(new MouseEvent("click", opts));
  try {
    element.click();
  } catch {
    /* ignore */
  }
};

/**
 * One click only — Workday skill checkboxes toggle; fullClick's synthetic+native
 * double-fire selects then immediately deselects.
 */
const singleClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const rect = element.getBoundingClientRect();
  const clientX = rect.left + Math.max(rect.width / 2, 1);
  const clientY = rect.top + Math.max(Math.min(rect.height / 2, 14), 1);
  const opts: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
    button: 0,
    buttons: 1,
  };
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      ...opts,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(
    new PointerEvent("pointerup", {
      ...opts,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  element.dispatchEvent(new MouseEvent("mouseup", opts));
  element.dispatchEvent(new MouseEvent("click", opts));
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

const isNodeVisible = (node: HTMLElement): boolean => {
  if (!node.isConnected) return false;
  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const getOpenOptionElements = (): HTMLElement[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="listbox"] [role="option"], [role="option"], [data-automation-id="promptOption"]',
    ),
  ).filter((opt) => {
    if (!isNodeVisible(opt)) return false;
    if (opt.closest('[data-automation-id="selectedItemList"]')) return false;
    return true;
  });

/** Prefer Workday prompt options (school/FOS search results) with clean labels. */
const getPromptOptionElements = (): HTMLElement[] => {
  const prompts = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-automation-id="promptOption"]',
    ),
  ).filter((opt) => {
    if (!opt.isConnected) return false;
    if (opt.closest('[data-automation-id="selectedItemList"]')) return false;
    // Prompt popup options can report 0x0 briefly while virtualized — keep if labeled
    const label =
      opt.getAttribute("data-automation-label") ?? opt.textContent ?? "";
    return cleanLabelText(label).length > 0;
  });
  if (prompts.length > 0) return prompts;

  return getOpenOptionElements();
};

const optionLabel = (opt: HTMLElement): string => {
  const raw = cleanLabelText(
    opt.getAttribute("data-automation-label") ??
      opt.getAttribute("aria-label") ??
      opt.textContent ??
      "",
  );
  return raw
    .replace(/,?\s*press delete.*$/i, "")
    .replace(/,?\s*press enter.*$/i, "")
    .replace(/\s+not checked$/i, "")
    .replace(/\s+checked$/i, "")
    .trim();
};

const clickPromptOption = (opt: HTMLElement): void => {
  const prompt =
    opt.getAttribute("data-automation-id") === "promptOption"
      ? opt
      : opt.querySelector<HTMLElement>('[data-automation-id="promptOption"]');
  fullClick(prompt ?? opt);
};

/** True when a skills list option is checked (Workday multiSelectPrompt). */
const isSkillOptionChecked = (row: HTMLElement): boolean => {
  const leaf =
    row.querySelector<HTMLElement>('[data-automation-id="promptLeafNode"]') ??
    (row.getAttribute("data-automation-id") === "promptLeafNode" ? row : null);

  if (leaf?.getAttribute("data-automation-checked") === "Checked") return true;
  if (leaf?.getAttribute("data-uxi-multiselectlistitem-isselected") === "true") {
    return true;
  }
  if (row.getAttribute("aria-selected") === "true") return true;
  if (row.getAttribute("data-automation-selected") === "true") return true;
  if (/\bchecked$/i.test(row.getAttribute("aria-label") ?? "")) return true;

  const wrap = row.querySelector<HTMLElement>(
    '[data-automation-id="checkbox"]',
  );
  if (wrap?.getAttribute("data-automationcheckboxchecked") === "true") {
    return true;
  }

  const checkbox = row.querySelector<HTMLInputElement>(
    'input[type="checkbox"][data-automation-id="checkboxPanel"], input[type="checkbox"]',
  );
  if (
    checkbox &&
    (checkbox.checked || checkbox.getAttribute("aria-checked") === "true")
  ) {
    return true;
  }
  return false;
};

/** Poll until skill option is checked (avoids double-click toggle). */
const waitUntilSkillChecked = async (
  row: HTMLElement,
  timeoutMs = 700,
): Promise<boolean> => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (isSkillOptionChecked(row)) return true;
    await delay(80);
  }
  return isSkillOptionChecked(row);
};

/**
 * Select one skills multi-select option.
 * Workday uses promptLeafNode + custom checkbox — click ONCE (extra clicks toggle off).
 */
const selectSkillMultiselectOption = async (
  opt: HTMLElement,
): Promise<boolean> => {
  const row =
    (opt.closest(
      '[role="option"][data-automation-id="menuItem"], [data-automation-id="menuItem"], [role="option"]',
    ) as HTMLElement | null) ?? opt;

  row.scrollIntoView({ block: "nearest", inline: "nearest" });
  await delay(100);

  if (isSkillOptionChecked(row)) return true;

  const leaf =
    row.querySelector<HTMLElement>('[data-automation-id="promptLeafNode"]') ??
    row;
  const checkboxWrap = row.querySelector<HTMLElement>(
    '[data-automation-id="checkbox"]',
  );
  const checkbox = row.querySelector<HTMLInputElement>(
    'input[type="checkbox"][data-automation-id="checkboxPanel"], input[type="checkbox"]',
  );
  const prompt = row.querySelector<HTMLElement>(
    '[data-automation-id="promptOption"]',
  );

  // Prefer the visible checkbox chrome, then leaf, then label — one click each,
  // waiting between so we never toggle a successful selection off.
  const clickTargets: HTMLElement[] = [];
  if (checkboxWrap) clickTargets.push(checkboxWrap);
  if (leaf && leaf !== checkboxWrap) clickTargets.push(leaf);
  if (prompt && !clickTargets.includes(prompt)) clickTargets.push(prompt);
  if (!clickTargets.includes(row)) clickTargets.push(row);

  for (const target of clickTargets) {
    if (isSkillOptionChecked(row)) return true;
    singleClick(target);
    if (await waitUntilSkillChecked(row, 700)) return true;
  }

  // Native checkbox property (hidden input often ignores pointer clicks)
  if (checkbox && !isSkillOptionChecked(row)) {
    setNativeChecked(checkbox, true);
    checkbox.dispatchEvent(new Event("input", { bubbles: true }));
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    if (await waitUntilSkillChecked(row, 500)) return true;
  }

  // Keyboard: Space toggles multi-select options
  if (!isSkillOptionChecked(row)) {
    row.focus?.();
    leaf.focus?.();
    leaf.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        keyCode: 32,
        which: 32,
        bubbles: true,
      }),
    );
    leaf.dispatchEvent(
      new KeyboardEvent("keyup", {
        key: " ",
        code: "Space",
        keyCode: 32,
        which: 32,
        bubbles: true,
      }),
    );
    if (await waitUntilSkillChecked(row, 500)) return true;
  }

  return isSkillOptionChecked(row);
};

/** Wait until a new skill pill appears or the list option stays checked. */
const waitForSkillPillAdded = async (
  container: HTMLElement,
  prevCount: number,
  matchedLabel: string,
  skillQuery: string,
  optionRow?: HTMLElement | null,
  timeoutMs = 1800,
): Promise<boolean> => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (optionRow && isSkillOptionChecked(optionRow)) {
      // List shows checked — pill usually follows shortly
      const selectedNow = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[data-automation-id="selectedItem"]',
        ),
      ).map(optionLabel);
      if (
        selectedNow.length > prevCount ||
        selectedNow.some(
          (s) =>
            matchOption(matchedLabel, [s]) != null ||
            matchSkillOption(skillQuery, [s]) != null,
        )
      ) {
        return true;
      }
      // Checked in list is enough success for multi-select
      if (Date.now() - started > 600) return true;
    }

    const selectedNow = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-automation-id="selectedItem"]',
      ),
    ).map(optionLabel);

    if (selectedNow.length > prevCount) return true;
    if (
      selectedNow.some(
        (s) =>
          matchOption(matchedLabel, [s]) != null ||
          matchSkillOption(skillQuery, [s]) != null ||
          matchOption(skillQuery, [s]) != null,
      )
    ) {
      return true;
    }
    await delay(150);
    await waitForDomUpdate();
  }
  return false;
};

const waitForPromptOptions = async (
  timeoutMs = 2500,
): Promise<HTMLElement[]> => {
  const started = Date.now();
  let options = getPromptOptionElements();
  while (options.length === 0 && Date.now() - started < timeoutMs) {
    await delay(200);
    await waitForDomUpdate();
    options = getPromptOptionElements();
  }
  return options;
};


const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  return isUsableWorkdayAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;
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

const fillWorkdayListbox = async (
  element: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(100);
  }

  fullClick(element);
  await delay(250);
  await waitForDomUpdate();

  // Workday country lists are long — type into any open search/filter input.
  // Prefer "United States of America" when filtering so "United States" doesn't
  // surface "United States Minor Outlying Islands" first.
  const filterQuery = isUsaAlias(normalizeForMatch(answer))
    ? "United States of America"
    : answer;
  const filterInput = document.querySelector<HTMLInputElement>(
    '[role="listbox"] input, input[placeholder*="Search" i]:not([data-uxi-multiselect-id]), [data-automation-id*="search"] input',
  );
  if (filterInput && isNodeVisible(filterInput)) {
    filterInput.focus();
    setNativeValue(filterInput, filterQuery);
    filterInput.dispatchEvent(new Event("input", { bubbles: true }));
    await handleValueChanges(filterInput);
    await delay(350);
    await waitForDomUpdate();
  }

  let optionEls = getOpenOptionElements();
  if (optionEls.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    optionEls = getOpenOptionElements();
  }

  if (optionEls.length === 0) {
    closeListbox();
    return false;
  }

  const labels = optionEls.map(optionLabel);
  const matchedLabel = matchOption(answer, labels);
  if (!matchedLabel) {
    closeListbox();
    return false;
  }

  const target = optionEls.find((opt) => optionLabel(opt) === matchedLabel);
  if (!target) {
    closeListbox();
    return false;
  }

  fullClick(target);
  await delay(200);
  return true;
};

/**
 * Before scanning a Workday page: set Country from applicant profile, then wait
 * for the form layout to re-render (State options, local name fields, phone code).
 * Country Phone Code is auto-filled by Workday after Country changes — not set here.
 */
export const prepareWorkdayCountryBeforeScan = async (
  applicantData: { country?: string | null } | null | undefined,
): Promise<void> => {
  const country = String(applicantData?.country ?? "").trim();
  if (!country) {
    console.warn(
      "[CareerAI Workday] No applicant country — skipping country pre-fill",
    );
    return;
  }

  const countryButton =
    document.querySelector<HTMLElement>(
      'button[aria-haspopup="listbox"][name="country"], button#country--country, [data-automation-id="formField-country"] button[aria-haspopup="listbox"]',
    ) ??
    Array.from(
      document.querySelectorAll<HTMLElement>(
        'button[aria-haspopup="listbox"]',
      ),
    ).find((btn) => {
      const label = cleanLabelText(
        btn
          .closest('[data-automation-id^="formField-"]')
          ?.querySelector("label")?.textContent ??
          btn.getAttribute("aria-label") ??
          "",
      );
      return /^country$/i.test(label) || /^country\b/i.test(label);
    });

  if (!countryButton) {
    // Not on My Information (or country control missing) — nothing to prep
    return;
  }

  const currentText = cleanLabelText(
    countryButton.textContent ?? countryButton.getAttribute("aria-label") ?? "",
  ).replace(/\s+Required$/i, "");

  // Already matches applicant country — no layout change expected
  if (matchOption(country, [currentText]) || matchOption(currentText, [country])) {
    return;
  }

  const filled = await fillWorkdayListbox(countryButton, country);
  if (!filled) {
    console.warn(
      "[CareerAI Workday] Could not set Country to:",
      country,
      "(current:",
      currentText,
      ")",
    );
    return;
  }

  // Workday rewrites fields/options after country change
  await delay(3000);
};

/**
 * Full Workday pre-scan prep (section-aware — only active step is touched):
 * - My Information: fill Country + wait for layout
 * - My Experience: expand Work Experience / Education panels from profile counts
 * - Application Questions: no pre-fill
 */
export const prepareWorkdayBeforeScan = async (
  applicantData: Applicant | null | undefined,
): Promise<void> => {
  const section = getWorkdayApplySectionId();

  if (section === "applicationQuestions") {
    return;
  }

  if (section === "myExperience") {
    await prepareWorkdayExperiencePanels(applicantData ?? null);
    return;
  }

  // My Information and other personal pages
  await prepareWorkdayCountryBeforeScan(applicantData);
  if (section === "myInformation") return;

  // Fallback (unknown step): try experience expand if present
  await prepareWorkdayExperiencePanels(applicantData ?? null);
};

/**
 * Workday Country Phone Code / School / Field of Study / Skills multiselects.
 * School/FOS: single-select search → wait → pick matching option.
 * Skills: multi-select — search each skill, wait, pick similar match, then next.
 */
const fillWorkdayMultiselect = async (
  container: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  const formField = container.closest(
    '[data-automation-id^="formField-"]',
  ) as HTMLElement | null;
  const formFieldId =
    formField?.getAttribute("data-automation-id")?.toLowerCase() ?? "";
  const labelText = formField?.querySelector("label")?.textContent ?? "";
  const inputId =
    container
      .querySelector<HTMLElement>(
        'input[data-uxi-widget-type="selectinput"], input[id]',
      )
      ?.getAttribute("id")
      ?.toLowerCase() ?? "";

  const isSchool =
    /formfield-school(?!name)|formfield-schoolname/.test(formFieldId) ||
    (/school|university/i.test(labelText) &&
      !/field of study/i.test(labelText));
  const isFieldOfStudy =
    /formfield-fieldofstudy/.test(formFieldId) ||
    /field of study/i.test(labelText);
  const isSkills =
    /formfield-skill|skills--skills|^skills$/i.test(formFieldId) ||
    /skill/i.test(inputId) ||
    /^(type to add )?skills?$/i.test(cleanLabelText(labelText)) ||
    /type to add skills/i.test(labelText);
  const isSearchPrompt = isSchool || isFieldOfStudy || isSkills;
  // School / Field of Study are single-select; Skills stay multi
  const isSingleValue = isSchool || isFieldOfStudy;

  const parts = parseAnswerList(answer);
  let values =
    isSingleValue || parts.length <= 1 ? [answer.trim()] : parts;
  // Cap skills so autofill doesn't run forever on huge lists
  if (isSkills && values.length > 20) {
    values = values.slice(0, 20);
  }
  let filledAny = false;

  for (let i = 0; i < values.length; i++) {
    const part = values[i];
    if (!part) continue;

    const selectedLabels = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-automation-id="selectedItem"]',
      ),
    )
      .map(optionLabel)
      .filter(Boolean);

    if (
      selectedLabels.some((s) =>
        isSkills
          ? matchSkillOption(part, [s]) != null || matchOption(part, [s]) != null
          : matchOption(part, [s]) ||
            matchSchoolOrOption(part, [s]) ||
            matchFieldOfStudyOption(part, [s]),
      )
    ) {
      filledAny = true;
      continue;
    }

    // Clear existing selection only for single-value school/FOS (never for skills)
    if (
      i === 0 &&
      isSingleValue &&
      selectedLabels.length > 0
    ) {
      const deleteBtn = container.querySelector<HTMLElement>(
        '[data-automation-id="DELETE_charm"]',
      );
      if (deleteBtn) {
        fullClick(deleteBtn);
        await delay(200);
      }
    }

    const input =
      container.querySelector<HTMLInputElement>(
        'input[data-uxi-widget-type="selectinput"], input[id]',
      ) ?? null;
    const promptIcon = container.querySelector<HTMLElement>(
      '[data-automation-id="promptIcon"]',
    );

    if (input) {
      fullClick(input);
    } else if (promptIcon) {
      fullClick(promptIcon);
    } else {
      fullClick(container);
    }
    await delay(250);
    await waitForDomUpdate();

    const searchQueries = (
      isFieldOfStudy
        ? buildFieldOfStudySearchQueries(part)
        : isSchool
          ? buildSchoolSearchQueries(part)
          : [part.trim()]
    ).slice(0, isSkills ? 1 : 3);

    let matched = false;
    for (const query of searchQueries) {
      if (!input) break;

      input.focus();
      setNativeValue(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await delay(80);

      setNativeValue(input, query);
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          data: query,
          inputType: "insertText",
        }),
      );
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await handleValueChanges(input);
      await delay(200);

      // Type + ENTER to trigger Workday remote search
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
        }),
      );
      input.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
        }),
      );

      // Wait for search API results (skills / school / FOS)
      if (isSearchPrompt) {
        await delay(isSkills ? 2200 : 2800);
        await waitForDomUpdate();
      }

      let optionEls = getPromptOptionElements();
      if (optionEls.length === 0) {
        optionEls = await waitForPromptOptions(isSearchPrompt ? 2000 : 1200);
      }
      if (optionEls.length === 0 && input) {
        input.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
          }),
        );
        if (isSearchPrompt) await delay(isSkills ? 1500 : 2000);
        optionEls = await waitForPromptOptions(1500);
      }

      if (optionEls.length === 0) continue;

      const labels = optionEls.map(optionLabel).filter(Boolean);
      let matchedLabel: string | null = null;
      if (isFieldOfStudy) {
        matchedLabel = matchFieldOfStudyOption(part, labels);
      } else if (isSkills) {
        matchedLabel = matchSkillOption(part, labels);
      } else if (isSchool) {
        matchedLabel = matchSchoolOrOption(part, labels);
        if (!matchedLabel && labels.length === 1) {
          matchedLabel = matchSchoolOrOption(part, labels);
        }
      } else {
        matchedLabel = matchOption(part, labels);
      }

      // Never pick a random top result when nothing matches
      if (!matchedLabel) continue;

      // Prefer the menuItem/option row that owns this promptOption (checkbox lives there)
      let target: HTMLElement | undefined = optionEls.find(
        (opt) => optionLabel(opt) === matchedLabel,
      );
      if (target) {
        const row = target.closest(
          '[role="option"], [data-automation-id="menuItem"]',
        ) as HTMLElement | null;
        if (row) target = row;
      }
      if (!target) continue;

      const prevCount = selectedLabels.length;
      if (isSkills) {
        // Select via promptLeafNode/checkbox — single click only (no toggle-off)
        const checked = await selectSkillMultiselectOption(target);
        const added = await waitForSkillPillAdded(
          container,
          prevCount,
          matchedLabel,
          part,
          target,
          1800,
        );
        if (checked || added || isSkillOptionChecked(target)) {
          filledAny = true;
          matched = true;
          break;
        }
        continue;
      }

      clickPromptOption(target);
      await delay(400);
      await waitForDomUpdate();

      const selectedNow = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[data-automation-id="selectedItem"]',
        ),
      ).map(optionLabel);

      const selectionMatches = selectedNow.some(
        (s) =>
          matchOption(part, [s]) ||
          matchOption(matchedLabel!, [s]) ||
          (isFieldOfStudy && matchFieldOfStudyOption(part, [s])) ||
          (isSchool && matchSchoolOrOption(part, [s])),
      );

      if (selectionMatches || selectedNow.length > selectedLabels.length) {
        if (isFieldOfStudy && !selectionMatches) {
          continue;
        }
        filledAny = true;
        matched = true;
        break;
      }

      if (selectedNow.length > selectedLabels.length && isSchool) {
        filledAny = true;
        matched = true;
        break;
      }
    }

    if (!matched) {
      if (isSkills && input) {
        // Keep prompt open; clear query and move to next skill
        setNativeValue(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await delay(150);
      } else {
        closeListbox();
      }
    } else {
      await delay(200);
      // Clear search box for next skill; keep selected pills — don't Escape
      // between skills (closes prompt and drops pending selection).
      if (isSkills && input) {
        setNativeValue(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await delay(150);
      } else {
        closeListbox();
        await delay(200);
      }
    }
  }

  // Close skills prompt once all skills attempted
  if (isSkills) {
    closeListbox();
    await delay(150);
  }

  return filledAny;
};

/** Search variants for school typeahead (full name → distinctive token). */
const buildSchoolSearchQueries = (school: string): string[] => {
  const cleaned = cleanLabelText(school);
  if (!cleaned) return [];
  const queries: string[] = [cleaned];

  const noParen = cleaned
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (noParen && noParen !== cleaned) queries.push(noParen);

  // "University of Pennsylvania" → also try "Pennsylvania"
  const stripped = noParen
    .replace(/^(the\s+)?(university|college|school)\s+of\s+/i, "")
    .replace(/\s+(university|college|school)$/i, "")
    .trim();
  if (
    stripped &&
    stripped.length >= 3 &&
    stripped.toLowerCase() !== cleaned.toLowerCase()
  ) {
    queries.push(stripped);
  }

  return [...new Set(queries)];
};

/**
 * Search variants for Field of Study typeahead.
 * e.g. "Business Administration Technology" → full + "Business Administration"
 */
const buildFieldOfStudySearchQueries = (fos: string): string[] => {
  const cleaned = cleanLabelText(fos);
  if (!cleaned) return [];
  const queries: string[] = [cleaned];

  const noParen = cleaned
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (noParen && noParen !== cleaned) queries.push(noParen);

  // Normalize degree wording for better Workday hits
  const normalizedDegree = noParen
    .replace(/\bmasters?\b/gi, "Master")
    .replace(/\bbachelors?\b/gi, "Bachelor")
    .replace(/\bin\b/gi, "of")
    .replace(/\s+/g, " ")
    .trim();
  if (
    normalizedDegree &&
    normalizedDegree.toLowerCase() !== cleaned.toLowerCase()
  ) {
    queries.push(normalizedDegree);
  }

  // "Master of Business Administration" / MBA aliases
  if (/business\s+admin/i.test(cleaned) || /\bmba\b/i.test(cleaned)) {
    queries.push("Business Administration");
    queries.push("Master of Business Administration");
    queries.push("MBA");
  }

  // "General Business And Management" → "Business Management" / "Business"
  if (/business/i.test(cleaned) && /management/i.test(cleaned)) {
    queries.push("Business Management");
    queries.push("General Business");
    queries.push("Management");
  }

  // Drop leading degree words → "Business Administration Technology"
  const withoutDegree = noParen
    .replace(
      /^(masters?|bachelors?|master'?s?|bachelor'?s?|mba|phd|doctorate|associate'?s?)\s+(in|of)\s+/i,
      "",
    )
    .replace(/^(masters?|bachelors?|mba)\s+/i, "")
    .trim();
  if (
    withoutDegree &&
    withoutDegree.length >= 3 &&
    withoutDegree.toLowerCase() !== cleaned.toLowerCase()
  ) {
    queries.push(withoutDegree);
  }

  // Drop trailing "Technology" / similar for broader hits
  const withoutTech = noParen.replace(/\s+technology$/i, "").trim();
  if (
    withoutTech &&
    withoutTech.length >= 4 &&
    withoutTech.toLowerCase() !== cleaned.toLowerCase()
  ) {
    queries.push(withoutTech);
  }

  // Significant last tokens
  const tokens = noParen
    .split(/\s+/)
    .filter(
      (t) =>
        t.length >= 4 &&
        !/^(master|masters|bachelor|bachelors|in|of|the|and|a|general)$/i.test(
          t,
        ),
    );
  if (tokens.length >= 2) {
    queries.push(tokens.slice(0, 2).join(" "));
    queries.push(tokens.slice(-2).join(" "));
  }

  return [...new Set(queries.filter(Boolean))];
};

/** Prefer stronger school-name matches among typeahead results. */
const matchSchoolOrOption = (
  answer: string,
  options: string[],
): string | null => {
  const direct = matchOption(answer, options);
  if (direct) return direct;

  const answerNorm = normalizeForMatch(answer);
  if (!answerNorm || options.length === 0) return null;

  let best: { option: string; score: number } | null = null;
  for (const option of options) {
    const n = normalizeForMatch(option);
    if (!n) continue;

    let score = 0;
    if (n === answerNorm) score = 1000;
    else if (n.includes(answerNorm) || answerNorm.includes(n)) {
      score = 500 + Math.min(n.length, answerNorm.length);
    } else {
      const answerTokens = answerNorm
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 4);
      const optTokens = new Set(
        n.split(/[^a-z0-9]+/).filter((t) => t.length >= 3),
      );
      const hits = answerTokens.filter(
        (t) =>
          optTokens.has(t) ||
          [...optTokens].some((o) => o.includes(t) || t.includes(o)),
      );
      if (hits.length > 0) {
        score = 200 + hits.length * 50 + hits.join("").length;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { option, score };
    }
  }

  return best?.option ?? null;
};

/**
 * Skills multi-select: pick the closest catalog skill (e.g. "Jira" → "Atlassian JIRA").
 * Skip unrelated results — never force the top item when nothing matches.
 */
const matchSkillOption = (
  answer: string,
  options: string[],
): string | null => {
  if (!answer?.trim() || options.length === 0) return null;

  const cleanAnswer = cleanLabelText(answer);
  const answerNorm = normalizeForMatch(answer);
  if (!answerNorm || answerNorm.length < 2) return null;

  for (const option of options) {
    if (cleanLabelText(option) === cleanAnswer) return option;
  }
  for (const option of options) {
    if (normalizeForMatch(option) === answerNorm) return option;
  }

  let best: { option: string; score: number } | null = null;
  for (const option of options) {
    const n = normalizeForMatch(option);
    if (!n) continue;
    const tokens = n.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);

    let score = 0;
    if (n === answerNorm) {
      score = 1000;
    } else if (tokens.some((t) => t === answerNorm)) {
      // Whole-word token: "jira" in "Atlassian JIRA"
      score = 850;
      score += Math.max(0, 80 - n.length);
      if (tokens[tokens.length - 1] === answerNorm) score += 40;
    } else if (
      answerNorm.length >= 3 &&
      tokens.some((t) => t.startsWith(answerNorm) || answerNorm.startsWith(t))
    ) {
      score = 500;
    } else if (answerNorm.length >= 3 && n.includes(answerNorm)) {
      score = 350;
    } else if (
      answerNorm.length >= 4 &&
      tokens.some((t) => t.includes(answerNorm) || answerNorm.includes(t))
    ) {
      score = 250;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { option, score };
    }
  }

  if (best && best.score >= 350) return best.option;
  return null;
};

/**
 * Field of Study: exact / strong match only.
 * If nothing similar appears (e.g. "Master in computer science" with unrelated
 * results), return null — never pick the top list item.
 */
const matchFieldOfStudyOption = (
  answer: string,
  options: string[],
): string | null => {
  if (!answer?.trim() || options.length === 0) return null;

  const cleanAnswer = cleanLabelText(answer);
  const answerNorm = normalizeForMatch(answer);
  if (!answerNorm) return null;

  // 1. Exact label / normalized
  for (const option of options) {
    if (cleanLabelText(option) === cleanAnswer) return option;
  }
  for (const option of options) {
    if (normalizeForMatch(option) === answerNorm) return option;
  }

  // Expand MBA / Master of Business Administration aliases on both sides
  const expandFosAliases = (text: string): Set<string> => {
    const n = normalizeForMatch(text);
    const set = new Set<string>([n]);
    if (/businessadmin|mba/.test(n)) {
      set.add("masterofbusinessadministration");
      set.add("mastersinbusinessadministration");
      set.add("mba");
      set.add("businessadministration");
    }
    // Strip concentration / country suffixes for comparison
    set.add(
      n
        .replace(/concentrationin.*$/i, "")
        .replace(/india$/i, "")
        .replace(/unitedstates$/i, ""),
    );
    return set;
  };

  const answerAliases = expandFosAliases(answer);

  // 2. Alias exact
  for (const option of options) {
    const optAliases = expandFosAliases(option);
    for (const a of answerAliases) {
      if (a && a.length >= 6 && optAliases.has(a)) return option;
    }
  }

  // Subject tokens only — ignore degree noise ("master", "bachelor", "in", …)
  const DEGREE_STOP = new Set([
    "master",
    "masters",
    "bachelor",
    "bachelors",
    "mba",
    "phd",
    "doctorate",
    "degree",
    "in",
    "of",
    "the",
    "and",
    "a",
    "an",
    "program",
    "studies",
  ]);
  const subjectTokens = answerNorm
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !DEGREE_STOP.has(t));

  // 3. Strong containment (full subject phrase)
  const subjectPhrase = subjectTokens.join("");
  if (subjectPhrase.length >= 6) {
    for (const option of options) {
      const n = normalizeForMatch(option);
      if (!n) continue;
      if (n.includes(subjectPhrase) || subjectPhrase.includes(n)) {
        // Avoid tiny option swallowing a long answer (e.g. "science" alone)
        if (n.length >= Math.min(8, subjectPhrase.length)) return option;
      }
    }
  }

  // 4. Token coverage — require most subject words to appear in the option
  let best: { option: string; score: number; coverage: number } | null = null;
  for (const option of options) {
    const n = normalizeForMatch(option);
    if (!n) continue;
    const optTokens = n
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3 && !DEGREE_STOP.has(t));

    if (subjectTokens.length === 0) {
      // Answer was only degree words — require near-exact normalized match only
      continue;
    }

    const hits = subjectTokens.filter((t) =>
      optTokens.some((o) => o === t || (t.length >= 5 && (o.includes(t) || t.includes(o)))),
    );
    const coverage = hits.length / subjectTokens.length;
    if (coverage < 0.75) continue;
    // At least one real subject hit beyond a single short token when multiple exist
    if (subjectTokens.length >= 2 && hits.length < 2) continue;

    const score = Math.round(coverage * 400) + hits.join("").length;
    if (
      !best ||
      score > best.score ||
      (score === best.score && option.length < best.option.length)
    ) {
      best = { option, score, coverage };
    }
  }

  // Strong match only (e.g. computer+science both present)
  if (best && best.coverage >= 0.75 && best.score >= 300) return best.option;
  return null;
};

const fillRadioGroup = async (
  container: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  const radios = Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => {
    let label = "";
    if (radio.id) {
      const forLabel = document.querySelector(
        `label[for="${CSS.escape(radio.id)}"]`,
      );
      if (forLabel?.textContent) {
        label = cleanLabelText(forLabel.textContent);
      }
    }
    if (!label) {
      const sibling = radio.closest("div")?.querySelector("label");
      label = cleanLabelText(sibling?.textContent ?? "");
    }
    if (!label && radio.value === "true") label = "Yes";
    if (!label && radio.value === "false") label = "No";
    return { input: radio, label };
  });

  const labels = labeled.map((item) => item.label).filter(Boolean);
  const matched = matchOption(answer, labels);
  if (!matched) return false;

  const target = labeled.find((item) => item.label === matched);
  if (!target) return false;

  const labelEl = target.input.id
    ? document.querySelector<HTMLElement>(
        `label[for="${CSS.escape(target.input.id)}"]`,
      )
    : null;

  if (labelEl) {
    fullClick(labelEl);
  } else {
    fullClick(target.input);
  }

  if (!target.input.checked) {
    setNativeChecked(target.input, true);
    target.input.dispatchEvent(new Event("input", { bubbles: true }));
    target.input.dispatchEvent(new Event("change", { bubbles: true }));
    fullClick(target.input);
  }

  await delay(80);
  return (
    target.input.checked ||
    target.input.getAttribute("aria-checked") === "true"
  );
};

/** Split multi-select AI answers (skills: "Java, Python, React"). */
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

const fillCheckbox = async (
  input: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  const n = normalizeForMatch(answer);
  let target: boolean | null = null;

  if (
    YES_ANSWERS.has(n) ||
    n === "true" ||
    n.includes("currently") ||
    /^(yes|true|current|i currently work)/i.test(answer.trim())
  ) {
    target = true;
  } else if (
    NO_ANSWERS.has(n) ||
    n === "false" ||
    /^(no|false|not)/i.test(answer.trim())
  ) {
    target = false;
  } else {
    return false;
  }

  const isChecked =
    input.checked || input.getAttribute("aria-checked") === "true";
  if (isChecked === target) return true;

  const labelEl = input.id
    ? document.querySelector<HTMLElement>(
        `label[for="${CSS.escape(input.id)}"]`,
      )
    : null;
  fullClick(labelEl ?? input);
  if (
    (input.checked || input.getAttribute("aria-checked") === "true") !== target
  ) {
    setNativeChecked(input, target);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    fullClick(input);
  }
  await delay(80);
  const now =
    input.checked || input.getAttribute("aria-checked") === "true";
  return now === target;
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

/**
 * Fill Workday MM/YYYY spinbutton dates.
 * Accepts: "01/2020", "1/2020", "2020-01", "Jan 2020", "January 2020", ISO dates.
 */
const parseMonthYear = (
  answer: string,
): { month: string; year: string } | null => {
  const raw = cleanLabelText(answer);
  if (!raw) return null;

  // MM/YYYY or M/YYYY
  let m = raw.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
  if (m) {
    return { month: m[1].padStart(2, "0"), year: m[2] };
  }

  // YYYY-MM or YYYY/MM
  m = raw.match(/^(\d{4})\s*[\/\-.]\s*(\d{1,2})$/);
  if (m) {
    return { month: m[2].padStart(2, "0"), year: m[1] };
  }

  // Month name YYYY
  m = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const mon = MONTH_NAME_TO_NUM[m[1].toLowerCase()];
    if (mon) return { month: mon, year: m[2] };
  }

  // ISO / Date parse
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return {
      month: String(d.getMonth() + 1).padStart(2, "0"),
      year: String(d.getFullYear()),
    };
  }

  // Year only → January
  m = raw.match(/^(\d{4})$/);
  if (m) return { month: "01", year: m[1] };

  return null;
};

/** Parse MM/DD/YYYY (+ common variants) for questionnaire/signature dates. */
const parseMonthDayYear = (
  answer: string,
): { month: string; day: string; year: string } | null => {
  const raw = cleanLabelText(answer);
  if (!raw) return null;

  // "today" / "current date" → system date (common for signature questionnaire fields)
  if (/^(today|current\s*date|todays?\s*date|now)$/i.test(raw)) {
    const d = new Date();
    return {
      month: String(d.getMonth() + 1).padStart(2, "0"),
      day: String(d.getDate()).padStart(2, "0"),
      year: String(d.getFullYear()),
    };
  }

  // MM/DD/YYYY or M/D/YYYY
  let m = raw.match(
    /^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4})$/,
  );
  if (m) {
    return {
      month: m[1].padStart(2, "0"),
      day: m[2].padStart(2, "0"),
      year: m[3],
    };
  }

  // YYYY-MM-DD
  m = raw.match(/^(\d{4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})$/);
  if (m) {
    return {
      month: m[2].padStart(2, "0"),
      day: m[3].padStart(2, "0"),
      year: m[1],
    };
  }

  // Month name DD, YYYY / Month DD YYYY
  m = raw.match(
    /^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/,
  );
  if (m) {
    const mon = MONTH_NAME_TO_NUM[m[1].toLowerCase()];
    if (mon) {
      return {
        month: mon,
        day: m[2].padStart(2, "0"),
        year: m[3],
      };
    }
  }

  // ISO / Date parse (includes full datetime strings)
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return {
      month: String(d.getMonth() + 1).padStart(2, "0"),
      day: String(d.getDate()).padStart(2, "0"),
      year: String(d.getFullYear()),
    };
  }

  return null;
};

const fillDateSpinInput = async (
  input: HTMLInputElement,
  value: string,
): Promise<void> => {
  input.focus();
  fullClick(input);
  setNativeValue(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(input);
  input.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
  );
  await delay(50);
};

const spinValueMatches = (
  input: HTMLInputElement,
  expected: string,
): boolean => {
  const n = String(Number(expected));
  return (
    input.value === expected ||
    input.value === n ||
    input.getAttribute("aria-valuetext") === expected ||
    input.getAttribute("aria-valuetext") === n
  );
};

const fillDateMmyyyy = async (
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  // Present / current job end dates
  if (/present|current|now|ongoing/i.test(answer.trim())) {
    return false; // leave To empty when currently working; checkbox handles it
  }

  const parsed = parseMonthYear(answer);
  if (!parsed) return false;

  const monthInput = wrapper.querySelector<HTMLInputElement>(
    '[data-automation-id="dateSectionMonth-input"], input[aria-label="Month"]',
  );
  const yearInput = wrapper.querySelector<HTMLInputElement>(
    '[data-automation-id="dateSectionYear-input"], input[aria-label="Year"]',
  );
  if (!monthInput || !yearInput) return false;

  await fillDateSpinInput(monthInput, parsed.month);
  await fillDateSpinInput(yearInput, parsed.year);
  await delay(100);

  return (
    spinValueMatches(monthInput, parsed.month) ||
    spinValueMatches(yearInput, parsed.year) ||
    !!monthInput.value ||
    !!yearInput.value
  );
};

/** Fill Workday MM/DD/YYYY questionnaire date (Month / Day / Year spinbuttons). */
const fillDateMmddyyyy = async (
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  const parsed = parseMonthDayYear(answer);
  if (!parsed) return false;

  const monthInput = wrapper.querySelector<HTMLInputElement>(
    '[data-automation-id="dateSectionMonth-input"], input[aria-label="Month"]',
  );
  const dayInput = wrapper.querySelector<HTMLInputElement>(
    '[data-automation-id="dateSectionDay-input"], input[aria-label="Day"]',
  );
  const yearInput = wrapper.querySelector<HTMLInputElement>(
    '[data-automation-id="dateSectionYear-input"], input[aria-label="Year"]',
  );
  if (!monthInput || !dayInput || !yearInput) return false;

  await fillDateSpinInput(monthInput, parsed.month);
  await fillDateSpinInput(dayInput, parsed.day);
  await fillDateSpinInput(yearInput, parsed.year);
  await delay(100);

  return (
    spinValueMatches(monthInput, parsed.month) ||
    spinValueMatches(dayInput, parsed.day) ||
    spinValueMatches(yearInput, parsed.year) ||
    !!(monthInput.value || dayInput.value || yearInput.value)
  );
};

/** Fill Workday YYYY-only spinbutton dates (education From / To). */
const fillDateYyyy = async (
  wrapper: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  const yearMatch =
    cleanLabelText(answer).match(/\b(19|20)\d{2}\b/) ??
    cleanLabelText(answer).match(/^(\d{4})$/);
  if (!yearMatch) {
    // Try month/year parsers and take year
    const my = parseMonthYear(answer);
    if (!my) return false;
    const yearInput = wrapper.querySelector<HTMLInputElement>(
      '[data-automation-id="dateSectionYear-input"], input[aria-label="Year"]',
    );
    if (!yearInput) return false;
    await fillDateSpinInput(yearInput, my.year);
    await delay(100);
    return spinValueMatches(yearInput, my.year) || !!yearInput.value;
  }

  const year = yearMatch[0];
  const yearInput = wrapper.querySelector<HTMLInputElement>(
    '[data-automation-id="dateSectionYear-input"], input[aria-label="Year"]',
  );
  if (!yearInput) return false;

  await fillDateSpinInput(yearInput, year);
  await delay(100);
  return spinValueMatches(yearInput, year) || !!yearInput.value;
};

const fillField = async (
  field: WorkdayCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "listbox") {
    return fillWorkdayListbox(field.element, answer);
  }

  if (field.kind === "multiselect") {
    return fillWorkdayMultiselect(field.element, answer);
  }

  if (field.kind === "date-mmyyyy") {
    return fillDateMmyyyy(field.element, answer);
  }

  if (field.kind === "date-yyyy") {
    return fillDateYyyy(field.element, answer);
  }

  if (field.kind === "date-mmddyyyy") {
    return fillDateMmddyyyy(field.element, answer);
  }

  if (field.kind === "checkbox" && field.element instanceof HTMLInputElement) {
    return fillCheckbox(field.element, answer);
  }

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

/** Count distinct Employment History / Work Experience N indices in answers. */
export const countWorkdayEmploymentAnswers = (
  answers: WorkdayAiAnswer[],
): number => {
  const nums = new Set<number>();
  for (const item of answers) {
    const m = item.label.match(
      /^(?:Employment History|Work Experience)\s*(\d+)\s*-/i,
    );
    if (m) nums.add(Number(m[1]));
  }
  return nums.size;
};

/** Count distinct Education N indices in answers. */
export const countWorkdayEducationAnswers = (
  answers: WorkdayAiAnswer[],
): number => {
  const nums = new Set<number>();
  for (const item of answers) {
    const m = item.label.match(/^Education\s*(\d+)\s*-/i);
    if (m) nums.add(Number(m[1]));
  }
  return nums.size;
};

/**
 * Applies AI fill answers to the current Workday job application page.
 * Re-run after "Save and Continue" for subsequent multi-step pages.
 */
export const autofillWorkdayWithAi = async (
  response: unknown,
): Promise<WorkdayAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseWorkdayAiFillResponse(response);

  // Expand Employment / Education panels to match API entry counts
  // before collecting fields (Add Another is scoped per section).
  const empNeeded = countWorkdayEmploymentAnswers(answers);
  if (empNeeded > 0) {
    await ensureWorkdayEntryPanels("work", empNeeded);
  }
  const eduNeeded = countWorkdayEducationAnswers(answers);
  if (eduNeeded > 0) {
    await ensureWorkdayEntryPanels("education", eduNeeded);
  }

  const candidates = collectWorkdayCandidateFields();

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

  // Fill order:
  // 1) "I currently work here" before To dates
  // 2) Education panels in order: School → Degree → Field of Study → other
  // 3) Employment panels by index
  const fieldSortKey = (label: string): number => {
    if (/i currently work here/i.test(label)) return 0;

    const edu = label.match(/^Education\s*(\d+)\s*-\s*(.+)$/i);
    if (edu) {
      const idx = Number(edu[1]) || 1;
      const bare = edu[2].toLowerCase();
      let fieldOrder = 50;
      if (/school|university/.test(bare)) fieldOrder = 1;
      else if (/^degree/.test(bare)) fieldOrder = 2;
      else if (/field of study/.test(bare)) fieldOrder = 3;
      else if (/overall result|gpa/.test(bare)) fieldOrder = 4;
      else if (/^from/.test(bare)) fieldOrder = 5;
      else if (/^to/.test(bare)) fieldOrder = 6;
      return 100 + idx * 20 + fieldOrder;
    }

    const work = label.match(
      /^(?:Employment History|Work Experience)\s*(\d+)\s*-\s*(.+)$/i,
    );
    if (work) {
      const idx = Number(work[1]) || 1;
      const bare = work[2].toLowerCase();
      let fieldOrder = 50;
      if (/job title/.test(bare)) fieldOrder = 1;
      else if (/^company/.test(bare)) fieldOrder = 2;
      else if (/location/.test(bare)) fieldOrder = 3;
      else if (/currently work/.test(bare)) fieldOrder = 4;
      else if (/^from/.test(bare)) fieldOrder = 5;
      else if (/^to/.test(bare)) fieldOrder = 6;
      else if (/role description/.test(bare)) fieldOrder = 7;
      return 1000 + idx * 20 + fieldOrder;
    }

    // Skills / LinkedIn after repeatable groups
    if (/skill/i.test(label)) return 5000;
    if (/linkedin/i.test(label)) return 5100;
    return 4000;
  };

  const ordered = [...candidates].sort(
    (a, b) => fieldSortKey(a.label) - fieldSortKey(b.label),
  );

  for (const field of ordered) {
    // Country / Country Phone Code are pre-filled or auto-filled by Workday
    if (isWorkdayPrefillExcludedLabel(field.label)) {
      skipped += 1;
      continue;
    }

    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableWorkdayAnswer(answer)) {
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

    // Extra settle time after school/FOS search selects before next field
    if (
      field.kind === "multiselect" &&
      /school|university|field of study/i.test(field.label)
    ) {
      await delay(500);
    } else {
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
