import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType = "text" | "search" | "date";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
  description?: string;
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
  "collapsible-panel",
].join(", ");

const KO_TEMPLATE_STUB_SELECTOR =
  "#MultipleChoiceTemplate, #TextTemplate, #NumericTemplate";

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

/**
 * UKG / Ultipro apply containers. Contact Information and Questions are
 * sibling panels; collect from each so later sections can be added the same way.
 */
export const getUltiproScanRoots = (): HTMLElement[] => {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>(APPLY_SECTION_SELECTOR),
  ).filter((el) => !isInsideExtension(el));

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
    if (isInsideExtension(el) || isUltiproKoTemplateStub(el)) return false;
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
    if (isInsideExtension(element) || isUltiproKoTemplateStub(element)) {
      return;
    }

    const includeHiddenDependent =
      (element instanceof HTMLSelectElement && isUltiproStateField(element)) ||
      isUltiproReferralDetailField(element);

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
        const label = getChoiceGroupLabel(wrapper, element);
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

    const id =
      element.getAttribute("id") ||
      element.getAttribute("name") ||
      `${results.length}`;
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const label = getUltiproFieldLabel(element);
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

    const label = getUltiproFieldLabel(picker);
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

  return results;
};

/**
 * Scans UKG / Ultipro apply panels (Contact Information + Questions) and
 * builds an API payload with labels, required flags, types, and options.
 */
export const scanUltiproHtmlToMakeApiPayload = async (
  options: UltiproScanToMakeApiOptions = {},
): Promise<UltiproScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectUltiproCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
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
