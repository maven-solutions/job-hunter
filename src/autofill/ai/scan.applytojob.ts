import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface ApplyToJobScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface ApplyToJobScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

export type ApplyToJobFieldKind =
  | "text"
  | "select"
  | "radio-group"
  | "checkbox-group";

export interface ApplyToJobCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: ApplyToJobFieldKind;
}

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "password",
  "image",
]);

const PLACEHOLDER_OPTION_RE =
  /^(no answer|--+\s*no answer\s*--+|select|choose|please select|select one|\u2014+|\u2013+|-+)$/i;

const SKIP_CONTROL_IDS = new Set([
  "resumator-xml-value",
  "resumator-resumetext-value",
  "resumator-resume-value",
  "input-linkedin-profile",
  "dv_deputy",
]);

const cleanLabelText = (text: string): string =>
  text
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

export const getApplyToJobFormRoot = (): HTMLElement => {
  const form =
    document.querySelector<HTMLElement>("#form_submit_new_resume") ||
    document.querySelector<HTMLElement>("#resumator-application-form") ||
    document.querySelector<HTMLElement>("form[data-test='form_submit_new_resume']");
  return form && !isInsideExtension(form) ? form : document.body;
};

const isDisabledField = (element: HTMLElement): boolean =>
  element.hasAttribute("disabled") ||
  element.getAttribute("aria-disabled") === "true";

const isSkippedControl = (element: HTMLElement): boolean => {
  const id = element.getAttribute("id") || "";
  const name = (element.getAttribute("name") || "").toLowerCase();
  if (SKIP_CONTROL_IDS.has(id)) return true;
  if (name === "resumator-xml-value" || name === "resumator-resumetext-value") {
    return true;
  }
  if (element.closest("#resumator-resume-paste-wrapper, #resumator-resume-upload-wrapper")) {
    return true;
  }
  return false;
};

export const isVisibleApplyToJobElement = (element: HTMLElement): boolean => {
  if (isDisabledField(element)) return false;
  if (element.closest(".none, [hidden], .visually-hidden, [aria-hidden='true']")) {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return true;
};

/**
 * JazzHR sometimes nests the control inside the label (EEO Gender/Race).
 * Strip nested inputs so we don't send option text as the field label.
 */
const getLabelOwnText = (label: Element): string => {
  const clone = label.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("select, input, textarea, .asterisk, script")
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
  if (parentLabel instanceof HTMLLabelElement) return parentLabel;

  return null;
};

const getFieldLabel = (element: HTMLElement): string => {
  const associated = getAssociatedLabel(element);
  if (associated) {
    const fromLabel = getLabelOwnText(associated);
    if (fromLabel) return fromLabel;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return cleanLabelText(ariaLabel);

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl) {
      const fromId = getLabelOwnText(labelEl);
      if (fromId) return fromId;
    }
  }

  const wrapper = element.closest(
    ".form-group, .resumator-field-wrapper, #resumator-address",
  ) as HTMLElement | null;
  if (wrapper) {
    const wrapperLabel = wrapper.querySelector(":scope > label, .control-label");
    if (wrapperLabel) {
      const fromWrapper = getLabelOwnText(wrapperLabel);
      // Address sub-fields (City / State / Postal) share the Address label —
      // prefer placeholder so they stay distinct for the AI payload.
      const placeholder =
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
          ? element.getAttribute("placeholder")
          : null;
      if (
        placeholder &&
        fromWrapper &&
        fromWrapper.toLowerCase() === "address" &&
        cleanLabelText(placeholder).toLowerCase() !== "address"
      ) {
        return cleanLabelText(placeholder);
      }
      if (fromWrapper) return fromWrapper;
    }
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const placeholder = element.getAttribute("placeholder");
    if (placeholder) return cleanLabelText(placeholder);
  }

  return (
    element.getAttribute("name") ||
    element.getAttribute("id") ||
    "Unknown field"
  );
};

const isRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const associated = getAssociatedLabel(element);
  if (associated?.querySelector(".asterisk") || associated?.textContent?.includes("*")) {
    return true;
  }

  const wrapper = element.closest(
    ".form-group, .resumator-field-wrapper, #resumator-address",
  );
  const wrapperLabel = wrapper?.querySelector(
    ":scope > label, .control-label, .resumator-label",
  );
  if (
    wrapperLabel?.querySelector(".asterisk") ||
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

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const getChoiceGroupWrapper = (control: HTMLInputElement): HTMLElement =>
  (control.closest(
    ".form-group, .resumator-field-wrapper, fieldset",
  ) as HTMLElement | null) ||
  control.parentElement ||
  control;

const getChoiceGroupLabel = (
  wrapper: HTMLElement,
  control: HTMLInputElement,
): string => {
  const groupLabel = wrapper.querySelector(
    ".resumator-label, legend, :scope > label.control-label, :scope > .control-label, label.control-label",
  );
  if (groupLabel && !groupLabel.contains(control)) {
    const text = getLabelOwnText(groupLabel);
    if (text) return text;
  }

  const labelledBy = control.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl) {
      const text = getLabelOwnText(labelEl);
      if (text) return text;
    }
  }

  const hiddenAnswer = wrapper.querySelector<HTMLInputElement>(
    "input.resumator-questionnaire-checkbox-answer[type='hidden']",
  );
  if (hiddenAnswer?.id) {
    const forLabel = document.querySelector(
      `label[for="${CSS.escape(hiddenAnswer.id)}"]`,
    );
    if (forLabel) {
      const text = getLabelOwnText(forLabel);
      if (text) return text;
    }
  }

  return (
    getFieldLabel(wrapper) ||
    control.getAttribute("name") ||
    "Unknown field"
  );
};

const getCheckboxGroupKey = (
  wrapper: HTMLElement,
  checkbox: HTMLInputElement,
): string => {
  const hidden = wrapper.querySelector<HTMLInputElement>(
    "input.resumator-questionnaire-checkbox-answer[type='hidden']",
  );
  if (hidden?.id) return `checkbox:${hidden.id}`;
  if (hidden?.name) return `checkbox:${hidden.name}`;
  if (wrapper.id) return `checkbox-wrapper:${wrapper.id}`;

  const id = checkbox.getAttribute("id") || checkbox.getAttribute("name") || "";
  const prefix = id.replace(/-\d+$/, "");
  return `checkbox:${prefix || wrapper.tagName}`;
};

const getCheckboxGroupOptions = (wrapper: HTMLElement): string[] => {
  const checkboxes = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>(
      "input[type='checkbox'].resumator-questionnaire-checkbox, input[type='checkbox']",
    ),
  );
  const options: string[] = [];
  const seen = new Set<string>();
  checkboxes.forEach((checkbox) => {
    const label = getApplyToJobRadioChoiceLabel(checkbox);
    if (!label || seen.has(label)) return;
    seen.add(label);
    options.push(label);
  });
  return options;
};

export const getApplyToJobRadioChoiceLabel = (
  input: HTMLInputElement,
): string => {
  const wrappingLabel = input.closest("label");
  if (wrappingLabel) {
    const text = getLabelOwnText(wrappingLabel);
    if (text) return text;
  }

  const id = input.getAttribute("id");
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel) {
      const text = getLabelOwnText(forLabel);
      if (text) return text;
    }
  }

  return cleanLabelText(input.value || input.getAttribute("aria-label") || "");
};

const getRadioGroupOptions = (
  wrapper: HTMLElement,
  name: string,
): string[] => {
  const radios = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  ).filter((radio) => !name || radio.name === name);

  const options: string[] = [];
  const seen = new Set<string>();
  radios.forEach((radio) => {
    const label = getApplyToJobRadioChoiceLabel(radio);
    if (!label || seen.has(label)) return;
    seen.add(label);
    options.push(label);
  });
  return options;
};

export const collectApplyToJobCandidateFields = (): ApplyToJobCandidateField[] => {
  const root = getApplyToJobFormRoot();
  const candidates = root.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );
  const results: ApplyToJobCandidateField[] = [];
  const seenIds = new Set<string>();

  candidates.forEach((element) => {
    if (isInsideExtension(element) || isSkippedControl(element)) {
      return;
    }
    if (!isVisibleApplyToJobElement(element)) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (type === "radio") {
        const name = element.getAttribute("name") || element.getAttribute("id") || "";
        const key = `radio:${name || results.length}`;
        if (seenIds.has(key)) {
          return;
        }
        seenIds.add(key);

        const wrapper = getChoiceGroupWrapper(element);
        const label = getChoiceGroupLabel(wrapper, element);
        if (!label) return;

        results.push({
          element: wrapper,
          label,
          required: isRequiredField(wrapper) || isRequiredField(element),
          kind: "radio-group",
        });
        return;
      }

      if (type === "checkbox") {
        const wrapper = getChoiceGroupWrapper(element);
        const key = getCheckboxGroupKey(wrapper, element);
        if (seenIds.has(key)) {
          return;
        }
        seenIds.add(key);

        const label = getChoiceGroupLabel(wrapper, element);
        if (!label) return;

        results.push({
          element: wrapper,
          label,
          required: isRequiredField(wrapper) || isRequiredField(element),
          kind: "checkbox-group",
        });
        return;
      }

      if (SKIP_INPUT_TYPES.has(type)) {
        return;
      }
    }

    const id =
      element.getAttribute("id") ||
      element.getAttribute("name") ||
      `${results.length}`;
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);

    const label = getFieldLabel(element);
    if (!label) return;

    if (element instanceof HTMLSelectElement) {
      results.push({
        element,
        label,
        required: isRequiredField(element),
        kind: "select",
      });
      return;
    }

    results.push({
      element,
      label,
      required: isRequiredField(element),
      kind: "text",
    });
  });

  return results;
};

/**
 * Scans the JazzHR / ApplyToJob application form and builds an API payload
 * with field labels, required flags, types, and native select options.
 */
export const scanApplyToJobHtmlToMakeApiPayload = async (
  options: ApplyToJobScanToMakeApiOptions = {},
): Promise<ApplyToJobScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectApplyToJobCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "select") {
      const selectOptions = getNativeSelectOptions(
        candidate.element as HTMLSelectElement,
      );
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: selectOptions,
      });
      continue;
    }

    if (candidate.kind === "radio-group") {
      const firstRadio = candidate.element.querySelector<HTMLInputElement>(
        "input[type='radio']",
      );
      const radioOptions = getRadioGroupOptions(
        candidate.element,
        firstRadio?.getAttribute("name") || "",
      );
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: radioOptions,
      });
      continue;
    }

    if (candidate.kind === "checkbox-group") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: getCheckboxGroupOptions(candidate.element),
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
    source: "applytojob",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
