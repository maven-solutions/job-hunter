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

const getLegendLabel = (wrapper: HTMLElement): string => {
  const legend = wrapper.querySelector(".jv-form-field-legend");
  if (legend?.textContent) {
    return cleanLabelText(legend.textContent);
  }
  return "";
};

const getPrescreenPrompt = (wrapper: HTMLElement): string => {
  const element = wrapper.closest(
    ".jv-prescreen-element",
  ) as HTMLElement | null;
  if (!element) return "";

  const readParagraph = (root: Element | null): string => {
    if (!root) return "";
    const paragraph = root.querySelector(
      ".jv-form-field-p .ng-binding, .jv-form-field-p span, .JVA_TEXT span, p.ng-scope",
    );
    return cleanLabelText(paragraph?.textContent ?? "");
  };

  let text = readParagraph(element);
  if (!text) {
    text = readParagraph(element.previousElementSibling);
  }
  if (text.length > 180) {
    return `${text.slice(0, 180).trim()}…`;
  }
  return text;
};

const getWrapperLabel = (wrapper: HTMLElement): string => {
  const label = wrapper.querySelector(".jv-form-field-label");
  if (label?.textContent) {
    return cleanLabelText(label.textContent);
  }

  const legend = getLegendLabel(wrapper);
  if (legend) return legend;

  return "";
};

const labelForUnlabeledInput = (
  wrapper: HTMLElement,
  input: HTMLInputElement,
): string => {
  const prompt = getPrescreenPrompt(wrapper);
  const id = (input.id || input.name || "").toLowerCase();
  if (prompt && /from/.test(id)) return `${prompt} (From)`;
  if (prompt && /(^|-)to/.test(id)) return `${prompt} (To)`;
  if (prompt) return prompt;
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
  if (scope?.querySelector(".jv-form-field-legend")?.textContent?.includes("*")) {
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
    clone.querySelectorAll("input, svg, i, .jv-required-label").forEach((el) =>
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

const isStaticTextWrapper = (wrapper: HTMLElement): boolean => {
  if (wrapper.querySelector(".jv-form-field-p, .JVA_TEXT p")) {
    const hasControl = wrapper.querySelector(
      "input, textarea, select, fieldset.jv-input-group",
    );
    return !hasControl;
  }
  return false;
};

const collectFromWrapper = (
  wrapper: HTMLElement,
  results: JobviteCandidateField[],
  seenIds: Set<string>,
): void => {
  if (!isVisibleJobviteElement(wrapper) || isSkippedControl(wrapper)) {
    return;
  }
  if (isStaticTextWrapper(wrapper)) {
    return;
  }

  const label = getWrapperLabel(wrapper);

  // Native radios/checkboxes are often visually hidden behind Jobvite icons.
  const radios = Array.from(
    wrapper.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  ).filter((radio) => !isSkippedControl(radio) && !isDisabledField(radio));
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
  ).filter((cb) => !isSkippedControl(cb) && !isDisabledField(cb));
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
    const optionLabels = checkboxes.map(getChoiceLabel).filter(Boolean);
    const checkboxLabel =
      label ||
      getPrescreenPrompt(wrapper) ||
      optionLabels[0] ||
      getFieldLabel(checkboxes[0]);
    results.push({
      element: wrapper,
      label: checkboxLabel,
      required: isRequiredField(checkboxes[0], wrapper),
      kind: "checkbox-group",
      options: optionLabels,
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
      label: label || labelForUnlabeledInput(wrapper, textInput) || getFieldLabel(textInput),
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

export const getJobviteNextButton = (): HTMLButtonElement | null => {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".jv-apply-form-actions button, button[aria-label='Next']",
    ),
  );
  return (
    buttons.find((button) => {
      if (button.classList.contains("ng-hide") || isDisabledField(button)) {
        return false;
      }
      if (!isVisibleJobviteElement(button)) return false;
      const label = `${button.getAttribute("aria-label") || ""} ${button.textContent || ""}`;
      return /next/i.test(label);
    }) ?? null
  );
};

export const isJobviteStep2Visible = (): boolean => {
  const step2 =
    document.querySelector<HTMLElement>('[ng-form="scopeData.step2"]') ||
    document.querySelector<HTMLElement>(".jv-prescreen-section");
  return !!step2 && isVisibleJobviteElement(step2);
};

const SKIP_ANGULAR_FIELD_TYPES = new Set([
  "p",
  "heading",
  "hr",
  "html",
]);

const PAGE_PRESCREEN_EVENT = "careerai-jobvite-prescreen";

interface JobviteAngularPrescreenField {
  type?: string;
  required?: boolean;
  desktopLabel?: string;
  prompt?: string;
  viewFieldEId?: string;
  values?: Array<{ key?: string; value?: string }>;
}

const flattenPrescreenSections = (sections: any[]): JobviteAngularPrescreenField[] => {
  const out: JobviteAngularPrescreenField[] = [];
  sections.forEach((section: any) => {
    const group = Array.isArray(section?.element)
      ? section.element
      : Array.isArray(section?.fields)
        ? [{ fields: section.fields }]
        : [];
    group.forEach((item: any) => {
      const fields = Array.isArray(item?.fields) ? item.fields : [];
      const prompt =
        fields.find((f: any) => String(f?.type || "").toLowerCase() === "p")
          ?.name ||
        fields.find((f: any) => String(f?.type || "").toLowerCase() === "p")
          ?.desktopLabel ||
        "";
      fields.forEach((field: any) => {
        out.push({
          type: field?.type,
          required: !!field?.required,
          desktopLabel:
            field?.desktopLabel ||
            field?.mobileLabel ||
            field?.name ||
            field?.label ||
            "",
          prompt,
          viewFieldEId: String(field?.viewFieldEId || field?.fieldId || ""),
          values: Array.isArray(field?.values)
            ? field.values.map((value: any) => ({
                key: value?.key,
                value: value?.value ?? value?.label ?? value?.key,
              }))
            : [],
        });
      });
    });
  });
  return out;
};

const readAngularPrescreenFromIsolatedWorld = (): JobviteAngularPrescreenField[] => {
  const angular = (window as any).angular;
  if (!angular?.element) return [];

  const form = getJobviteFormRoot();
  let scope = angular.element(form).scope?.();
  for (let i = 0; i < 10 && scope; i += 1) {
    const sections =
      scope.prescreenFields?.section ||
      scope.scopeData?.prescreenFields?.section ||
      scope.applyData?.prescreenFields?.section;
    if (Array.isArray(sections) && sections.length > 0) {
      return flattenPrescreenSections(sections);
    }
    scope = scope.$parent;
  }
  return [];
};

/**
 * Content scripts cannot see page `window.angular`. Dump a JSON-safe
 * prescreen field list from the page world via a CustomEvent.
 */
const readAngularPrescreenFromPageWorld = (): Promise<
  JobviteAngularPrescreenField[]
> =>
  new Promise((resolve) => {
    const finish = (fields: JobviteAngularPrescreenField[]) => {
      window.removeEventListener(PAGE_PRESCREEN_EVENT, onEvent as EventListener);
      resolve(fields);
    };

    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      finish(Array.isArray(detail) ? detail : []);
    };

    window.addEventListener(PAGE_PRESCREEN_EVENT, onEvent as EventListener);

    const script = document.createElement("script");
    script.textContent = `(() => {
      const eventName = ${JSON.stringify(PAGE_PRESCREEN_EVENT)};
      const empty = () =>
        window.dispatchEvent(new CustomEvent(eventName, { detail: [] }));
      try {
        const form = document.querySelector(
          'form[name="scopeData.applyForm"], form.jv-apply-form, .jv-apply-form form'
        );
        const angular = window.angular;
        if (!angular || !form) {
          empty();
          return;
        }
        let scope = angular.element(form).scope && angular.element(form).scope();
        let sections = [];
        for (let i = 0; i < 10 && scope; i += 1) {
          const found =
            (scope.prescreenFields && scope.prescreenFields.section) ||
            (scope.scopeData &&
              scope.scopeData.prescreenFields &&
              scope.scopeData.prescreenFields.section);
          if (found && found.length) {
            sections = found;
            break;
          }
          scope = scope.$parent;
        }
        const out = [];
        (sections || []).forEach((section) => {
          const group = section.element || (section.fields ? [{ fields: section.fields }] : []);
          group.forEach((item) => {
            const fields = (item && item.fields) || [];
            const promptField = fields.find(
              (f) => String((f && f.type) || "").toLowerCase() === "p"
            );
            const prompt =
              (promptField && (promptField.name || promptField.desktopLabel)) || "";
            fields.forEach((field) => {
              out.push({
                type: field && field.type,
                required: !!(field && field.required),
                desktopLabel:
                  (field &&
                    (field.desktopLabel ||
                      field.mobileLabel ||
                      field.name ||
                      field.label)) ||
                  "",
                prompt: prompt,
                viewFieldEId: String(
                  (field && (field.viewFieldEId || field.fieldId)) || ""
                ),
                values: ((field && field.values) || []).map((value) => ({
                  key: value && value.key,
                  value:
                    (value && (value.value || value.label || value.key)) || "",
                })),
              });
            });
          });
        });
        window.dispatchEvent(new CustomEvent(eventName, { detail: out }));
      } catch (e) {
        empty();
      }
    })();`;

    (document.head || document.documentElement).appendChild(script);
    script.remove();

    window.setTimeout(() => finish([]), 500);
  });

const angularFieldLabel = (field: JobviteAngularPrescreenField): string =>
  cleanLabelText(String(field?.desktopLabel || ""));

const angularFieldOptions = (field: JobviteAngularPrescreenField): string[] => {
  const values = Array.isArray(field?.values) ? field.values : [];
  const options: string[] = [];
  const seen = new Set<string>();
  values.forEach((value) => {
    const label = cleanLabelText(String(value?.value ?? value?.key ?? ""));
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    seen.add(label);
    options.push(label);
  });
  return options;
};

const mapAngularPrescreenFields = (
  fields: JobviteAngularPrescreenField[],
): ApiFormElement[] => {
  const elements: ApiFormElement[] = [];
  const seen = new Set<string>();

  fields.forEach((field) => {
    const type = String(field?.type || "").toLowerCase();
    if (SKIP_ANGULAR_FIELD_TYPES.has(type)) return;

    let label = angularFieldLabel(field);
    const prompt = cleanLabelText(field?.prompt || "");
    if (!label && prompt) {
      const id = String(field?.viewFieldEId || "").toLowerCase();
      if (/from/.test(id)) label = `${prompt} (From)`;
      else if (/(^|[-_])to\b/.test(id) || /to\d/.test(id))
        label = `${prompt} (To)`;
      else label = prompt;
    }
    if (!label) return;

    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const required = !!field?.required;
    if (type === "radio" || type === "checkbox" || type === "select") {
      elements.push({
        label,
        required,
        type: "search",
        options: angularFieldOptions(field),
      });
      return;
    }

    elements.push({
      label,
      required,
      type: "text",
    });
  });

  return elements;
};

/**
 * Step 2 (`ng-if="showStep(2)"`) is not in the DOM on step 1.
 * Read Angular `prescreenFields` so the AI payload still includes those questions.
 */
export const collectJobvitePrescreenElementsFromAngular = async (): Promise<
  ApiFormElement[]
> => {
  const fromPage = await readAngularPrescreenFromPageWorld();
  if (fromPage.length > 0) {
    return mapAngularPrescreenFields(fromPage);
  }
  return mapAngularPrescreenFields(readAngularPrescreenFromIsolatedWorld());
};

const mergeApiElements = (
  primary: ApiFormElement[],
  extra: ApiFormElement[],
): ApiFormElement[] => {
  const seen = new Set(
    primary.map((item) => item.label.replace(/\s+/g, " ").trim().toLowerCase()),
  );
  extra.forEach((item) => {
    const key = item.label.replace(/\s+/g, " ").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    primary.push(item);
  });
  return primary;
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

  mergeApiElements(elements, await collectJobvitePrescreenElementsFromAngular());

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
