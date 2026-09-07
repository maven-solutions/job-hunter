import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface WorkableScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface WorkableScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

export type WorkableFieldKind =
  | "text"
  | "select"
  | "combobox"
  | "radio-group";

export interface WorkableCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: WorkableFieldKind;
  options?: string[];
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
  /^(select(\s+an?\s+option)?|choose|please select|select one)[.…]*$/i;

const cleanLabelText = (text: string): string =>
  text
    .replace(/\(optional\)/gi, "")
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

/** Resume-import widget — not a form field to scan. */
const isInsideResumeImportWidget = (element: Element): boolean =>
  !!element.closest("[data-ui='autofill-button']") ||
  !!element.closest("[data-ui='close-success-alert']")?.closest("section");

export const getWorkableFormRoot = (): HTMLElement => {
  const form =
    document.querySelector<HTMLElement>("form") ||
    document.querySelector<HTMLElement>("[data-ui='section']")?.closest(
      "form, main, #app, body",
    );
  return form && !isInsideExtension(form) ? form : document.body;
};

const isVisibleElement = (element: HTMLElement): boolean => {
  if (element.closest("[hidden]")) {
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
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

const isPlaceholderOption = (label: string): boolean => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return true;
  return PLACEHOLDER_OPTION_RE.test(cleaned);
};

const getLabelFromIds = (labelledBy: string | null): string => {
  if (!labelledBy) return "";
  const ids = labelledBy.split(/\s+/).filter(Boolean);
  const preferred = ids.filter((id) => /_label$/i.test(id));
  for (const id of preferred.length ? preferred : ids) {
    const el = document.getElementById(id);
    if (el?.textContent) {
      const text = cleanLabelText(el.textContent);
      if (text) return text;
    }
  }
  return "";
};

const getWrapperLabelSpan = (element: HTMLElement): string => {
  const wrapper =
    (element.closest("label") as HTMLElement | null) ||
    (element.closest("[data-ui='section-fields'] > *") as HTMLElement | null) ||
    element.parentElement;
  const span =
    wrapper?.querySelector<HTMLElement>("[id$='_label']") ||
    wrapper?.querySelector<HTMLElement>("strong");
  if (span?.textContent) {
    return cleanLabelText(span.textContent);
  }
  return "";
};

export const getWorkableFieldLabel = (element: HTMLElement): string => {
  const fromAria = getLabelFromIds(element.getAttribute("aria-labelledby"));
  if (fromAria) return fromAria;

  const id = element.getAttribute("id");
  if (id) {
    const byFor = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (byFor) {
      const span = byFor.querySelector<HTMLElement>("[id$='_label']");
      if (span?.textContent) return cleanLabelText(span.textContent);
      const text = cleanLabelText(byFor.textContent ?? "");
      if (text) return text;
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return cleanLabelText(ariaLabel);

  const fromWrapper = getWrapperLabelSpan(element);
  if (fromWrapper) return fromWrapper;

  return id ?? element.getAttribute("name") ?? "Unknown field";
};

export const isWorkableFieldRequired = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const group = element.closest("[aria-required], [required]");
  if (
    group?.getAttribute("aria-required") === "true" ||
    group?.hasAttribute("required")
  ) {
    return true;
  }

  if (element.querySelector("[aria-required='true'], [required]")) {
    return true;
  }

  const wrapper =
    (element.closest("label") as HTMLElement | null) ||
    (element.closest("[data-ui='section-fields'] > *") as HTMLElement | null);
  if (wrapper?.querySelector("strong")?.textContent?.includes("*")) {
    return true;
  }
  const raw = wrapper?.textContent ?? "";
  if (/\*/.test(raw) && !/\(optional\)/i.test(raw)) {
    return true;
  }

  return false;
};

const isHiddenBackingInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.type === "hidden") return true;
  if (
    element.tabIndex === -1 &&
    element.getAttribute("aria-hidden") === "true"
  ) {
    return true;
  }
  return false;
};

const isComboboxInput = (element: HTMLElement): boolean =>
  element instanceof HTMLInputElement &&
  (element.getAttribute("role") === "combobox" ||
    !!element.closest("[data-input-type='select']"));

const getComboboxWrapper = (element: HTMLElement): HTMLElement | null =>
  element.closest("[data-input-type='select']") as HTMLElement | null;

const getRadioGroupLabel = (fieldset: HTMLElement): string => {
  const fromAria = getLabelFromIds(fieldset.getAttribute("aria-labelledby"));
  if (fromAria) return fromAria;

  const wrapper = fieldset.parentElement;
  const span = wrapper?.querySelector<HTMLElement>("[id$='_label']");
  if (span?.textContent) return cleanLabelText(span.textContent);

  return getWorkableFieldLabel(fieldset);
};

const getRadioOptionLabel = (optionEl: HTMLElement): string => {
  const id = optionEl.id;
  if (id) {
    const span = optionEl.querySelector<HTMLElement>(
      `[id^='radio_label_'], [id$='${CSS.escape(id.replace(/^wrapper_/, ""))}']`,
    );
    if (span?.textContent) return cleanLabelText(span.textContent);
  }

  const named = optionEl.querySelector<HTMLElement>("[id^='radio_label_']");
  if (named?.textContent) return cleanLabelText(named.textContent);

  const clone = optionEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("input, svg").forEach((el) => el.remove());
  return cleanLabelText(clone.textContent ?? "");
};

export const extractWorkableRadioOptions = (
  fieldset: HTMLElement,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  fieldset
    .querySelectorAll<HTMLElement>("[data-ui='option'][role='radio'], [role='radio']")
    .forEach((optionEl) => {
      const label = getRadioOptionLabel(optionEl);
      if (!label || seen.has(label)) return;
      seen.add(label);
      options.push(label);
    });

  if (options.length === 0) {
    fieldset.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach((input) => {
      const wrap = input.closest("[role='radio']") as HTMLElement | null;
      const label = wrap
        ? getRadioOptionLabel(wrap)
        : cleanLabelText(input.value || "");
      if (!label || seen.has(label)) return;
      seen.add(label);
      options.push(label);
    });
  }

  return options;
};

export const isWorkableRadioGroupEmpty = (fieldset: HTMLElement): boolean => {
  const checkedRole = fieldset.querySelector("[role='radio'][aria-checked='true']");
  if (checkedRole) return false;
  const checkedInput = fieldset.querySelector<HTMLInputElement>(
    "input[type='radio']:checked",
  );
  return !checkedInput;
};

const getComboboxDisplayValue = (element: HTMLInputElement): string => {
  const displayed = cleanLabelText(element.value ?? "");
  if (displayed && !isPlaceholderOption(displayed)) return displayed;

  const wrapper = getComboboxWrapper(element);
  const hidden = wrapper?.querySelector<HTMLInputElement>(
    "input[name]:not([role='combobox'])",
  );
  return cleanLabelText(hidden?.value ?? "");
};

export const isWorkableTextEmpty = (element: HTMLElement): boolean => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return !cleanLabelText(element.value ?? "");
  }
  if (element instanceof HTMLSelectElement) {
    const selected = element.selectedOptions[0];
    const label = cleanLabelText(selected?.textContent ?? selected?.value ?? "");
    return !element.value || isPlaceholderOption(label);
  }
  return true;
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const closeWorkableMenus = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const fullClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const opts = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent("pointerdown", opts));
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(new MouseEvent("mouseup", opts));
  element.dispatchEvent(new PointerEvent("pointerup", opts));
  element.click();
};

const getListboxForCombobox = (element: HTMLInputElement): HTMLElement | null => {
  const owns =
    element.getAttribute("aria-controls") ||
    element.getAttribute("aria-owns");
  if (owns) {
    const byId = document.getElementById(owns);
    if (byId) return byId;
  }
  const wrapper = getComboboxWrapper(element);
  return (
    wrapper?.querySelector<HTMLElement>("[role='listbox']") ||
    document.querySelector<HTMLElement>("[role='listbox']")
  );
};

export const scanWorkableComboboxOptionsFromDom = (
  element: HTMLInputElement,
): string[] => {
  const results: string[] = [];
  const seen = new Set<string>();

  const addOption = (optionEl: HTMLElement) => {
    const label = cleanLabelText(optionEl.textContent ?? "");
    if (!label || isPlaceholderOption(label) || seen.has(label)) return;
    seen.add(label);
    results.push(label);
  };

  const listbox = getListboxForCombobox(element);
  listbox
    ?.querySelectorAll<HTMLElement>("[role='option']")
    .forEach(addOption);

  if (results.length === 0) {
    document
      .querySelectorAll<HTMLElement>("[role='listbox'] [role='option']")
      .forEach(addOption);
  }

  return results;
};

const openWorkableCombobox = async (
  element: HTMLInputElement,
): Promise<boolean> => {
  const wrapper = getComboboxWrapper(element);
  if (wrapper?.getAttribute("data-open") === "true") {
    return true;
  }
  if (element.getAttribute("aria-expanded") === "true") {
    return true;
  }

  fullClick(element);
  await delay(200);
  await waitForDomUpdate();

  if (
    wrapper?.getAttribute("data-open") === "true" ||
    element.getAttribute("aria-expanded") === "true"
  ) {
    return true;
  }

  if (wrapper && wrapper !== element) {
    fullClick(wrapper);
    await delay(200);
    await waitForDomUpdate();
  }

  return (
    wrapper?.getAttribute("data-open") === "true" ||
    element.getAttribute("aria-expanded") === "true" ||
    scanWorkableComboboxOptionsFromDom(element).length > 0
  );
};

export const openAndScanWorkableComboboxOptions = async (
  element: HTMLInputElement,
): Promise<string[]> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeWorkableMenus();
    await delay(120);
  }

  await openWorkableCombobox(element);
  await delay(150);
  await waitForDomUpdate();

  let options = scanWorkableComboboxOptionsFromDom(element);
  if (options.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    options = scanWorkableComboboxOptionsFromDom(element);
  }

  closeWorkableMenus();
  await delay(120);

  return options;
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

/**
 * Collects Workable fields that are still empty after the site's resume parser.
 * Filled name/email/phone/etc. are skipped on purpose.
 */
export const collectWorkableCandidateFields = (): WorkableCandidateField[] => {
  const form = getWorkableFormRoot();
  const results: WorkableCandidateField[] = [];
  const seen = new Set<string>();

  const mark = (key: string): boolean => {
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  };

  form.querySelectorAll<HTMLElement>("[role='radiogroup']").forEach((fieldset, index) => {
    if (isInsideExtension(fieldset) || isInsideResumeImportWidget(fieldset)) {
      return;
    }
    const optionVisible = Array.from(
      fieldset.querySelectorAll<HTMLElement>("[role='radio'], [data-ui='option']"),
    ).some(isVisibleElement);
    if (!isVisibleElement(fieldset) && !optionVisible) return;
    if (!isWorkableRadioGroupEmpty(fieldset)) return;

    const label = getRadioGroupLabel(fieldset);
    const id =
      fieldset.getAttribute("data-ui") ||
      fieldset.getAttribute("id") ||
      `radio-group-${index}`;
    if (!mark(`radio:${id}`)) return;

    results.push({
      element: fieldset,
      label,
      required: isWorkableFieldRequired(fieldset),
      kind: "radio-group",
      options: extractWorkableRadioOptions(fieldset),
    });
  });

  form
    .querySelectorAll<HTMLInputElement>(
      "[data-input-type='select'] input[role='combobox'], input[role='combobox']",
    )
    .forEach((element, index) => {
      if (isInsideExtension(element) || isInsideResumeImportWidget(element)) {
        return;
      }
      if (!isVisibleElement(element)) return;
      if (getComboboxDisplayValue(element)) return;

      const wrapper = getComboboxWrapper(element);
      const id =
        wrapper?.getAttribute("data-ui") ||
        element.getAttribute("id") ||
        `combobox-${index}`;
      if (!mark(id)) return;

      results.push({
        element,
        label: getWorkableFieldLabel(element),
        required:
          isWorkableFieldRequired(element) ||
          !!wrapper?.querySelector("input[required], input[aria-required='true']"),
        kind: "combobox",
      });
    });

  form.querySelectorAll<HTMLElement>("input, textarea, select").forEach((element) => {
    if (isInsideExtension(element) || isInsideResumeImportWidget(element)) {
      return;
    }
    if (element.closest("[role='radiogroup']")) return;
    if (element.closest("[data-input-type='select']")) return;
    if (isComboboxInput(element)) return;
    if (isHiddenBackingInput(element)) return;
    if (!isVisibleElement(element)) return;

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) return;
    }

    const id =
      element.getAttribute("id") ||
      element.getAttribute("name") ||
      `${results.length}`;
    if (!mark(id)) return;

    if (element instanceof HTMLSelectElement) {
      if (!isWorkableTextEmpty(element)) return;
      results.push({
        element,
        label: getWorkableFieldLabel(element),
        required: isWorkableFieldRequired(element),
        kind: "select",
        options: getNativeSelectOptions(element),
      });
      return;
    }

    if (!isWorkableTextEmpty(element)) return;

    results.push({
      element,
      label: getWorkableFieldLabel(element),
      required: isWorkableFieldRequired(element),
      kind: "text",
    });
  });

  return results;
};

/**
 * Scans the Workable application form and builds an API payload
 * for fields that remain empty after Workable's resume autofill.
 */
export const scanWorkableHtmlToMakeApiPayload = async (
  options: WorkableScanToMakeApiOptions = {},
): Promise<WorkableScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectWorkableCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "text") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "text",
      });
      continue;
    }

    if (candidate.kind === "radio-group") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: candidate.options ?? extractWorkableRadioOptions(candidate.element),
      });
      continue;
    }

    if (candidate.kind === "select") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options:
          candidate.options ??
          getNativeSelectOptions(candidate.element as HTMLSelectElement),
      });
      continue;
    }

    const comboboxOptions = await openAndScanWorkableComboboxOptions(
      candidate.element as HTMLInputElement,
    );
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
    source: "workable",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
