import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface JobviteScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface JobviteScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

export type JobviteFieldKind =
  | "text"
  | "select"
  | "multi-select"
  | "currency-amount"
  | "checkbox-group"
  | "radio-group";

export interface JobviteCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: JobviteFieldKind;
  options?: string[];
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
  /^(select an option|select|choose|please select|select one|\u2014+|\u2013+|-+|—+)$/i;

const cleanLabelText = (text: string): string =>
  text
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

export const getJobviteFormRoot = (): HTMLElement => {
  const form =
    document.querySelector<HTMLElement>('form[name="scopeData.applyForm"]') ||
    document.querySelector<HTMLElement>("form.jv-apply-form") ||
    document.querySelector<HTMLElement>(".jv-apply-form form") ||
    document.querySelector<HTMLElement>(".jv-form.jv-apply-form");
  return form && !isInsideExtension(form) ? form : document.body;
};

const isDisabledField = (element: HTMLElement): boolean =>
  element.hasAttribute("disabled") ||
  element.getAttribute("aria-disabled") === "true";

const isRecaptchaField = (element: HTMLElement): boolean => {
  const name = (element.getAttribute("name") || "").toLowerCase();
  const id = (element.getAttribute("id") || "").toLowerCase();
  return (
    name.includes("recaptcha") ||
    id.includes("recaptcha") ||
    !!element.closest("#captcha, .grecaptcha-badge, [title='reCAPTCHA']")
  );
};

const isResumePasteField = (element: HTMLElement): boolean =>
  !!element.closest(
    ".jv-add-attachment-paste, [jv-edit-resume], #attachResume .jv-paste-visible",
  );

const isSkippedControl = (element: HTMLElement): boolean =>
  isInsideExtension(element) ||
  isRecaptchaField(element) ||
  isResumePasteField(element);

export const isVisibleJobviteElement = (element: HTMLElement): boolean => {
  if (isDisabledField(element)) return false;
  if (
    element.closest(
      ".ng-hide, [hidden], .jv-visually-hidden, .visually-hidden, [aria-hidden='true']",
    )
  ) {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return true;
};

const getWrapperLabel = (wrapper: HTMLElement): string => {
  const label = wrapper.querySelector(".jv-form-field-label");
  if (label?.textContent) {
    return cleanLabelText(label.textContent);
  }
  return "";
};

const getFieldLabel = (element: HTMLElement): string => {
  const wrapper = element.closest(".jv-form-field") as HTMLElement | null;
  if (wrapper) {
    const fromWrapper = getWrapperLabel(wrapper);
    if (fromWrapper) return fromWrapper;
  }

  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return cleanLabelText(ariaLabel);

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  return id ?? element.getAttribute("name") ?? "Unknown field";
};

const isRequiredField = (
  element: HTMLElement,
  wrapper: HTMLElement | null,
): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const scope = wrapper ?? element.closest(".jv-form-field");
  if (scope?.querySelector(".jv-required-label")) {
    return true;
  }
  if (scope?.querySelector(".jv-form-field-label")?.textContent?.includes("*")) {
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
    const label = cleanLabelText(opt.textContent ?? opt.label ?? opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    if (!opt.value && PLACEHOLDER_OPTION_RE.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const getChoiceLabel = (input: HTMLInputElement): string => {
  const wrappingLabel = input.closest("label");
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, svg, .jv-required-label").forEach((el) =>
      el.remove(),
    );
    const text = cleanLabelText(clone.textContent ?? "");
    if (text) return text;
  }

  const id = input.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) return cleanLabelText(label.textContent);
  }

  return cleanLabelText(input.value || input.getAttribute("aria-label") || "");
};

const rememberKey = (
  seenIds: Set<string>,
  id: string | null | undefined,
  fallback: string,
): boolean => {
  const key = id || fallback;
  if (seenIds.has(key)) return false;
  seenIds.add(key);
  return true;
};

const collectFromWrapper = (
  wrapper: HTMLElement,
  results: JobviteCandidateField[],
  seenIds: Set<string>,
): void => {
  if (!isVisibleJobviteElement(wrapper) || isSkippedControl(wrapper)) {
    return;
  }

  const label = getWrapperLabel(wrapper);

  const radios = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  ).filter((radio) => isVisibleJobviteElement(radio) && !isSkippedControl(radio));
  if (radios.length > 0) {
    if (!rememberKey(seenIds, radios[0].getAttribute("name"), `radio-${results.length}`)) {
      return;
    }
    results.push({
      element: wrapper,
      label: label || getFieldLabel(radios[0]),
      required: isRequiredField(radios[0], wrapper),
      kind: "radio-group",
      options: radios.map(getChoiceLabel).filter(Boolean),
    });
    return;
  }

  const checkboxes = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  ).filter((cb) => isVisibleJobviteElement(cb) && !isSkippedControl(cb));
  if (checkboxes.length > 0) {
    if (
      !rememberKey(
        seenIds,
        checkboxes[0].getAttribute("name"),
        `checkbox-${results.length}`,
      )
    ) {
      return;
    }
    results.push({
      element: wrapper,
      label: label || getFieldLabel(checkboxes[0]),
      required: isRequiredField(checkboxes[0], wrapper),
      kind: "checkbox-group",
      options: checkboxes.map(getChoiceLabel).filter(Boolean),
    });
    return;
  }

  const currencyControl = wrapper.querySelector<HTMLElement>(
    ".cws-currency-control, .jv-form-field-currency",
  );
  if (currencyControl) {
    const currencySelect = wrapper.querySelector<HTMLSelectElement>(
      "select.currency, .cws-currency-control select",
    );
    const amountInput = wrapper.querySelector<HTMLInputElement>(
      ".cws-currency-control input:not([type='hidden']):not([type='file']):not(.currency)",
    );

    if (
      currencySelect &&
      rememberKey(
        seenIds,
        currencySelect.id || `${label}-currency`,
        `currency-code-${results.length}`,
      )
    ) {
      results.push({
        element: currencySelect,
        label: label ? `${label} Currency` : "Currency",
        required: isRequiredField(currencySelect, wrapper),
        kind: "select",
        options: getNativeSelectOptions(currencySelect),
      });
    }

    if (
      amountInput &&
      rememberKey(
        seenIds,
        amountInput.id || `${label}-amount`,
        `currency-amount-${results.length}`,
      )
    ) {
      results.push({
        element: amountInput,
        label: label || getFieldLabel(amountInput),
        required: isRequiredField(amountInput, wrapper),
        kind: "currency-amount",
      });
    }
    return;
  }

  const select = wrapper.querySelector<HTMLSelectElement>("select");
  if (select && !isSkippedControl(select)) {
    const key = select.getAttribute("name") || select.id;
    if (!rememberKey(seenIds, key, `select-${results.length}`)) return;
    const isMulti = select.multiple;
    results.push({
      element: select,
      label: label || getFieldLabel(select),
      required: isRequiredField(select, wrapper),
      kind: isMulti ? "multi-select" : "select",
      options: getNativeSelectOptions(select),
    });
    return;
  }

  const textarea = wrapper.querySelector<HTMLTextAreaElement>("textarea");
  if (
    textarea &&
    isVisibleJobviteElement(textarea) &&
    !isSkippedControl(textarea)
  ) {
    if (!rememberKey(seenIds, textarea.id || textarea.name, `textarea-${results.length}`)) {
      return;
    }
    results.push({
      element: textarea,
      label: label || getFieldLabel(textarea),
      required: isRequiredField(textarea, wrapper),
      kind: "text",
    });
    return;
  }

  const textInput = wrapper.querySelector<HTMLInputElement>(
    "input:not([type='hidden']):not([type='file']):not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio']):not([type='password']):not([type='reset'])",
  );
  if (
    textInput &&
    isVisibleJobviteElement(textInput) &&
    !isSkippedControl(textInput) &&
    !SKIP_INPUT_TYPES.has((textInput.type || "text").toLowerCase())
  ) {
    if (
      !rememberKey(
        seenIds,
        textInput.id || textInput.getAttribute("name"),
        `input-${results.length}`,
      )
    ) {
      return;
    }
    results.push({
      element: textInput,
      label: label || getFieldLabel(textInput),
      required: isRequiredField(textInput, wrapper),
      kind: "text",
    });
  }
};

/**
 * Collect autofillable Jobvite application fields from `.jv-apply-form`.
 * Resume/file, paste-resume, LinkedIn attach, and reCAPTCHA are skipped.
 */
export const collectJobviteCandidateFields = (): JobviteCandidateField[] => {
  const form = getJobviteFormRoot();
  const results: JobviteCandidateField[] = [];
  const seenIds = new Set<string>();

  form.querySelectorAll<HTMLElement>(".jv-form-field").forEach((wrapper) => {
    collectFromWrapper(wrapper, results, seenIds);
  });

  return results;
};

/**
 * Scans the Jobvite application form and builds an API payload
 * with field labels, required flags, types, and select/choice options.
 */
export const scanJobviteHtmlToMakeApiPayload = async (
  options: JobviteScanToMakeApiOptions = {},
): Promise<JobviteScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectJobviteCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "text" || candidate.kind === "currency-amount") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "text",
      });
      continue;
    }

    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      options: candidate.options ?? [],
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "jobvite",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
