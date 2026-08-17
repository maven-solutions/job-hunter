import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface AmazonScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface AmazonScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
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

export type AmazonFieldKind =
  | "text"
  | "select"
  | "select2"
  | "phone-country"
  | "radio-group"
  | "date";

export interface AmazonCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: AmazonFieldKind;
}

export const cleanAmazonLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/auto-save unavailable for this section/gi, "")
    .replace(/\s*Date:\s*Year-Month-Day\s*/gi, " ")
    .replace(/^Question\s+/i, "")
    .replace(/\s+required\s*$/i, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isAmazonDateInput = (
  element: HTMLElement,
): element is HTMLInputElement =>
  element instanceof HTMLInputElement &&
  (!!element.closest(".application-date-field") ||
    (element.getAttribute("data-provide") ?? "").toLowerCase().includes(
      "datepicker",
    ) ||
    /yyyy-mm/i.test(element.getAttribute("placeholder") ?? ""));

export const isAmazonEducationLevelField = (
  element: HTMLElement,
  label: string = "",
): boolean => {
  if (/^education level$/i.test(label.trim())) return true;
  const questionId =
    element.closest("[data-questionid]")?.getAttribute("data-questionid") ??
    "";
  return /HIGHEST_DEGREE/i.test(questionId);
};

export const isAmazonCurrentlyStudentField = (
  element: HTMLElement,
  label: string = "",
): boolean => {
  if (/currently a student/i.test(label)) return true;
  const questionId =
    element.closest("[data-questionid]")?.getAttribute("data-questionid") ??
    "";
  return /CURRENTLY_A_STUDENT/i.test(questionId);
};

const amazonLabelKey = (label: string): string =>
  cleanAmazonLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

/** Native <select> that Select2 hides and drives from its UI. */
export const isAmazonSelect2NativeSelect = (
  element: HTMLElement,
): element is HTMLSelectElement =>
  element instanceof HTMLSelectElement &&
  (element.classList.contains("select2-hidden-accessible") ||
    element.classList.contains("country") ||
    element.classList.contains("state-province") ||
    !!element
      .closest(".country-dropdown, .form-group")
      ?.querySelector(".select2-container"));

const isDisplayed = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

/**
 * Contact (and later sections) live in tab panels. Only scan the active /
 * visible panel so hidden steps are not sent to the API.
 */
const isInScannableSection = (element: HTMLElement): boolean => {
  const panel = element.closest<HTMLElement>(
    ".question-form, [role='tabpanel']",
  );
  if (!panel) return true;
  if (panel.classList.contains("active")) return true;
  if (panel.getAttribute("aria-hidden") === "true") return false;
  if (panel.classList.contains("collapse") && !panel.classList.contains("show")) {
    return false;
  }
  return isDisplayed(panel);
};

const isVisibleAmazonField = (element: HTMLElement): boolean => {
  if (isAmazonSelect2NativeSelect(element) || isAmazonDateInput(element)) {
    return isInScannableSection(element);
  }

  if (element.closest(".visually-hidden, .sr-only, [aria-hidden='true']")) {
    return false;
  }
  if (element.classList.contains("iti__search-input")) {
    return false;
  }
  if (element.classList.contains("select2-search__field")) {
    return false;
  }
  if (!isInScannableSection(element)) {
    return false;
  }
  return isDisplayed(element);
};

const QUESTION_LABEL_SELECTOR =
  ".question-label label.text-tooltip-label, .question-label label[id$='-label'], .question-label label";

const getAmazonQuestionLabel = (element: HTMLElement): string => {
  const question = element.closest<HTMLElement>(
    ".question[data-questionid], .form-group",
  );
  const questionLabel = question?.querySelector<HTMLElement>(
    QUESTION_LABEL_SELECTOR,
  );
  if (questionLabel?.textContent) {
    return cleanAmazonLabelText(questionLabel.textContent);
  }
  return "";
};

export const getAmazonFieldLabel = (element: HTMLElement): string => {
  if (isAmazonDateInput(element)) {
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
      const cleaned = cleanAmazonLabelText(ariaLabel);
      if (cleaned) return cleaned;
    }
  }

  const questionLabel = getAmazonQuestionLabel(element);
  if (questionLabel) {
    return questionLabel;
  }

  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanAmazonLabelText(label.textContent);
    }
  }

  const wrapperLabel = element
    .closest(
      ".text-field, .phone-number, .country-dropdown, .drop-down-menu, .form-group, .contact-information",
    )
    ?.querySelector("label");
  if (wrapperLabel?.textContent) {
    const cleaned = cleanAmazonLabelText(wrapperLabel.textContent);
    if (cleaned) return cleaned;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return cleanAmazonLabelText(ariaLabel);
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanAmazonLabelText(labelEl.textContent);
    }
  }

  return id ?? "Unknown field";
};

export const isAmazonRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required") ||
    element.classList.contains("required")
  ) {
    return true;
  }

  const questionLabel = element
    .closest(".question[data-questionid], .form-group")
    ?.querySelector(".question-label");
  if (questionLabel?.classList.contains("required")) {
    return true;
  }
  if (questionLabel?.textContent?.toLowerCase().includes("required")) {
    return true;
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const host = element
      .closest(".form-group, .drop-down-menu")
      ?.querySelector("[aria-required='true'], [aria-required=true]");
    if (host) return true;
  }

  const select2Required = element
    .closest(".form-group, .drop-down-menu")
    ?.querySelector(".select2-selection[aria-required='true']");
  if (select2Required) {
    return true;
  }

  const label =
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) ||
    element
      .closest(".text-field, .phone-number, .country-dropdown, .form-group")
      ?.querySelector("label");

  if (label?.classList.contains("required")) {
    return true;
  }
  if (label?.textContent?.includes("*")) {
    return true;
  }

  return false;
};

const isPlaceholderOption = (label: string, value: string): boolean => {
  if (!label) return true;
  if (!value && /select|choose|available|---/i.test(label)) return true;
  if (/^select a /i.test(label)) return true;
  if (/no states\/provinces available/i.test(label)) return true;
  return false;
};

export const getAmazonNativeSelectOptions = (
  select: HTMLSelectElement,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanAmazonLabelText(opt.textContent ?? opt.value);
    if (isPlaceholderOption(label, opt.value)) return;
    if (seen.has(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

export const getAmazonRadioOptionLabel = (
  radio: HTMLInputElement,
): string => {
  if (radio.id) {
    const label = document.querySelector(`label[for="${CSS.escape(radio.id)}"]`);
    if (label?.textContent) {
      return cleanAmazonLabelText(label.textContent);
    }
  }

  const sibling = radio
    .closest(".custom-radio, .custom-control")
    ?.querySelector("label");
  if (sibling?.textContent) {
    return cleanAmazonLabelText(sibling.textContent);
  }

  return cleanAmazonLabelText(radio.value || "");
};

export const getAmazonRadioOptions = (group: HTMLElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  group
    .querySelectorAll<HTMLInputElement>("input[type='radio']")
    .forEach((radio) => {
      const label = getAmazonRadioOptionLabel(radio);
      if (!label || seen.has(label)) return;
      seen.add(label);
      options.push(label);
    });

  return options;
};

export const extractAmazonPhoneCountryCodeOptions = (
  root: ParentNode = document,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  root
    .querySelectorAll<HTMLElement>(".iti__country-list .iti__country")
    .forEach((item) => {
      const name = cleanAmazonLabelText(
        item.querySelector(".iti__country-name")?.textContent ?? "",
      );
      const dial = cleanAmazonLabelText(
        item.querySelector(".iti__dial-code")?.textContent ?? "",
      );
      if (!name || !dial) return;

      const label = `${name} ${dial}`;
      if (seen.has(label)) return;
      seen.add(label);
      options.push(label);
    });

  return options;
};

const isReadonlyInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) return false;
  return (
    element.readOnly ||
    element.getAttribute("aria-readonly") === "true" ||
    element.hasAttribute("readonly")
  );
};

/**
 * Completed Amazon sections overlay a cover that intercepts clicks.
 * Click Edit so scan/fill can reach the live fields.
 */
export const ensureAmazonSectionEditable = async (): Promise<void> => {
  const panels = document.querySelectorAll<HTMLElement>(
    ".question-form.active, [role='tabpanel'].active",
  );

  for (const panel of Array.from(panels)) {
    const cover = panel.querySelector<HTMLElement>(".completed-form-cover");
    if (!cover) continue;

    const style = window.getComputedStyle(cover);
    const blocking =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      cover.getBoundingClientRect().height > 0;
    if (!blocking) continue;

    const editBtn = panel.querySelector<HTMLElement>(
      "a.btn-edit, button.btn-edit, [aria-label*='Edit' i]",
    );
    if (!editBtn) continue;
    editBtn.click();
    await delay(350);
  }
};

export const collectAmazonCandidateFields = (): AmazonCandidateField[] => {
  const candidates = document.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );
  const results: AmazonCandidateField[] = [];
  const seenIds = new Set<string>();

  candidates.forEach((element) => {
    if (isInsideExtension(element) || !isVisibleAmazonField(element)) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) {
        return;
      }
      if (isReadonlyInput(element)) {
        return;
      }
      if (
        element.tabIndex === -1 &&
        element.getAttribute("aria-hidden") === "true"
      ) {
        return;
      }
    }

    const label = getAmazonFieldLabel(element);
    const id =
      element.getAttribute("id") ||
      element.getAttribute("name") ||
      (isAmazonDateInput(element) ? `date:${amazonLabelKey(label)}` : "") ||
      `${label}-${results.length}`;
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);

    if (element instanceof HTMLSelectElement) {
      results.push({
        element,
        label: getAmazonFieldLabel(element),
        required: isAmazonRequiredField(element),
        kind: isAmazonSelect2NativeSelect(element) ? "select2" : "select",
      });
      return;
    }

    if (isAmazonDateInput(element)) {
      results.push({
        element,
        label: getAmazonFieldLabel(element),
        required: isAmazonRequiredField(element),
        kind: "date",
      });
      return;
    }

    results.push({
      element,
      label: getAmazonFieldLabel(element),
      required: isAmazonRequiredField(element),
      kind: "text",
    });
  });

  document
    .querySelectorAll<HTMLElement>("[role='radiogroup'], .radio-field")
    .forEach((group) => {
      if (isInsideExtension(group) || !isInScannableSection(group)) {
        return;
      }
      if (!isDisplayed(group) && group.getAttribute("role") !== "radiogroup") {
        return;
      }

      const radios = Array.from(
        group.querySelectorAll<HTMLInputElement>("input[type='radio']"),
      );
      if (radios.length === 0) return;

      const name =
        radios[0].getAttribute("name") ||
        group.getAttribute("aria-labelledby") ||
        `radio-${results.length}`;
      const id = `radio:${name}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);

      results.push({
        element: group,
        label: getAmazonFieldLabel(group),
        required:
          isAmazonRequiredField(group) || isAmazonRequiredField(radios[0]),
        kind: "radio-group",
      });
    });

  document
    .querySelectorAll<HTMLInputElement>(
      ".application-date-field input, input[data-provide*='datepicker']",
    )
    .forEach((input) => {
      if (isInsideExtension(input) || !isInScannableSection(input)) {
        return;
      }
      const label = getAmazonFieldLabel(input);
      const id = input.id || `date:${amazonLabelKey(label)}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);
      results.push({
        element: input,
        label,
        required: isAmazonRequiredField(input),
        kind: "date",
      });
    });

  const phoneRoot =
    document.querySelector<HTMLElement>(
      "#CONTACT_DETAILS .phone-number, .contact-information .phone-number, .phone-number",
    ) ?? document.body;

  if (phoneRoot.querySelector(".iti__country-list")) {
    const phoneInput =
      phoneRoot.querySelector<HTMLElement>(
        "input[type='tel'], #applicant_primary_phone_number",
      ) ?? phoneRoot;
    results.push({
      element: phoneInput,
      label: "Phone Country Code",
      required: true,
      kind: "phone-country",
    });
  }

  return results;
};

/** Follow-ups that Amazon mounts after Education level is chosen. */
const EDUCATION_FOLLOW_UP_ELEMENTS: ApiFormElement[] = [
  { label: "School name", required: false, type: "search" },
  { label: "Area(s) of study", required: false, type: "text" },
  {
    label: "Are you currently a student?",
    required: true,
    type: "search",
    options: ["Yes", "No"],
  },
  {
    label: "When did you graduate?",
    required: true,
    type: "search",
    options: [
      "Less than 1 year ago",
      "1–2 years ago",
      "2–3 years ago",
      "More than 3 years ago",
    ],
  },
  { label: "Expected graduation date", required: false, type: "text" },
  {
    label: "Have you had relevant non-internship professional experience?",
    required: true,
    type: "search",
    options: ["Yes", "No"],
  },
];

const mergeAmazonEducationFollowUps = (
  elements: ApiFormElement[],
): ApiFormElement[] => {
  const hasEducationLevel = elements.some((item) =>
    /^education level$/i.test(item.label.trim()),
  );
  if (!hasEducationLevel) return elements;

  const existing = new Set(elements.map((item) => amazonLabelKey(item.label)));
  const extras = EDUCATION_FOLLOW_UP_ELEMENTS.filter(
    (item) => !existing.has(amazonLabelKey(item.label)),
  );
  return extras.length > 0 ? [...elements, ...extras] : elements;
};

/**
 * Scans the amazon.jobs application form (the visible section, e.g.
 * Contact information or General questions) and builds an API payload.
 */
export const scanAmazonHtmlToMakeApiPayload = async (
  options: AmazonScanToMakeApiOptions = {},
): Promise<AmazonScanToMakeApiPayload> => {
  await ensureAmazonSectionEditable();
  await delay(50);

  const url = window.location.href;
  const candidates = collectAmazonCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "text" || candidate.kind === "date") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "text",
      });
      continue;
    }

    if (candidate.kind === "phone-country") {
      const phoneRoot =
        candidate.element.closest(".phone-number") ?? document;
      const phoneOptions = extractAmazonPhoneCountryCodeOptions(phoneRoot);
      elements.push({
        label: "Phone Country Code",
        required: candidate.required,
        type: "search",
        ...(phoneOptions.length > 0 ? { options: phoneOptions } : {}),
      });
      continue;
    }

    if (
      candidate.kind === "select" ||
      candidate.kind === "select2" ||
      candidate.kind === "radio-group"
    ) {
      const selectOptions =
        candidate.kind === "radio-group"
          ? getAmazonRadioOptions(candidate.element)
          : getAmazonNativeSelectOptions(candidate.element as HTMLSelectElement);
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        ...(selectOptions.length > 0 ? { options: selectOptions } : {}),
      });
    }
  }

  return {
    elements: mergeAmazonEducationFollowUps(elements),
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "amazon",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
