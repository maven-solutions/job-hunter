import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { Applicant } from "../data";
import {
  WorkdayCandidateField,
  collectWorkdayCandidateFields,
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


/** Normalize object keys for employment/education field alias maps. */
const fieldKey = (text: string): string =>
  cleanLabelText(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

/** Coerce employment/education payload into a list of entry objects. */
const normalizeGroupEntries = (raw: unknown): Record<string, unknown>[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (item == null) return null;
        if (typeof item === "object") return item as Record<string, unknown>;
        return null;
      })
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
    return [obj];
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
  university: "School or University",
  college: "School or University",
  degree: "Degree",
  fieldofstudy: "Field of Study",
  major: "Field of Study",
  field: "Field of Study",
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
      ("answer" in (value as object) || "value" in (value as object))
    ) {
      const nested = value as {
        label?: string;
        answer?: unknown;
        value?: unknown;
      };
      const fieldLabel =
        map[fieldKey(nested.label ?? key)] ||
        cleanLabelText(String(nested.label ?? key));
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
      if (/^from$/i.test(fieldLabel)) fieldLabel = "From (MM/YYYY)";
      if (/^to$/i.test(fieldLabel)) fieldLabel = "To (MM/YYYY)";
      if (/^school/i.test(fieldLabel) && kind === "education") {
        fieldLabel = "School or University";
      }
    }
    if (kind === "work" && (fieldLabel === "From" || fieldLabel === "To")) {
      fieldLabel = `${fieldLabel} (MM/YYYY)`;
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

  const pushRepeatableGroup = (
    kind: "work" | "education",
    raw: unknown,
  ): void => {
    const entries = normalizeGroupEntries(raw);
    if (entries.length === 0) {
      markEmpty(kind === "work" ? "Employment" : "Education");
      return;
    }

    entries.forEach((entry, index) => {
      const prefix =
        kind === "work"
          ? `Work Experience ${index + 1}`
          : `Education ${index + 1}`;
      const fields = flattenGroupEntry(entry, kind);
      for (const { fieldLabel, value } of fields) {
        if (!isUsableWorkdayAnswer(value)) {
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

    if (
      typeStr === "employment" ||
      /^employment$/i.test(label) ||
      /^work experience$/i.test(label)
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
      answers.push({
        label,
        answer,
        type: item.type ? String(item.type) : undefined,
      });
      return;
    }

    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object") {
      const sample = raw[0] as Record<string, unknown>;
      const keys = Object.keys(sample).map((k) => k.toLowerCase());
      if (
        keys.some((k) =>
          /job|title|company|employer|school|degree|university/.test(k),
        )
      ) {
        if (
          keys.some((k) =>
            /school|degree|university|education|major/.test(k),
          )
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

  // Bare field name after section prefix: "Work Experience 1 - Job Title" ↔ "Job Title"
  const bareLabel = label.includes(" - ")
    ? label.slice(label.lastIndexOf(" - ") + 3).trim()
    : label;
  if (bareLabel !== label) {
    const bareNorm = normalizeLabel(bareLabel);
    const byBare = answers.find((item) => {
      const itemBare = item.label.includes(" - ")
        ? item.label.slice(item.label.lastIndexOf(" - ") + 3).trim()
        : item.label;
      return (
        normalizeLabel(item.label) === bareNorm ||
        normalizeLabel(itemBare) === bareNorm ||
        normalizeLabel(itemBare) === normalized
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

  if (normalized.length >= 12) {
    const soft = answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 8) return false;
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
    .trim();
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
 * Types to filter, picks option; supports multi-value answers (skills).
 */
const fillWorkdayMultiselect = async (
  container: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  const parts = parseAnswerList(answer);
  const values = parts.length > 1 ? parts : [answer.trim()];
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

    if (selectedLabels.some((s) => matchOption(part, [s]))) {
      filledAny = true;
      continue;
    }

    // Only clear when setting a single-value field (School/Degree-like), not multi skills
    if (i === 0 && values.length === 1 && selectedLabels.length > 0) {
      const deleteBtn = container.querySelector<HTMLElement>(
        '[data-automation-id="DELETE_charm"]',
      );
      if (deleteBtn) {
        fullClick(deleteBtn);
        await delay(150);
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
    await delay(200);
    await waitForDomUpdate();

    if (input) {
      input.focus();
      setNativeValue(input, part);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await handleValueChanges(input);
      await delay(400);
      await waitForDomUpdate();
    }

    let optionEls = getOpenOptionElements();
    if (optionEls.length === 0) {
      // Workday school/FOS: press Enter to load matches
      if (input) {
        input.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
          }),
        );
        await delay(400);
        await waitForDomUpdate();
        optionEls = getOpenOptionElements();
      }
    }
    if (optionEls.length === 0) {
      await delay(300);
      await waitForDomUpdate();
      optionEls = getOpenOptionElements();
    }

    if (optionEls.length === 0) {
      closeListbox();
      continue;
    }

    const labels = optionEls.map(optionLabel);
    let matchedLabel = matchOption(part, labels);
    // Prefer first visible option when search is reasonably specific
    if (!matchedLabel && optionEls.length === 1) {
      matchedLabel = labels[0];
    }
    if (!matchedLabel) {
      // Closest soft match among loaded results
      matchedLabel = matchOption(part, labels);
    }
    if (!matchedLabel) {
      closeListbox();
      continue;
    }

    const target = optionEls.find((opt) => optionLabel(opt) === matchedLabel);
    if (!target) {
      closeListbox();
      continue;
    }

    fullClick(target);
    await delay(250);
    filledAny = true;
  }

  return filledAny;
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

/**
 * Applies AI fill answers to the current Workday job application page.
 * Re-run after "Save and Continue" for subsequent multi-step pages.
 */
export const autofillWorkdayWithAi = async (
  response: unknown,
): Promise<WorkdayAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseWorkdayAiFillResponse(response);
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

  for (const field of candidates) {
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

    await delay(200);
  }

  return {
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
