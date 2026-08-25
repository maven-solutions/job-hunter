import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  UltiproCandidateField,
  collectUltiproCandidateFields,
  ensureUltiproEducationRecords,
  getUltiproNativeSelectOptions,
  getUltiproRadioChoiceLabel,
  isInsideUltiproEducation,
  isInsideUltiproSkippedSection,
  isRepeatableEducationFieldLabel,
  isUltiproAddressField,
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
  const candidates = [item.answer, item.value, item.fill, item.text, item.data];
  for (const candidate of candidates) {
    if (isUsableUltiproAnswer(candidate)) return candidate;
  }
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

/** Map API education keys onto UKG Education labels. */
const EDUCATION_FIELD_MAP: Record<string, string> = {
  school: "School Name",
  schooloruniversity: "School Name",
  schoolname: "School Name",
  university: "School Name",
  college: "School Name",
  degree: "Level of Education / Degree",
  degreename: "Level of Education / Degree",
  levelofeducation: "Level of Education / Degree",
  levelofeducationdegree: "Level of Education / Degree",
  fieldofstudy: "Major",
  major: "Major",
  majorname: "Major",
  field: "Major",
  minor: "Minor",
  minorname: "Minor",
  from: "From",
  fromyyyy: "From",
  frommonth: "From",
  fromyear: "From",
  firstyearattended: "From",
  startyear: "From",
  startdate: "From",
  start: "From",
  to: "To",
  toyyyy: "To",
  tomonth: "To",
  toyear: "To",
  toactualorexpected: "To",
  lastyearattended: "To",
  endyear: "To",
  enddate: "To",
  end: "To",
  description: "Description",
};

const EDUCATION_LABEL_ALIASES: string[][] = [
  ["schoolname", "school", "schooloruniversity", "university", "college"],
  [
    "levelofeducationdegree",
    "degree",
    "degreename",
    "levelofeducation",
  ],
  ["major", "majorname", "fieldofstudy", "field"],
  ["minor", "minorname"],
  ["from", "frommonth", "fromyear", "startdate", "start", "startyear"],
  [
    "to",
    "tomonth",
    "toyear",
    "enddate",
    "end",
    "endyear",
    "toactualorexpected",
  ],
  ["description"],
];

const parseEducationPrefixedLabel = (
  label: string,
): { index: number; field: string } | null => {
  const m = cleanLabelText(label).match(/^Education\s*(\d+)\s*-\s*(.+)$/i);
  if (!m) return null;
  return { index: Number(m[1]), field: compactLabel(m[2]) };
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
      if (/school|degree|major|from|to|start|end/i.test(firstName)) {
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
  const mapped = EDUCATION_FIELD_MAP[compactLabel(rawLabel)];
  if (mapped) return mapped;
  let fieldLabel = cleanLabelText(rawLabel);
  if (/^school/i.test(fieldLabel)) return "School Name";
  if (/degree|level of education/i.test(fieldLabel)) {
    return "Level of Education / Degree";
  }
  if (/field of study/i.test(fieldLabel)) return "Major";
  if (/^from/i.test(fieldLabel) || /^start/i.test(fieldLabel)) return "From";
  if (/^to/i.test(fieldLabel) || /^end/i.test(fieldLabel)) return "To";
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

const isEducationGroupItem = (item: any): boolean => {
  if (!item || typeof item !== "object") return false;
  const label = String(item.label ?? item.field ?? item.name ?? "").trim();
  const typeStr = String(item.type ?? "").toLowerCase();
  return typeStr === "education" || /^education$/i.test(label);
};

const collectNameValuePairs = (
  node: unknown,
  out: any[],
  depth = 0,
): void => {
  if (node == null || depth > 8) return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectNameValuePairs(item, out, depth + 1));
    return;
  }
  if (typeof node !== "object") return;

  const obj = node as Record<string, unknown>;
  if (isEducationGroupItem(obj)) {
    out.push(obj);
    return;
  }

  const label = obj.label ?? obj.field ?? obj.name;
  const hasValue =
    obj.value != null ||
    obj.answer != null ||
    obj.fill != null ||
    obj.text != null;
  if (label != null && String(label).trim() && hasValue) {
    out.push(obj);
    return;
  }

  Object.values(obj).forEach((value) => {
    collectNameValuePairs(value, out, depth + 1);
  });
};

export const parseUltiproAiFillResponse = (
  response: unknown,
): UltiproParsedFillResponse => {
  const answers: UltiproAiAnswer[] = [];
  const emptyLabelKeys = new Set<string>();
  let emptyCount = 0;

  if (!response) {
    return { answers, emptyLabelKeys, emptyCount };
  }

  const markEmpty = (label: string): void => {
    addLabelKey(emptyLabelKeys, label);
    emptyCount += 1;
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
        if (!isUsableUltiproAnswer(value)) {
          markEmpty(`${prefix} - ${fieldLabel}`);
          continue;
        }
        answers.push({
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

  const pairs: any[] = [];
  collectNameValuePairs(payload ?? response, pairs);
  if (pairs.length > 0) {
    pairs.forEach(processItem);
    if (typeof payload === "object" && Array.isArray(payload?.education)) {
      const already = answers.some((item) =>
        isRepeatableEducationFieldLabel(item.label),
      );
      if (!already) pushEducationGroup(payload.education);
    }
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

const compactLabel = (label: string): string =>
  cleanLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const ADDRESS_LABEL_ALIASES: Record<string, string> = {
  address1: "address1",
  addressline1: "address1",
  addresslineone: "address1",
  line1: "address1",
  address2: "address2",
  addressline2: "address2",
  addresslinetwo: "address2",
  line2: "address2",
  zip: "postalcode",
  zipcode: "postalcode",
  postalcode: "postalcode",
  zippostalcode: "postalcode",
};

const canonicalLabelKey = (label: string): string => {
  const compact = compactLabel(label);
  return ADDRESS_LABEL_ALIASES[compact] ?? compact;
};

const findAnswerForLabel = (
  label: string,
  answers: UltiproAiAnswer[],
): UltiproAiAnswer | undefined => {
  const cleaned = cleanLabelText(label);
  const exact = answers.find(
    (item) => cleanLabelText(item.label) === cleaned,
  );
  if (exact) return exact;

  const compact = compactLabel(label);
  const byCompact = answers.find((item) => compactLabel(item.label) === compact);
  if (byCompact) return byCompact;

  const canonical = canonicalLabelKey(label);
  const byCanonical = answers.find(
    (item) => canonicalLabelKey(item.label) === canonical,
  );
  if (byCanonical) return byCanonical;

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

  return undefined;
};

const findAnswerForField = (
  field: UltiproCandidateField,
  answers: UltiproAiAnswer[],
): UltiproAiAnswer | undefined => {
  const byLabel = findAnswerForLabel(field.label, answers);
  if (byLabel) return byLabel;

  const id = field.element.getAttribute("id") || "";
  if (id) {
    const byId = findAnswerForLabel(id, answers);
    if (byId) return byId;
  }

  const automation = field.element.getAttribute("data-automation") || "";
  if (automation === "address-line1-textbox") {
    return findAnswerForLabel("Address 1", answers);
  }
  if (automation === "address-line2-textbox") {
    return findAnswerForLabel("Address 2", answers);
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

const writeKnockoutValue = (element: HTMLElement, value: string): void => {
  const ko = (window as any).ko;
  if (!ko) return;

  try {
    ko.utils?.triggerEvent?.(element, "change");
    const data = ko.dataFor?.(element);
    const address = data?.Address;
    if (!address) return;

    const id = (element.getAttribute("id") || "").toLowerCase();
    const setObs = (obs: unknown): void => {
      if (typeof obs === "function") {
        (obs as (next: string) => void)(value);
      }
    };

    if (id === "addressline1") setObs(address.Line1);
    if (id === "addressline2") setObs(address.Line2);
    if (id === "city") setObs(address.City);
    if (id === "postalcode") setObs(address.PostalCode);
  } catch {
    // Knockout context may not exist on this node.
  }
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableUltiproAnswer(answer)) return false;
  const value = clipToMaxLength(element, answer);
  element.focus();
  setNativeValue(element, value);
  writeKnockoutValue(element, value);
  await notifyUltiproControl(element);
  try {
    getJquery()?.(element)?.val?.(value)?.trigger?.("input")?.trigger?.("change");
  } catch {
    // jQuery is optional.
  }
  writeKnockoutValue(element, value);
  writeEducationKnockoutValue(element, value);
  return isUsableUltiproAnswer(element.value);
};

const writeEducationKnockoutValue = (
  element: HTMLElement,
  value: string,
): void => {
  const ko = (window as any).ko;
  if (!ko) return;

  try {
    const data = ko.dataFor?.(element);
    if (!data) return;

    const setObs = (obs: unknown): void => {
      if (typeof obs === "function") {
        (obs as (next: string) => void)(value);
      }
    };

    const automation = (element.getAttribute("data-automation") || "").toLowerCase();
    if (automation === "school-textbox") setObs(data.SchoolName);
    if (automation === "degree-textbox") setObs(data.DegreeName);
    if (automation === "description-textarea") setObs(data.Description);
    if (automation === "from-year-textbox") setObs(data.FromYear);
    if (automation === "to-year-textbox") setObs(data.ToYear);
    if (automation === "from-month-dropdown") setObs(data.FromMonth);
    if (automation === "to-month-dropdown") setObs(data.ToMonth);
    if (automation === "major-dropdown") setObs(data.MajorId);
    if (automation === "minor-dropdown") setObs(data.MinorId);
  } catch {
    // Knockout context may not exist on this node.
  }
};

const isUltiproTypeaheadInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) return false;
  const automation = (element.getAttribute("data-automation") || "").toLowerCase();
  if (automation === "school-textbox" || automation === "degree-textbox") {
    return true;
  }
  return (
    element.classList.contains("tt-input") ||
    !!element.closest(".twitter-typeahead")
  );
};

const getTypeaheadSuggestionEls = (input: HTMLElement): HTMLElement[] => {
  const root =
    input.closest(".twitter-typeahead") ||
    input.parentElement;
  const menu = root?.querySelector<HTMLElement>(
    ".tt-dropdown-menu, .tt-menu",
  );
  if (!menu) return [];
  const style = window.getComputedStyle(menu);
  if (style.display === "none" || style.visibility === "hidden") return [];
  return Array.from(
    menu.querySelectorAll<HTMLElement>(".tt-suggestion, [role='option']"),
  ).filter((el) => {
    const text = cleanLabelText(el.textContent ?? "");
    if (!text) return false;
    const elStyle = window.getComputedStyle(el);
    return elStyle.display !== "none" && elStyle.visibility !== "hidden";
  });
};

const waitForTypeaheadSuggestions = (
  input: HTMLElement,
  timeoutMs = 1400,
): Promise<HTMLElement[]> =>
  new Promise((resolve) => {
    const start = Date.now();
    const tick = (): void => {
      const items = getTypeaheadSuggestionEls(input);
      if (items.length > 0 || Date.now() - start >= timeoutMs) {
        resolve(items);
        return;
      }
      window.setTimeout(tick, 80);
    };
    tick();
  });

const buildSchoolSearchQueries = (school: string): string[] => {
  const cleaned = cleanLabelText(school);
  if (!cleaned) return [];
  const queries: string[] = [cleaned];

  const noParen = cleaned
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (noParen && noParen !== cleaned) queries.push(noParen);

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

const clickTypeaheadSuggestion = async (
  suggestion: HTMLElement,
): Promise<void> => {
  suggestion.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
  );
  suggestion.click();
  suggestion.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true }),
  );
  await delay(120);
};

const fillUltiproTypeahead = async (
  input: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableUltiproAnswer(answer)) return false;

  const queries =
    (input.getAttribute("data-automation") || "") === "school-textbox"
      ? buildSchoolSearchQueries(answer)
      : [cleanLabelText(answer)];

  input.focus();
  input.click();
  await delay(80);

  for (const query of queries) {
    setNativeValue(input, query);
    writeEducationKnockoutValue(input, query);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        key: query.slice(-1) || "a",
      }),
    );
    try {
      getJquery()?.(input)?.val?.(query)?.trigger?.("input")?.trigger?.("keyup");
    } catch {
      // jQuery typeahead is optional.
    }

    const suggestions = await waitForTypeaheadSuggestions(input);
    if (suggestions.length === 0) continue;

    const labels = suggestions.map((el) =>
      cleanLabelText(el.textContent ?? ""),
    );
    const matched = matchOption(answer, labels) || matchOption(query, labels);
    const target =
      suggestions.find(
        (el, i) => labels[i] === matched,
      ) || (suggestions.length === 1 ? suggestions[0] : null);

    if (target) {
      await clickTypeaheadSuggestion(target);
      writeEducationKnockoutValue(input, input.value || query);
      await notifyUltiproControl(input);
      if (isUsableUltiproAnswer(input.value)) return true;
    }
  }

  const fallback = queries[0] || answer;
  setNativeValue(input, fallback);
  writeEducationKnockoutValue(input, fallback);
  await notifyUltiproControl(input);
  try {
    getJquery()?.(input)?.val?.(fallback)?.trigger?.("input")?.trigger?.("change");
  } catch {
    // optional
  }
  input.blur();
  return isUsableUltiproAnswer(input.value);
};

const isUltiproEducationMonthField = (element: HTMLElement): boolean => {
  const automation = (element.getAttribute("data-automation") || "").toLowerCase();
  return (
    automation === "from-month-dropdown" || automation === "to-month-dropdown"
  );
};

const isUltiproEducationYearField = (element: HTMLElement): boolean => {
  const automation = (element.getAttribute("data-automation") || "").toLowerCase();
  return (
    automation === "from-year-textbox" || automation === "to-year-textbox"
  );
};

const MONTH_SHORT = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const parseMonthYearAnswer = (
  answer: string,
): { month?: string; year?: string } => {
  const trimmed = answer.trim();
  if (!trimmed) return {};

  const parsed = parseDateAnswer(trimmed);
  if (parsed) {
    const [year, month] = parsed.iso.split("-");
    return { month: String(Number(month)), year };
  }

  const my = trimmed.match(/^(\d{1,2})[/-](\d{4})$/);
  if (my) return { month: String(Number(my[1])), year: my[2] };

  const ym = trimmed.match(/^(\d{4})[/-](\d{1,2})$/);
  if (ym) return { year: ym[1], month: String(Number(ym[2])) };

  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) return { year: yearOnly[1] };

  const lower = trimmed.toLowerCase();
  const monthIdx = MONTH_SHORT.findIndex(
    (m) => lower.startsWith(m) || lower.includes(m),
  );
  const yearMatch = trimmed.match(/(\d{4})/);
  const result: { month?: string; year?: string } = {};
  if (monthIdx >= 0) result.month = String(monthIdx + 1);
  if (yearMatch) result.year = yearMatch[1];
  return result;
};

const KNOWN_TEXT_INPUTS: { id: string; labels: string[] }[] = [
  { id: "AddressLine1", labels: ["Address 1", "Address Line 1", "AddressLine1"] },
  { id: "AddressLine2", labels: ["Address 2", "Address Line 2", "AddressLine2"] },
  { id: "City", labels: ["City"] },
  {
    id: "PostalCode",
    labels: ["Zip / Postal Code", "Postal Code", "Zip", "PostalCode"],
  },
];

/** Always apply address answers to known UKG ids, even if scan skipped the field. */
const fillKnownUltiproTextInputs = async (
  answers: UltiproAiAnswer[],
): Promise<number> => {
  let filled = 0;
  for (const known of KNOWN_TEXT_INPUTS) {
    const match = known.labels
      .map((label) => findAnswerForLabel(label, answers))
      .find((item) => item && isUsableUltiproAnswer(item.answer));
    if (!match) continue;

    const input = document.getElementById(known.id);
    if (!(input instanceof HTMLInputElement)) continue;

    await waitUntilVisible(input);
    const ok = await fillTextLikeField(input, match.answer);
    if (ok) filled += 1;
    await delay(150);
  }
  return filled;
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

  if (
    isUltiproEducationMonthField(field.element) &&
    field.element instanceof HTMLSelectElement
  ) {
    const { month } = parseMonthYearAnswer(answer);
    if (!month) return false;
    const ok = await fillNativeSelect(field.element, month);
    if (ok) writeEducationKnockoutValue(field.element, field.element.value);
    return ok;
  }

  if (
    isUltiproEducationYearField(field.element) &&
    field.element instanceof HTMLInputElement
  ) {
    const { year } = parseMonthYearAnswer(answer);
    if (!year) return false;
    return fillTextLikeField(field.element, year);
  }

  if (isUltiproTypeaheadInput(field.element)) {
    return fillUltiproTypeahead(field.element as HTMLInputElement, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    const ok = await fillNativeSelect(field.element, answer);
    if (ok && isInsideUltiproEducation(field.element)) {
      writeEducationKnockoutValue(field.element, field.element.value);
    }
    return ok;
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
    const edu = field.label.match(/^Education\s*(\d+)\s*-\s*(.+)$/i);
    if (edu) {
      const idx = Number(edu[1]) || 1;
      const bare = edu[2].toLowerCase();
      let fieldOrder = 50;
      if (/school/.test(bare)) fieldOrder = 1;
      else if (/degree|level of education/.test(bare)) fieldOrder = 2;
      else if (/major|field of study/.test(bare)) fieldOrder = 3;
      else if (/minor/.test(bare)) fieldOrder = 4;
      else if (/from month|^from$/.test(bare)) fieldOrder = 5;
      else if (/from year/.test(bare)) fieldOrder = 6;
      else if (/to month|^to$/.test(bare)) fieldOrder = 7;
      else if (/to year/.test(bare)) fieldOrder = 8;
      else if (/description/.test(bare)) fieldOrder = 9;
      return 5000 + idx * 20 + fieldOrder;
    }

    if (isUltiproCountryField(field.element)) return 10;
    if (field.kind === "select" && !isUltiproStateField(field.element)) return 20;
    if (isUltiproStateField(field.element)) return 30;
    if (isUltiproAddressField(field.element)) return 35;
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

  const eduNeeded = (() => {
    const nums = new Set<number>();
    for (const item of answers) {
      const m = item.label.match(/^Education\s*(\d+)\s*-/i);
      if (m) nums.add(Number(m[1]));
    }
    return nums.size;
  })();
  if (eduNeeded > 0) {
    await ensureUltiproEducationRecords(eduNeeded);
  }

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

    const match = findAnswerForField(field, answers);
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

      if (
        isUltiproReferralDetailField(field.element) ||
        isUltiproAddressField(field.element)
      ) {
        await waitUntilVisible(field.element);
      }

      const ok = await fillField(field, answer as string);
      if (ok) {
        filled += 1;

        if (isUltiproCountryField(field.element)) {
          const stateSelect = findStateSelect(candidates);
          if (stateSelect) {
            await waitForSelectOptions(stateSelect);
          }
          const addressLine1 = document.getElementById("AddressLine1");
          if (addressLine1 instanceof HTMLElement) {
            await waitUntilVisible(addressLine1);
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

  filled += await fillKnownUltiproTextInputs(answers);

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
