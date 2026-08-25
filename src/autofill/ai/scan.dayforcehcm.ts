import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";
import { Applicant } from "../data";
import { AiNestedFieldSchema } from "./types";

export type ApiElementType = string;

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[] | AiNestedFieldSchema[];
  description?: string;
  count?: number;
}

export interface DayforceHcmScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface DayforceHcmScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
  applicantData?: Applicant | null;
}

export type DayforceHcmFieldKind =
  | "text"
  | "combobox"
  | "select"
  | "checkbox"
  | "date"
  | "number";

export interface DayforceHcmCandidateField {
  element: HTMLElement;
  /** Ant Select root when kind is combobox. */
  selectRoot?: HTMLElement;
  label: string;
  required: boolean;
  kind: DayforceHcmFieldKind;
}

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "checkbox",
  "radio",
  "password",
  "image",
]);

const PLACEHOLDER_OPTION_RE =
  /^(select(\s+one)?|please select|choose(\s+one)?|n\/?a|-|—|--|\.+)$/i;

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const EDUCATION_SECTION_SELECTOR = '[test-id="education-history"]';
const EDUCATION_RECORD_SELECTOR =
  'form[test-id="educationhistory-record"], form[id^="educationHistory-"]';
const ADD_EDUCATION_BUTTON_SELECTOR =
  '[test-id="add-educationhistory-record"]';

export const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

export const isDayforceHcmEducationSectionPresent = (): boolean =>
  !!document.querySelector(EDUCATION_SECTION_SELECTOR);

export const isInsideDayforceHcmEducation = (element: Element): boolean =>
  !!element.closest(
    `${EDUCATION_RECORD_SELECTOR}, ${EDUCATION_SECTION_SELECTOR}`,
  );

export const countDayforceHcmEducationRecords = (): number =>
  document.querySelectorAll(EDUCATION_RECORD_SELECTOR).length;

/** 0-based education record index, or null when the control is not in Education. */
export const getDayforceHcmEducationIndex = (
  element: Element,
): number | null => {
  const form = element.closest<HTMLFormElement>(EDUCATION_RECORD_SELECTOR);
  if (form?.id) {
    const fromForm = form.id.match(/educationHistory-(\d+)/i);
    if (fromForm) return Number(fromForm[1]);
  }

  const id = (element as HTMLElement).id || "";
  const fromId = id.match(/educationHistory_(\d+)_/i);
  if (fromId) return Number(fromId[1]);

  if (form) return 0;
  return null;
};

export const withDayforceHcmSectionLabel = (
  baseLabel: string,
  element: Element,
): string => {
  const base = cleanLabelText(baseLabel);
  if (!base) return base;
  if (/^Education\s*\d+\s*-/i.test(base)) return base;
  const idx = getDayforceHcmEducationIndex(element);
  if (idx == null) return base;
  return `Education ${idx + 1} - ${base}`;
};

export const isRepeatableEducationFieldLabel = (label: string): boolean =>
  /^education\s*\d+\s*-/i.test(label.trim());

/**
 * Click "Add Education History" until `needed` record forms exist.
 * Mirrors Workday ensureWorkdayEntryPanels for education.
 */
export const ensureDayforceHcmEducationRecords = async (
  needed: number,
): Promise<void> => {
  if (!isDayforceHcmEducationSectionPresent()) return;
  if (!needed || needed < 1) return;

  const findAdd = (): HTMLButtonElement | null =>
    document.querySelector<HTMLButtonElement>(ADD_EDUCATION_BUTTON_SELECTOR);

  let current = countDayforceHcmEducationRecords();
  if (current === 0) {
    const add = findAdd();
    if (add) {
      add.click();
      await delay(600);
      current = countDayforceHcmEducationRecords();
    }
  }

  let guard = 0;
  while (current < needed && guard < 20) {
    const add = findAdd();
    if (!add) break;
    add.click();
    await delay(700);
    const next = countDayforceHcmEducationRecords();
    if (next <= current) {
      await delay(500);
    }
    current = countDayforceHcmEducationRecords();
    guard += 1;
  }
};

/** Expand Education History records from applicant profile before scan. */
export const prepareDayforceHcmEducationRecords = async (
  applicantData: Applicant | null | undefined,
): Promise<void> => {
  if (!isDayforceHcmEducationSectionPresent()) return;
  const eduCount = Array.isArray(applicantData?.education)
    ? applicantData!.education!.length
    : 0;
  if (eduCount > 0) {
    await ensureDayforceHcmEducationRecords(eduCount);
  }
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const isDisplayVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

export const getDayforceHcmAntSelectRoot = (
  element: Element,
): HTMLElement | null =>
  (element.closest(".ant-select") as HTMLElement | null) ?? null;

export const getDayforceHcmComboboxInput = (
  selectRoot: HTMLElement,
): HTMLInputElement | null =>
  selectRoot.querySelector<HTMLInputElement>(
    "input.ant-select-selection-search-input, input[role='combobox']",
  );

const isAntSelectDisabled = (selectRoot: HTMLElement): boolean =>
  selectRoot.classList.contains("ant-select-disabled") ||
  selectRoot.getAttribute("aria-disabled") === "true" ||
  !!getDayforceHcmComboboxInput(selectRoot)?.disabled;

const getAntSelectDisplayValue = (selectRoot: HTMLElement): string => {
  const item = selectRoot.querySelector<HTMLElement>(
    ".ant-select-selection-item",
  );
  if (item?.textContent) {
    return cleanLabelText(item.textContent);
  }
  const input = getDayforceHcmComboboxInput(selectRoot);
  return cleanLabelText(input?.value ?? "");
};

const getFormItem = (element: Element): HTMLElement | null =>
  (element.closest(".ant-form-item") as HTMLElement | null) ?? null;

const getFormItemLabelText = (formItem: HTMLElement | null): string => {
  if (!formItem) return "";
  const label =
    formItem.querySelector<HTMLElement>(".ant-form-item-label label") ??
    formItem.querySelector<HTMLElement>("label");
  return cleanLabelText(
    label?.textContent ?? label?.getAttribute("title") ?? "",
  );
};

export const isDayforceHcmPhoneCountryCombobox = (
  selectRoot: HTMLElement,
): boolean => {
  const testId = selectRoot.getAttribute("test-id") || "";
  if (/phone-dropdown/i.test(testId)) return true;
  const aria =
    selectRoot.getAttribute("aria-label") ||
    getDayforceHcmComboboxInput(selectRoot)?.getAttribute("aria-label") ||
    "";
  return /country dialing code|dialing code|country code/i.test(aria);
};

export const getDayforceHcmFieldLabel = (element: HTMLElement): string => {
  const resolveBase = (): string => {
    const selectRoot = getDayforceHcmAntSelectRoot(element);
    if (selectRoot && isDayforceHcmPhoneCountryCombobox(selectRoot)) {
      const parentLabel = getFormItemLabelText(getFormItem(selectRoot));
      if (parentLabel) return `${parentLabel} Country Code`;
      return "Phone Country Code";
    }

    const id = element.getAttribute("id");
    if (id) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label?.textContent) {
        return cleanLabelText(label.textContent);
      }
    }

    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel && !/country dialing code/i.test(ariaLabel)) {
      return cleanLabelText(ariaLabel);
    }

    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
      if (labelEl?.textContent) {
        return cleanLabelText(labelEl.textContent);
      }
    }

    const formItemLabel = getFormItemLabelText(getFormItem(element));
    if (formItemLabel) return formItemLabel;

    return id ?? "Unknown field";
  };

  return withDayforceHcmSectionLabel(resolveBase(), element);
};

export const isDayforceHcmRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const formItem = getFormItem(element);
  if (
    formItem?.querySelector(
      ".ant-form-item-required, label.ant-form-item-required",
    )
  ) {
    return true;
  }

  const label =
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) ||
    formItem?.querySelector("label");

  if (label?.classList.contains("ant-form-item-required")) return true;
  if (label?.textContent?.includes("*")) return true;

  return false;
};

export const getDayforceHcmFieldValue = (
  field: DayforceHcmCandidateField,
): string => {
  if (field.kind === "checkbox" && field.element instanceof HTMLInputElement) {
    return field.element.checked ? "true" : "";
  }
  if (field.kind === "combobox" && field.selectRoot) {
    return getAntSelectDisplayValue(field.selectRoot);
  }
  if (field.element instanceof HTMLSelectElement) {
    const selected = field.element.selectedOptions[0];
    return cleanLabelText(selected?.textContent ?? field.element.value ?? "");
  }
  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return (field.element.value ?? "").trim();
  }
  return "";
};

export const isDayforceHcmFieldFilled = (
  field: DayforceHcmCandidateField,
): boolean => getDayforceHcmFieldValue(field).length > 0;

const isVisibleTextControl = (element: HTMLElement): boolean => {
  if (isInsideExtension(element)) return false;
  if (element.closest(".ant-select")) return false;
  if (element.closest(".visually-hidden, [aria-hidden='true']")) return false;
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }
  return isDisplayVisible(element);
};

const isVisibleSelectRoot = (selectRoot: HTMLElement): boolean => {
  if (isInsideExtension(selectRoot)) return false;
  if (selectRoot.getAttribute("aria-hidden") === "true") return false;
  // Compact phone-code selects are easy to miss with rect/aria-hidden checks.
  if (isDayforceHcmPhoneCountryCombobox(selectRoot)) {
    return selectRoot.isConnected;
  }
  return isDisplayVisible(selectRoot);
};

const getVisibleAntDropdown = (): HTMLElement | null => {
  const dropdowns = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
    ),
  ).filter((node) => {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  });
  return dropdowns[dropdowns.length - 1] ?? null;
};

/** Resolve the open Ant / rc-virtual-list listbox for this select. */
export const getDayforceHcmListbox = (
  selectRoot: HTMLElement,
): HTMLElement | null => {
  const input = getDayforceHcmComboboxInput(selectRoot);
  const listId =
    input?.getAttribute("aria-controls") || input?.getAttribute("aria-owns");
  if (listId) {
    const list = document.getElementById(listId);
    if (list?.querySelector('[role="option"], .ant-select-item-option')) {
      return list;
    }
  }

  const virtualInner = document.querySelector<HTMLElement>(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .rc-virtual-list-holder-inner[role='listbox'], .rc-virtual-list-holder-inner[role='listbox']",
  );
  if (virtualInner?.querySelector('[role="option"]')) {
    return virtualInner;
  }

  return getVisibleAntDropdown();
};

const collectOptionsFromDropdown = (dropdown: HTMLElement): string[] => {
  const results: string[] = [];
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
      if (PLACEHOLDER_OPTION_RE.test(label)) return;
      seen.add(label);
      results.push(label);
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
  if (isAntSelectDisabled(selectRoot)) return false;

  if (selectRoot.classList.contains("ant-select-open")) {
    await closeAntSelect();
    await delay(100);
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
    input?.getAttribute("aria-expanded") === "true" ||
    getDayforceHcmListbox(selectRoot) != null
  );
};

const waitForAntDropdown = (timeoutMs = 900): Promise<HTMLElement | null> =>
  new Promise((resolve) => {
    const existing = getVisibleAntDropdown();
    if (existing) {
      resolve(existing);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(getVisibleAntDropdown());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const dropdown = getVisibleAntDropdown();
      if (dropdown) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(dropdown);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  });

export const openAndScanDayforceHcmComboboxOptions = async (
  selectRoot: HTMLElement,
): Promise<string[]> => {
  if (isAntSelectDisabled(selectRoot)) return [];

  const opened = await openAntSelect(selectRoot);
  if (!opened) return [];

  let dropdown =
    getDayforceHcmListbox(selectRoot) ?? (await waitForAntDropdown(1200));
  let options = dropdown ? collectOptionsFromDropdown(dropdown) : [];

  if (options.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    dropdown = getDayforceHcmListbox(selectRoot) ?? getVisibleAntDropdown();
    options = dropdown ? collectOptionsFromDropdown(dropdown) : [];
  }

  await closeAntSelect();
  return options;
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label)) return;
    if (!opt.value && PLACEHOLDER_OPTION_RE.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const educationFormHas = (testId: string): boolean =>
  !!document.querySelector(
    `${EDUCATION_RECORD_SELECTOR} [test-id="${testId}"]`,
  );

/**
 * Nested Education schema for the AI API (Workday-style group).
 * Labels match Dayforce form titles so fill can prefix "Education N -".
 */
const buildDayforceHcmEducationSchema = (): AiNestedFieldSchema[] => {
  const fields: AiNestedFieldSchema[] = [];
  const first =
    document.querySelector<HTMLElement>(EDUCATION_RECORD_SELECTOR) ??
    document.querySelector<HTMLElement>(EDUCATION_SECTION_SELECTOR);
  if (!first) return fields;

  if (educationFormHas("education-history-degree-text-input")) {
    fields.push({ type: "text", label: "Degree", required: true });
  }
  if (educationFormHas("education-history-educationnotcompleted-checkbox")) {
    fields.push({
      type: "checkbox",
      label: "Not Completed",
      options: ["Yes", "No"],
    });
  }
  if (educationFormHas("education-history-major-text-input")) {
    fields.push({ type: "text", label: "Major" });
  }
  if (educationFormHas("education-history-minor-text-input")) {
    fields.push({ type: "text", label: "Minor" });
  }
  if (educationFormHas("education-history-startdate-datepicker")) {
    fields.push({
      type: "date",
      label: "Start Date",
      description: "YYYY-MM-DD",
    });
  }
  if (educationFormHas("education-history-enddate-datepicker")) {
    fields.push({
      type: "date",
      label: "End Date",
      description: "YYYY-MM-DD",
    });
  }
  if (educationFormHas("education-history-schoolname-text-input")) {
    fields.push({ type: "text", label: "School", required: true });
  }
  if (first.querySelector("[id$='_countryCode'], [test-id='country-selector']")) {
    fields.push({ type: "search", label: "Country" });
  }
  if (
    first.querySelector(
      "[id$='_stateCode'], [test-id='state-province-selector']",
    )
  ) {
    fields.push({ type: "search", label: "State/Province" });
  }
  if (educationFormHas("education-history-city-text-input")) {
    fields.push({ type: "text", label: "City" });
  }
  if (educationFormHas("education-history-gpa-text-input")) {
    fields.push({ type: "text", label: "G.P.A." });
  }

  if (fields.length === 0) {
    return [
      { type: "text", label: "Degree", required: true },
      { type: "text", label: "Major" },
      { type: "date", label: "Start Date", description: "YYYY-MM-DD" },
      { type: "date", label: "End Date", description: "YYYY-MM-DD" },
      { type: "text", label: "School", required: true },
      { type: "search", label: "Country" },
      { type: "search", label: "State/Province" },
      { type: "text", label: "City" },
      { type: "text", label: "G.P.A." },
    ];
  }

  return fields;
};

const resolveEducationCount = (
  applicantData?: Applicant | null,
): number => {
  if (Array.isArray(applicantData?.education) && applicantData.education.length) {
    return Math.max(1, applicantData.education.length);
  }
  return Math.max(1, countDayforceHcmEducationRecords() || 1);
};

/**
 * Collect autofillable Dayforce (Ant Design) fields on the host page.
 * Resume file input is skipped (handled in prepareBeforeScan).
 */
export const collectDayforceHcmCandidateFields =
  (): DayforceHcmCandidateField[] => {
    const results: DayforceHcmCandidateField[] = [];
    const seen = new Set<string>();

    const add = (field: DayforceHcmCandidateField): void => {
      const key =
        field.element.getAttribute("id") ||
        `${field.label}:${field.kind}:${results.length}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(field);
    };

    const addSelect = (selectRoot: HTMLElement): void => {
      if (!isVisibleSelectRoot(selectRoot)) return;
      const input = getDayforceHcmComboboxInput(selectRoot);
      if (!input) return;
      add({
        element: input,
        selectRoot,
        label: getDayforceHcmFieldLabel(input),
        required: isDayforceHcmRequiredField(input),
        kind: "combobox",
      });
    };

    // Compact "Country dialing code" selects (home/mobile) — collect first.
    document
      .querySelectorAll<HTMLElement>(
        '.ant-select[aria-label="Country dialing code"], [test-id$="-phone-dropdown"], input[aria-label="Country dialing code"]',
      )
      .forEach((el) => {
        const root = el.classList.contains("ant-select")
          ? el
          : getDayforceHcmAntSelectRoot(el);
        if (root) addSelect(root);
      });

    document
      .querySelectorAll<HTMLElement>(".ant-select")
      .forEach((selectRoot) => {
        addSelect(selectRoot);
      });

    document
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      )
      .forEach((element) => {
        if (!isVisibleTextControl(element)) return;
        if (element instanceof HTMLInputElement) {
          const type = (element.type || "text").toLowerCase();
          if (SKIP_INPUT_TYPES.has(type)) return;
          const kind: DayforceHcmFieldKind =
            type === "date"
              ? "date"
              : element.closest(".ant-input-number")
                ? "number"
                : "text";
          add({
            element,
            label: getDayforceHcmFieldLabel(element),
            required: isDayforceHcmRequiredField(element),
            kind,
          });
          return;
        }

        add({
          element,
          label: getDayforceHcmFieldLabel(element),
          required: isDayforceHcmRequiredField(element),
          kind: "text",
        });
      });

    document
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((element) => {
        if (isInsideExtension(element)) return;
        if (!isInsideDayforceHcmEducation(element)) return;
        const wrapper =
          (element.closest(
            ".ant-checkbox-wrapper, .ant-form-item",
          ) as HTMLElement | null) ?? element;
        if (!isDisplayVisible(wrapper) && !element.isConnected) return;
        add({
          element,
          label: getDayforceHcmFieldLabel(element),
          required: isDayforceHcmRequiredField(element),
          kind: "checkbox",
        });
      });

    document.querySelectorAll<HTMLSelectElement>("select").forEach((element) => {
      if (!isVisibleTextControl(element)) return;
      add({
        element,
        label: getDayforceHcmFieldLabel(element),
        required: isDayforceHcmRequiredField(element),
        kind: "select",
      });
    });

    return results;
  };

/**
 * Scans the Dayforce HCM application form after resume parse.
 * Already-filled fields (from Dayforce's parser) are omitted so the AI
 * only answers remaining questions and does not overwrite parsed values.
 * Education is sent as a nested Workday-style group, not flat Country/City
 * labels that would collide with Personal Information.
 */
export const scanDayforceHcmHtmlToMakeApiPayload = async (
  options: DayforceHcmScanToMakeApiOptions = {},
): Promise<DayforceHcmScanToMakeApiPayload> => {
  const url = window.location.href;

  if (isDayforceHcmEducationSectionPresent()) {
    await ensureDayforceHcmEducationRecords(
      resolveEducationCount(options.applicantData),
    );
  }

  const candidates = collectDayforceHcmCandidateFields();
  const elements: ApiFormElement[] = [];

  if (isDayforceHcmEducationSectionPresent()) {
    elements.push({
      label: "Education",
      required: true,
      type: "education",
      count: resolveEducationCount(options.applicantData),
      options: buildDayforceHcmEducationSchema(),
    });
  }

  const remaining = candidates.filter((field) => {
    if (isRepeatableEducationFieldLabel(field.label)) return false;
    if (isInsideDayforceHcmEducation(field.element)) return false;
    return !isDayforceHcmFieldFilled(field);
  });

  for (const candidate of remaining) {
    if (
      candidate.kind === "text" ||
      candidate.kind === "date" ||
      candidate.kind === "number"
    ) {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: candidate.kind === "date" ? "date" : "text",
      });
      continue;
    }

    if (candidate.kind === "checkbox") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "checkbox",
        options: ["Yes", "No"],
      });
      continue;
    }

    if (candidate.kind === "select") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: getNativeSelectOptions(
          candidate.element as HTMLSelectElement,
        ),
      });
      continue;
    }

    const comboboxOptions = candidate.selectRoot
      ? await openAndScanDayforceHcmComboboxOptions(candidate.selectRoot).catch(
          () => [] as string[],
        )
      : [];
    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      ...(comboboxOptions.length > 0 ? { options: comboboxOptions } : {}),
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "dayforcehcm",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
