import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { Applicant } from "../data";
import { delay } from "../helper";
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

export interface UltiproScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface UltiproScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
  applicantData?: Applicant | null;
}

export type UltiproFieldKind =
  | "text"
  | "select"
  | "radio-group"
  | "date"
  | "numeric";

export interface UltiproCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: UltiproFieldKind;
}

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "password",
  "image",
  "checkbox",
]);

const PLACEHOLDER_OPTION_RE =
  /^(choose(\.\.\.)?|select|please select|select one|\u2014+|\u2013+|-+)$/i;

const APPLY_SECTION_SELECTOR = [
  "#ApplyContactSection",
  '[data-automation="contact-information-panel"]',
  '[data-automation="questions-panel"]',
  "#Questions",
  "#ApplicationQuestions",
  '[id^="Apply"][id$="Section"]',
  "[data-automation$='-panel']",
  '[data-automation="education-section"]',
  "collapsible-panel",
].join(", ");

const KO_TEMPLATE_STUB_SELECTOR =
  "#MultipleChoiceTemplate, #TextTemplate, #NumericTemplate";

/** Panels UKG fills from the resume — do not scan, payload, or AI-fill. */
const SKIPPED_PANEL_NAMES = new Set([
  "skills",
  "work experience",
  "experience",
]);

const SKIPPED_SECTION_SELECTOR = [
  "[data-automation='skills-panel']",
  "[data-automation='skill']",
  "[data-automation='proficiency-dropdown']",
  "[data-automation='work-experience-panel']",
  "[id^='NewWorkExperience_']",
].join(", ");

const EDUCATION_SECTION_SELECTOR = [
  '[data-automation="education-section"]',
  '[data-automation="education-panel"]',
].join(", ");

const EDUCATION_ITEM_SELECTOR =
  '[data-automation="education-section"] [data-automation="panel-list-item"], [data-automation="education-panel"] [data-automation="panel-list-item"]';

const ADD_EDUCATION_BUTTON_SELECTOR = [
  '[data-automation="education-section"] button[data-automation="primary-action-button"]',
  '[data-automation="education-panel"] button[data-automation="primary-action-button"]',
  'button[aria-label="Add Education"]',
  'button[aria-label="Add education"]',
].join(", ");

const cleanLabelText = (text: string): string =>
  text
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

export const isUltiproKoTemplateStub = (element: Element): boolean =>
  !!element.closest(KO_TEMPLATE_STUB_SELECTOR);

const normalizePanelName = (text: string): string =>
  text.replace(/\s+/g, " ").trim().toLowerCase();

const isSkippedPanelName = (text: string): boolean =>
  SKIPPED_PANEL_NAMES.has(normalizePanelName(text));

/** True when this node is a Skills / Work Experience panel. */
export const isUltiproSkippedPanelRoot = (element: Element): boolean => {
  const automation = element.getAttribute("data-automation") || "";
  if (
    automation === "skills-panel" ||
    automation === "work-experience-panel"
  ) {
    return true;
  }

  const aria = element.getAttribute("aria-label");
  if (aria && isSkippedPanelName(aria)) return true;

  const tag = element.tagName.toLowerCase();
  const isPanel =
    element.classList.contains("panel") ||
    tag === "collapsible-panel" ||
    element.getAttribute("role") === "region";
  if (!isPanel) return false;

  const title = element.querySelector(
    ":scope > .panel-heading [data-automation='panel-title'], :scope > * > .panel-heading [data-automation='panel-title']",
  );
  return !!(title && isSkippedPanelName(title.textContent ?? ""));
};

/** @deprecated Use isUltiproSkippedPanelRoot */
export const isUltiproSkillsRoot = isUltiproSkippedPanelRoot;

/**
 * Skills and Work Experience are parsed by UKG from the resume —
 * skip scan, payload, and fill for these sections. Education is filled
 * like Workday (nested group).
 */
export const isInsideUltiproSkippedSection = (element: Element): boolean => {
  if (element.closest(SKIPPED_SECTION_SELECTOR)) {
    return true;
  }

  const id = element.getAttribute("id") || "";
  if (id.startsWith("NewWorkExperience_")) {
    return true;
  }

  let current: Element | null = element;
  while (current) {
    if (isUltiproSkippedPanelRoot(current)) return true;
    current = current.parentElement;
  }

  return false;
};

export const isUltiproEducationSectionPresent = (): boolean =>
  !!document.querySelector(EDUCATION_SECTION_SELECTOR);

export const isInsideUltiproEducation = (element: Element): boolean => {
  if (element.closest(EDUCATION_SECTION_SELECTOR)) return true;
  const id = (element as HTMLElement).id || "";
  return id.startsWith("NewEducation_");
};

export const countUltiproEducationRecords = (): number =>
  document.querySelectorAll(EDUCATION_ITEM_SELECTOR).length;

/** 0-based education record index, or null when the control is not in Education. */
export const getUltiproEducationIndex = (
  element: Element,
): number | null => {
  const item = element.closest<HTMLElement>(
    '[data-automation="panel-list-item"]',
  );
  if (item && isInsideUltiproEducation(item)) {
    const aria = item.getAttribute("aria-label") || "";
    const fromAria = aria.match(/education\s*(\d+)/i);
    if (fromAria) return Number(fromAria[1]) - 1;

    const section = item.closest(EDUCATION_SECTION_SELECTOR);
    if (section) {
      const items = Array.from(
        section.querySelectorAll<HTMLElement>(
          '[data-automation="panel-list-item"]',
        ),
      );
      const idx = items.indexOf(item);
      if (idx >= 0) return idx;
    }
  }

  const id = (element as HTMLElement).id || "";
  const fromId = id.match(/NewEducation_[A-Za-z]+(\d+)$/i);
  if (fromId) return Number(fromId[1]);

  if (isInsideUltiproEducation(element)) return 0;
  return null;
};

export const withUltiproEducationLabel = (
  baseLabel: string,
  element: Element,
): string => {
  const base = cleanLabelText(baseLabel);
  if (!base) return base;
  if (/^Education\s*\d+\s*-/i.test(base)) return base;
  const idx = getUltiproEducationIndex(element);
  if (idx == null) return base;
  return `Education ${idx + 1} - ${base}`;
};

export const isRepeatableEducationFieldLabel = (label: string): boolean =>
  /^education\s*\d+\s*-/i.test(label.trim());

const expandUltiproEducationSection = async (): Promise<void> => {
  const section = document.querySelector<HTMLElement>(
    EDUCATION_SECTION_SELECTOR,
  );
  if (!section) return;

  const toggle =
    section.querySelector<HTMLElement>(
      '[data-automation="expand-toggle"] [aria-expanded], [data-automation="expand-toggle"]',
    ) ||
    section.querySelector<HTMLElement>(
      ".collapse-indicator[aria-expanded]",
    );
  if (!toggle) return;
  if (toggle.getAttribute("aria-expanded") === "false") {
    toggle.click();
    await delay(400);
  }
};

/**
 * Click "Add Education" until `needed` education rows exist.
 * Mirrors Workday ensureWorkdayEntryPanels / Dayforce education records.
 */
export const ensureUltiproEducationRecords = async (
  needed: number,
): Promise<void> => {
  if (!isUltiproEducationSectionPresent()) return;
  if (!needed || needed < 1) return;

  await expandUltiproEducationSection();

  const findAdd = (): HTMLButtonElement | null =>
    document.querySelector<HTMLButtonElement>(ADD_EDUCATION_BUTTON_SELECTOR);

  let current = countUltiproEducationRecords();
  if (current === 0) {
    const add = findAdd();
    if (add) {
      add.click();
      await delay(600);
      current = countUltiproEducationRecords();
    }
  }

  let guard = 0;
  while (current < needed && guard < 20) {
    const add = findAdd();
    if (!add) break;
    add.click();
    await delay(700);
    const next = countUltiproEducationRecords();
    if (next <= current) {
      await delay(500);
    }
    current = countUltiproEducationRecords();
    guard += 1;
  }
};

/** Expand Education rows from applicant profile before scan. */
export const prepareUltiproEducationRecords = async (
  applicantData: Applicant | null | undefined,
): Promise<void> => {
  if (!isUltiproEducationSectionPresent()) return;
  const eduCount = Array.isArray(applicantData?.education)
    ? applicantData!.education!.length
    : 0;
  if (eduCount > 0) {
    await ensureUltiproEducationRecords(eduCount);
  }
};

const educationFormHas = (automation: string): boolean =>
  !!document.querySelector(
    `${EDUCATION_ITEM_SELECTOR} [data-automation="${automation}"]`,
  );

const resolveEducationCount = (
  applicantData?: Applicant | null,
): number => {
  if (
    Array.isArray(applicantData?.education) &&
    applicantData.education.length
  ) {
    return Math.max(1, applicantData.education.length);
  }
  return Math.max(1, countUltiproEducationRecords() || 1);
};

/**
 * Nested Education schema for the AI API (Workday-style group).
 * Labels match UKG form titles so fill can prefix "Education N -".
 */
const buildUltiproEducationSchema = (): AiNestedFieldSchema[] => {
  const fields: AiNestedFieldSchema[] = [];
  const first =
    document.querySelector<HTMLElement>(EDUCATION_ITEM_SELECTOR) ??
    document.querySelector<HTMLElement>(EDUCATION_SECTION_SELECTOR);
  if (!first) return fields;

  if (educationFormHas("school-textbox")) {
    fields.push({ type: "text", label: "School Name", required: true });
  }
  if (educationFormHas("degree-textbox")) {
    fields.push({
      type: "text",
      label: "Level of Education / Degree",
      required: true,
    });
  }
  if (educationFormHas("major-dropdown")) {
    const major = first.querySelector<HTMLSelectElement>(
      '[data-automation="major-dropdown"]',
    );
    fields.push({
      type: "search",
      label: "Major",
      ...(major ? { options: getUltiproNativeSelectOptions(major) } : {}),
    });
  }
  if (educationFormHas("minor-dropdown")) {
    const minor = first.querySelector<HTMLSelectElement>(
      '[data-automation="minor-dropdown"]',
    );
    fields.push({
      type: "search",
      label: "Minor",
      ...(minor ? { options: getUltiproNativeSelectOptions(minor) } : {}),
    });
  }
  if (
    educationFormHas("from-month-dropdown") ||
    educationFormHas("from-year-textbox")
  ) {
    fields.push({
      type: "date",
      label: "From",
      description: "MM/YYYY",
    });
  }
  if (
    educationFormHas("to-month-dropdown") ||
    educationFormHas("to-year-textbox")
  ) {
    fields.push({
      type: "date",
      label: "To",
      description: "MM/YYYY",
    });
  }
  if (educationFormHas("description-textarea")) {
    fields.push({ type: "text", label: "Description" });
  }

  if (fields.length === 0) {
    return [
      { type: "text", label: "School Name", required: true },
      { type: "text", label: "Level of Education / Degree", required: true },
      { type: "search", label: "Major" },
      { type: "search", label: "Minor" },
      { type: "date", label: "From", description: "MM/YYYY" },
      { type: "date", label: "To", description: "MM/YYYY" },
      { type: "text", label: "Description" },
    ];
  }

  return fields;
};

/** @deprecated Use isInsideUltiproSkippedSection */
export const isInsideUltiproSkillsSection = isInsideUltiproSkippedSection;

/**
 * UKG / Ultipro apply containers. Contact Information and Questions are
 * sibling panels; collect from each so later sections can be added the same way.
 */
export const getUltiproScanRoots = (): HTMLElement[] => {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>(APPLY_SECTION_SELECTOR),
  ).filter(
    (el) =>
      !isInsideExtension(el) &&
      !isUltiproSkippedPanelRoot(el) &&
      !isInsideUltiproSkippedSection(el),
  );

  const roots = sections.filter(
    (el) => !sections.some((other) => other !== el && other.contains(el)),
  );

  if (roots.length) return roots;

  const form = document.querySelector<HTMLElement>(
    "#ApplyContactSection form, form[novalidate]",
  );
  if (form && !isInsideExtension(form)) return [form];

  return [document.body];
};

export const getUltiproFormRoot = (): HTMLElement => {
  const roots = getUltiproScanRoots();
  if (roots.length === 1) return roots[0];

  const applyHost = document.querySelector<HTMLElement>(
    "#OpportunityApply, [data-automation='opportunity-apply'], #apply-container",
  );
  if (applyHost && !isInsideExtension(applyHost)) return applyHost;

  return roots[0] ?? document.body;
};

const getLabelOwnText = (label: Element): string => {
  const clone = label.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "select, input, textarea, script, style, .help-block, .numeric-response-help, ukg-tooltip, ukg-button, ukg-icon, ukg-input, ukg-input-container, react-ko-bridge, react-ko-es6-bridge",
    )
    .forEach((node) => node.remove());
  return cleanLabelText(clone.textContent ?? "");
};

const getAssociatedLabel = (element: HTMLElement): HTMLLabelElement | null => {
  const id = element.getAttribute("id");
  if (id) {
    const byFor = document.querySelector<HTMLLabelElement>(
      `label[for="${CSS.escape(id)}"]`,
    );
    if (byFor) return byFor;
  }

  const parentLabel = element.closest("label");
  if (parentLabel instanceof HTMLLabelElement) {
    if (parentLabel.querySelector("input[type='radio']") === element) {
      return null;
    }
    return parentLabel;
  }

  return null;
};

export const getUltiproFieldLabel = (element: HTMLElement): string => {
  const associated = getAssociatedLabel(element);
  if (associated) {
    const fromLabel = getLabelOwnText(associated);
    if (fromLabel) return fromLabel;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.toLowerCase() !== "date input") {
    return cleanLabelText(ariaLabel);
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl) {
      const fromId = getLabelOwnText(labelEl);
      if (fromId) return fromId;
    }
  }

  const wrapper = element.closest(
    ".form-group, [data-automation='available-start-date-datepicker']",
  ) as HTMLElement | null;
  const wrapperLabel = wrapper?.querySelector(
    ":scope > label, .control-label, .label-with-icon, [data-automation='question-title'], [data-automation='start-date-label']",
  );
  if (wrapperLabel && !wrapperLabel.contains(element)) {
    const fromWrapper = getLabelOwnText(wrapperLabel);
    if (fromWrapper) return fromWrapper;
  }

  const startDateLabel = document.querySelector<HTMLLabelElement>(
    "label[data-automation='start-date-label'], label[for='ApplicationAvailableStartDateInput']",
  );
  if (
    startDateLabel &&
    (element.closest("[data-automation='available-start-date-datepicker']") ||
      element.closest("ukg-input[type='date']") ||
      element.getAttribute("data-automation") === "ukg-datepicker-input")
  ) {
    const fromStart = getLabelOwnText(startDateLabel);
    if (fromStart) return fromStart;
  }

  return (
    element.getAttribute("name") ||
    element.getAttribute("id") ||
    "Unknown field"
  );
};

const isDisabledField = (element: HTMLElement): boolean =>
  element.hasAttribute("disabled") ||
  element.getAttribute("aria-disabled") === "true";

const isReadOnlyField = (element: HTMLElement): boolean => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.readOnly || element.hasAttribute("readonly");
  }
  return false;
};

export const isUltiproCountryField = (element: HTMLElement): boolean => {
  const id = (element.getAttribute("id") || "").toLowerCase();
  if (id === "country") return true;
  return (
    getUltiproFieldLabel(element).replace(/[^a-z]/gi, "").toLowerCase() ===
    "country"
  );
};

export const isUltiproStateField = (element: HTMLElement): boolean => {
  const id = (element.getAttribute("id") || "").toLowerCase();
  if (id === "state") return true;
  const compact = getUltiproFieldLabel(element)
    .replace(/[^a-z]/gi, "")
    .toLowerCase();
  return compact.includes("state") || compact.includes("province");
};

const ADDRESS_FIELD_IDS = new Set([
  "addressline1",
  "addressline2",
  "city",
  "postalcode",
]);

/** Address lines stay collapsed until Country is chosen. */
export const isUltiproAddressField = (element: HTMLElement): boolean => {
  const id = (element.getAttribute("id") || "").toLowerCase();
  if (ADDRESS_FIELD_IDS.has(id)) return true;
  const automation = (element.getAttribute("data-automation") || "").toLowerCase();
  return (
    automation === "address-line1-textbox" ||
    automation === "address-line2-textbox" ||
    automation === "city-textbox" ||
    automation === "postal-code-textbox"
  );
};

export const isUltiproReferralDetailField = (element: HTMLElement): boolean => {
  const id = (element.getAttribute("id") || "").toLowerCase();
  return (
    id === "referralname" ||
    id === "referralemail" ||
    id === "referralphone"
  );
};

export const isVisibleUltiproElement = (element: HTMLElement): boolean => {
  if (isDisabledField(element) || isReadOnlyField(element)) return false;
  if (element.closest(".visually-hidden, .sr-only, [hidden]")) return false;

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  let parent: HTMLElement | null = element.parentElement;
  while (parent && parent !== document.body) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === "none" || parentStyle.visibility === "hidden") {
      return false;
    }
    parent = parent.parentElement;
  }

  return true;
};

export const isRequiredUltiproField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.getAttribute("required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const associated = getAssociatedLabel(element);
  if (
    associated?.classList.contains("required") ||
    associated?.querySelector(".required") ||
    associated?.textContent?.includes("*")
  ) {
    return true;
  }

  const wrapper = element.closest(".form-group");
  const wrapperLabel = wrapper?.querySelector(
    ":scope > label, .control-label, .label-with-icon, [data-automation='question-title']",
  );
  if (
    wrapperLabel?.classList.contains("required") ||
    wrapperLabel?.querySelector(".required") ||
    wrapperLabel?.textContent?.includes("*")
  ) {
    return true;
  }

  return false;
};

const isPlaceholderOption = (label: string): boolean => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return true;
  return PLACEHOLDER_OPTION_RE.test(cleaned);
};

export const getUltiproNativeSelectOptions = (
  select: HTMLSelectElement,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.label ?? opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const getChoiceGroupWrapper = (control: HTMLInputElement): HTMLElement =>
  (control.closest(
    ".form-group[role='radiogroup'], [role='radiogroup'], .form-group, [data-automation='employee-referral'], [data-automation='copy-applicants-consent-question'], [data-automation='application-knockout-question']",
  ) as HTMLElement | null) ||
  control.parentElement ||
  control;

export const getUltiproRadioChoiceLabel = (input: HTMLInputElement): string => {
  const wrappingLabel = input.closest("label");
  if (wrappingLabel) {
    const text = getLabelOwnText(wrappingLabel);
    if (text) return text;
  }

  const radioText = input
    .closest(".radio, label.radio")
    ?.querySelector(".radio-text, span");
  if (radioText) {
    const text = cleanLabelText(radioText.textContent ?? "");
    if (text) return text;
  }

  return cleanLabelText(input.value || input.getAttribute("aria-label") || "");
};

const getChoiceGroupLabel = (
  wrapper: HTMLElement,
  control: HTMLInputElement,
): string => {
  const groupLabel = wrapper.querySelector(
    ":scope > label.control-label, :scope > .control-label, [data-automation='question-title'], [data-automation='employee-referral-label'], [data-automation='copy-applicants-consent-label']",
  );
  if (groupLabel && !groupLabel.contains(control)) {
    const text = getLabelOwnText(groupLabel);
    if (text) return text;
  }

  const labelledBy = wrapper.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl) {
      const text = getLabelOwnText(labelEl);
      if (text) return text;
    }
  }

  return getUltiproFieldLabel(wrapper);
};

export const getUltiproRadioGroupOptions = (
  wrapper: HTMLElement,
  name: string,
): string[] => {
  const radios = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  ).filter((radio) => {
    if (isUltiproKoTemplateStub(radio)) return false;
    if (!name) return true;
    return (radio.getAttribute("name") || "") === name;
  });

  const options: string[] = [];
  const seen = new Set<string>();
  radios.forEach((radio) => {
    const label = getUltiproRadioChoiceLabel(radio);
    if (!label || seen.has(label)) return;
    seen.add(label);
    options.push(label);
  });
  return options;
};

const isNumericResponseInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) return false;
  const automation = element.getAttribute("data-automation") || "";
  const id = element.getAttribute("id") || "";
  return (
    automation === "numeric-response" ||
    /^NumericResponse\d+$/i.test(id)
  );
};

const findUkgDatePickers = (root: HTMLElement): HTMLElement[] => {
  const pickers = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-automation='available-start-date-datepicker'], ukg-input[type='date'], [data-automation='ukg-datepicker-input']",
    ),
  );

  return pickers.filter((el, index, list) => {
    if (
      isInsideExtension(el) ||
      isUltiproKoTemplateStub(el) ||
      isInsideUltiproSkippedSection(el)
    ) {
      return false;
    }
    return !list.some((other, otherIndex) => otherIndex !== index && other.contains(el));
  });
};

const collectFromRoot = (
  root: HTMLElement,
  results: UltiproCandidateField[],
  seenIds: Set<string>,
): void => {
  const candidates = root.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );

  candidates.forEach((element) => {
    if (
      isInsideExtension(element) ||
      isUltiproKoTemplateStub(element) ||
      isInsideUltiproSkippedSection(element)
    ) {
      return;
    }

    const includeHiddenDependent =
      (element instanceof HTMLSelectElement && isUltiproStateField(element)) ||
      isUltiproReferralDetailField(element) ||
      isUltiproAddressField(element);

    if (!includeHiddenDependent && !isVisibleUltiproElement(element)) {
      return;
    }
    if (
      includeHiddenDependent &&
      (isDisabledField(element) || isReadOnlyField(element))
    ) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();

      if (type === "radio") {
        const name =
          element.getAttribute("name") ||
          element.getAttribute("id") ||
          "";
        const key = `radio:${name || results.length}`;
        if (seenIds.has(key)) return;
        seenIds.add(key);

        const wrapper = getChoiceGroupWrapper(element);
        const label = withUltiproEducationLabel(
          getChoiceGroupLabel(wrapper, element),
          element,
        );
        if (!label) return;

        results.push({
          element: wrapper,
          label,
          required: isRequiredUltiproField(wrapper) || isRequiredUltiproField(element),
          kind: "radio-group",
        });
        return;
      }

      if (SKIP_INPUT_TYPES.has(type)) return;
    }

    const eduIdx = getUltiproEducationIndex(element);
    const automation = element.getAttribute("data-automation") || "";
    const id =
      element.getAttribute("id") ||
      (eduIdx != null
        ? `edu:${eduIdx}:${automation || element.getAttribute("name") || results.length}`
        : element.getAttribute("name") || `${results.length}`);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const label = withUltiproEducationLabel(
      getUltiproFieldLabel(element),
      element,
    );
    if (!label) return;

    if (element instanceof HTMLSelectElement) {
      results.push({
        element,
        label,
        required: isRequiredUltiproField(element),
        kind: "select",
      });
      return;
    }

    if (isNumericResponseInput(element)) {
      results.push({
        element,
        label,
        required: isRequiredUltiproField(element),
        kind: "numeric",
      });
      return;
    }

    results.push({
      element,
      label,
      required: isRequiredUltiproField(element),
      kind: "text",
    });
  });

  findUkgDatePickers(root).forEach((picker) => {
    if (!isVisibleUltiproElement(picker) && picker.tagName !== "UKG-INPUT") {
      const host = picker.closest(".form-group") as HTMLElement | null;
      if (host && !isVisibleUltiproElement(host)) return;
    }

    const key = `date:${picker.getAttribute("id") || picker.getAttribute("data-automation") || results.length}`;
    if (seenIds.has(key)) return;
    seenIds.add(key);

    const label = withUltiproEducationLabel(
      getUltiproFieldLabel(picker),
      picker,
    );
    const requiredLabel = picker
      .closest(".form-group")
      ?.querySelector("label.required, .control-label.required");
    results.push({
      element: picker,
      label,
      required: isRequiredUltiproField(picker) || !!requiredLabel,
      kind: "date",
    });
  });
};

export const collectUltiproCandidateFields = (): UltiproCandidateField[] => {
  const results: UltiproCandidateField[] = [];
  const seenIds = new Set<string>();

  getUltiproScanRoots().forEach((root) => {
    collectFromRoot(root, results, seenIds);
  });

  document
    .querySelectorAll<HTMLElement>(EDUCATION_SECTION_SELECTOR)
    .forEach((section) => {
      collectFromRoot(section, results, seenIds);
    });

  return results;
};

/**
 * Scans UKG / Ultipro apply panels (Contact Information + Questions) and
 * builds an API payload with labels, required flags, types, and options.
 * Education is sent as a nested Workday-style group.
 */
export const scanUltiproHtmlToMakeApiPayload = async (
  options: UltiproScanToMakeApiOptions = {},
): Promise<UltiproScanToMakeApiPayload> => {
  const url = window.location.href;

  if (isUltiproEducationSectionPresent()) {
    await ensureUltiproEducationRecords(
      resolveEducationCount(options.applicantData),
    );
  }

  const candidates = collectUltiproCandidateFields();
  const elements: ApiFormElement[] = [];

  if (isUltiproEducationSectionPresent()) {
    elements.push({
      label: "Education",
      required: true,
      type: "education",
      count: resolveEducationCount(options.applicantData),
      options: buildUltiproEducationSchema(),
    });
  }

  const remaining = candidates.filter((field) => {
    if (isRepeatableEducationFieldLabel(field.label)) return false;
    if (isInsideUltiproEducation(field.element)) return false;
    return true;
  });

  for (const candidate of remaining) {
    if (candidate.kind === "select") {
      const selectOptions = getUltiproNativeSelectOptions(
        candidate.element as HTMLSelectElement,
      );
      const isDependentState = isUltiproStateField(candidate.element);
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        ...(selectOptions.length > 0 ? { options: selectOptions } : {}),
        ...(isDependentState && selectOptions.length === 0
          ? {
              description:
                "State / Province options load after Country is selected",
            }
          : {}),
      });
      continue;
    }

    if (candidate.kind === "radio-group") {
      const firstRadio = candidate.element.querySelector<HTMLInputElement>(
        "input[type='radio']",
      );
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: getUltiproRadioGroupOptions(
          candidate.element,
          firstRadio?.getAttribute("name") || "",
        ),
      });
      continue;
    }

    if (candidate.kind === "date") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "date",
        description: "MM/DD/YYYY",
      });
      continue;
    }

    if (candidate.kind === "numeric") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "text",
        description: "Please enter a whole number.",
      });
      continue;
    }

    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "text",
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "ultipro",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
