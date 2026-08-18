import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface BambooHrScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface BambooHrScanToMakeApiOptions {
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

const PLACEHOLDER_OPTION_RE =
  /^(–|-|—)?\s*(select|choose|please select|select one)?\s*(–|-|—)?$/i;

const FABRIC_SELECT_WRAPPER =
  '[data-fabric-component="SelectField InputWrapper"], [data-fabric-component="SelectField"]';
const FABRIC_SELECT = '[data-fabric-component="Select"], .fab-Select';
const RADIO_GROUP =
  'fieldset[data-fabric-component="RadioGroup"], fieldset.CandidateField';
const MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="option"], .fab-Menu__item, [data-fabric-component="MenuItem"]';

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

export const getBambooHrFormRoot = (): HTMLElement => {
  const form =
    document.querySelector<HTMLElement>("form#job-application-form") ||
    document.querySelector<HTMLElement>("form[id*='job-application']") ||
    document.querySelector<HTMLElement>(
      "form[data-fabric-component], .CandidateForm, form.CandidateForm",
    );
  return form && !isInsideExtension(form) ? form : document.body;
};

const isPlaceholderOption = (label: string): boolean => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return true;
  return PLACEHOLDER_OPTION_RE.test(cleaned);
};

const isHoneypotField = (element: HTMLElement): boolean => {
  const name = (element.getAttribute("name") || "").toLowerCase();
  const id = (element.getAttribute("id") || "").toLowerCase();
  const autocomplete = (
    element.getAttribute("autocomplete") || ""
  ).toLowerCase();
  if (
    name.includes("nickname") ||
    id.includes("nickname") ||
    autocomplete.includes("nickname")
  ) {
    return true;
  }

  const label = getAssociatedLabelText(element).toLowerCase();
  if (label.includes("leave this field blank")) {
    return true;
  }

  return false;
};

const isRecaptchaField = (element: HTMLElement): boolean => {
  const name = (element.getAttribute("name") || "").toLowerCase();
  const id = (element.getAttribute("id") || "").toLowerCase();
  return (
    name.includes("recaptcha") ||
    id.includes("recaptcha") ||
    !!element.closest(".g-recaptcha, [title='reCAPTCHA']")
  );
};

const isVisibleElement = (element: HTMLElement): boolean => {
  if (element.closest(".visually-hidden, [hidden], [aria-hidden='true']")) {
    return false;
  }
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return true;
};

const getAssociatedLabelText = (element: HTMLElement): string => {
  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }
  return "";
};

const getWrapperLabel = (wrapper: HTMLElement): string => {
  const label =
    wrapper.querySelector("label.MuiInputLabel-root, label.MuiFormLabel-root") ||
    wrapper.querySelector("label");
  if (label?.textContent) {
    return cleanLabelText(label.textContent);
  }
  return "";
};

const getFieldLabel = (element: HTMLElement): string => {
  const fromFor = getAssociatedLabelText(element);
  if (fromFor) return fromFor;

  const wrapper = element.closest(
    '[data-fabric-component="TextField InputWrapper"], [data-fabric-component="TextArea InputWrapper"], [data-fabric-component="SelectField InputWrapper"], .CandidateField, .MuiFormControl-root',
  ) as HTMLElement | null;
  if (wrapper) {
    const fromWrapper = getWrapperLabel(wrapper);
    if (fromWrapper) return fromWrapper;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    // Fabric toggle aria-label is "State –Select–" / "Country United States"
    const stripped = cleanLabelText(
      ariaLabel.replace(/\s*(–Select–|Select).*$/i, ""),
    );
    if (stripped) return stripped;
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
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

  const wrapper = element.closest(
    '[data-fabric-component="TextField InputWrapper"], [data-fabric-component="TextArea InputWrapper"], [data-fabric-component="SelectField InputWrapper"], .MuiFormControl-root, .CandidateField, fieldset',
  );
  if (wrapper) {
    const requiredSelect = wrapper.querySelector("select[required]");
    if (requiredSelect) return true;

    const label =
      wrapper.querySelector("label.Mui-required") ||
      wrapper.querySelector("label");
    if (label?.classList.contains("Mui-required")) return true;
    if (label?.textContent?.includes("*")) return true;
    if (wrapper.querySelector(".MuiFormLabel-asterisk, .required")) {
      return true;
    }
  }

  const id = element.getAttribute("id");
  const label =
    (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || null;
  if (label?.textContent?.includes("*")) return true;
  if (label?.classList.contains("Mui-required")) return true;

  return false;
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

const getRadioOptionLabel = (input: HTMLInputElement): string => {
  const row = input.closest("label, .MuiFormControlLabel-root");
  const text = row?.querySelector(".MuiFormControlLabel-label")?.textContent;
  if (text) return cleanLabelText(text);

  if (input.id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (forLabel?.textContent) return cleanLabelText(forLabel.textContent);
  }

  const parentLabel = input.closest("label");
  if (parentLabel?.textContent) {
    return cleanLabelText(parentLabel.textContent);
  }

  return cleanLabelText(input.value || "");
};

const extractRadioGroupOptions = (fieldset: HTMLElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();
  const title = getRadioGroupLabel(fieldset);

  fieldset
    .querySelectorAll<HTMLInputElement>("input[type='radio']")
    .forEach((radio) => {
      const label = getRadioOptionLabel(radio);
      if (!label || seen.has(label) || label === title) return;
      seen.add(label);
      options.push(label);
    });

  return options;
};

const getRadioGroupLabel = (fieldset: HTMLElement): string => {
  const legendLabel =
    fieldset.querySelector("legend label") ||
    fieldset.querySelector("[data-fabric-component='Label'] label") ||
    fieldset.querySelector("legend");
  if (legendLabel?.textContent) {
    return cleanLabelText(legendLabel.textContent);
  }
  return getWrapperLabel(fieldset) || "Unknown field";
};

const isRadioGroupRequired = (fieldset: HTMLElement): boolean => {
  if (
    fieldset.getAttribute("aria-required") === "true" ||
    fieldset.hasAttribute("required")
  ) {
    return true;
  }
  const legend = fieldset.querySelector("legend, label");
  return !!legend?.textContent?.includes("*");
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const collectVisibleMenuItems = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)).filter(
    (item) => {
      const style = window.getComputedStyle(item);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      const rect = item.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    },
  );

const waitForMenuItems = (timeoutMs = 700): Promise<HTMLElement[]> =>
  new Promise((resolve) => {
    const existing = collectVisibleMenuItems();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const items = collectVisibleMenuItems();
      if (items.length > 0) {
        observer.disconnect();
        window.clearTimeout(timer);
        resolve(items);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(collectVisibleMenuItems());
    }, timeoutMs);
  });

const closeFabricMenu = async (): Promise<void> => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await delay(80);
};

const getFabricToggle = (wrapper: HTMLElement): HTMLButtonElement | null =>
  wrapper.querySelector<HTMLButtonElement>("button.fab-SelectToggle") ||
  wrapper.querySelector<HTMLButtonElement>(".fab-SelectToggle__toggleButton") ||
  wrapper.querySelector<HTMLButtonElement>("button[aria-haspopup='true']");

const openAndScanFabricSelectOptions = async (
  wrapper: HTMLElement,
): Promise<string[]> => {
  const toggle = getFabricToggle(wrapper);
  if (!toggle) return [];

  if (toggle.getAttribute("aria-expanded") === "true") {
    await closeFabricMenu();
  }

  toggle.focus();
  toggle.click();
  await waitForDomUpdate();

  let items = await waitForMenuItems();
  if (items.length === 0) {
    await delay(200);
    items = collectVisibleMenuItems();
  }

  const options: string[] = [];
  const seen = new Set<string>();
  items.forEach((item) => {
    const label = cleanLabelText(item.textContent ?? "");
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    if (/^clear selection$/i.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  await closeFabricMenu();
  return options;
};

export type BambooHrFieldKind =
  | "text"
  | "date"
  | "select"
  | "fabric-select"
  | "radio-group";

export interface BambooHrCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: BambooHrFieldKind;
  options?: string[];
}

const isDateField = (element: HTMLElement): boolean => {
  if (element.closest("[data-fabric-component='DatePicker']")) return true;
  if (element.getAttribute("name") === "dateAvailable") return true;
  const placeholder = (element.getAttribute("placeholder") || "").toLowerCase();
  if (placeholder.includes("mm/dd") || placeholder.includes("yyyy")) {
    return true;
  }
  const label = getFieldLabel(element).toLowerCase();
  return /^date\b/.test(label) || label.includes("date available");
};

const alreadyCoveredBySelect = (
  element: HTMLElement,
  selectWrappers: HTMLElement[],
): boolean => selectWrappers.some((wrapper) => wrapper.contains(element));

/**
 * Collect autofillable BambooHR application form fields from the host page.
 * Covers Fabric (current) and older CandidateField markup.
 */
export const collectBambooHrCandidateFields = (): BambooHrCandidateField[] => {
  const formRoot = getBambooHrFormRoot();
  const results: BambooHrCandidateField[] = [];
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();

  const selectWrappers = Array.from(
    formRoot.querySelectorAll<HTMLElement>(
      `${FABRIC_SELECT_WRAPPER}, ${FABRIC_SELECT}`,
    ),
  ).filter((wrapper) => {
    if (isInsideExtension(wrapper)) return false;
    // Prefer outer SelectField wrapper over inner .fab-Select
    const isInnerSelect =
      wrapper.matches(FABRIC_SELECT) &&
      wrapper.closest(FABRIC_SELECT_WRAPPER) &&
      wrapper.closest(FABRIC_SELECT_WRAPPER) !== wrapper;
    return !isInnerSelect;
  });

  const markSeen = (id: string, label: string): boolean => {
    const labelKey = label.toLowerCase();
    if (seenIds.has(id) || seenLabels.has(labelKey)) return false;
    seenIds.add(id);
    seenLabels.add(labelKey);
    return true;
  };

  selectWrappers.forEach((wrapper, index) => {
    const toggle = getFabricToggle(wrapper);
    const hiddenSelect = wrapper.querySelector("select");
    const label = getWrapperLabel(wrapper) || (toggle ? getFieldLabel(toggle) : "");
    if (!label) return;

    const id =
      hiddenSelect?.getAttribute("id") ||
      hiddenSelect?.getAttribute("name") ||
      toggle?.getAttribute("data-menu-id") ||
      `fabric-select-${index}`;
    if (!markSeen(id, label)) return;

    results.push({
      element: wrapper,
      label,
      required: isRequiredField(wrapper) || isRequiredField(toggle ?? wrapper),
      kind: "fabric-select",
      options: hiddenSelect ? getNativeSelectOptions(hiddenSelect) : [],
    });
  });

  formRoot
    .querySelectorAll<HTMLElement>("input, textarea, select")
    .forEach((element) => {
      if (isInsideExtension(element) || !isVisibleElement(element)) return;
      if (isHoneypotField(element) || isRecaptchaField(element)) return;
      if (alreadyCoveredBySelect(element, selectWrappers)) return;

      if (element instanceof HTMLInputElement) {
        const type = (element.type || "text").toLowerCase();
        if (SKIP_INPUT_TYPES.has(type)) return;
        // Honeypot / off-screen Fabric decoy inputs
        if (element.tabIndex === -1 && type === "text") return;
      }

      // Hidden auto-resize twin of Fabric textarea
      if (
        element instanceof HTMLTextAreaElement &&
        (element.readOnly || element.tabIndex === -1)
      ) {
        return;
      }

      const id =
        element.getAttribute("id") ||
        element.getAttribute("name") ||
        `${results.length}`;
      const label = getFieldLabel(element);
      if (!label || label.toLowerCase() === "unknown field") return;
      if (!markSeen(id, label)) return;

      if (element instanceof HTMLSelectElement) {
        results.push({
          element,
          label,
          required: isRequiredField(element),
          kind: "select",
          options: getNativeSelectOptions(element),
        });
        return;
      }

      results.push({
        element,
        label,
        required: isRequiredField(element),
        kind: isDateField(element) ? "date" : "text",
      });
    });

  formRoot.querySelectorAll<HTMLElement>(RADIO_GROUP).forEach((fieldset, index) => {
    if (isInsideExtension(fieldset)) return;
    const radios = fieldset.querySelectorAll("input[type='radio']");
    if (radios.length === 0) return;

    const label = getRadioGroupLabel(fieldset);
    if (!label) return;
    const id = fieldset.getAttribute("id") || `radio-group-${index}`;
    if (!markSeen(id, label)) return;

    results.push({
      element: fieldset,
      label,
      required: isRadioGroupRequired(fieldset),
      kind: "radio-group",
      options: extractRadioGroupOptions(fieldset),
    });
  });

  results.sort((a, b) => {
    const pos = a.element.compareDocumentPosition(b.element);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  return results;
};

/**
 * Scans the BambooHR application form and builds an API payload
 * with field labels, required flags, types, and select options.
 */
export const scanBambooHrHtmlToMakeApiPayload = async (
  options: BambooHrScanToMakeApiOptions = {},
): Promise<BambooHrScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectBambooHrCandidateFields();
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

    if (candidate.kind === "select" || candidate.kind === "radio-group") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: candidate.options ?? [],
      });
      continue;
    }

    // Fabric custom dropdown — native <select> is empty until opened
    const fabricOptions = await openAndScanFabricSelectOptions(candidate.element);
    const optionsList =
      fabricOptions.length > 0 ? fabricOptions : candidate.options ?? [];
    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      ...(optionsList.length > 0 ? { options: optionsList } : {}),
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "bamboohr",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
