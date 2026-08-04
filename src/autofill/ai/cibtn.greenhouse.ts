import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  AiFieldScannerOptions,
  AiFormElement,
  RequestFieldAnswerFn,
} from "./types";

const SCAN_ICON_CLASS = "careerai-scan-field-icon";
const SCAN_ICON_WRAPPER_CLASS = "careerai-scan-icon-wrapper";
const SCAN_STYLE_ID = "careerai-scan-html-styles";

export type ScannableFieldType =
  | "text"
  | "textarea"
  | "tel"
  | "email"
  | "url"
  | "number"
  | "select"
  | "combobox";

export interface ScannableFieldData {
  id: string;
  label: string;
  fieldType: ScannableFieldType;
  currentValue: string;
  options?: string[];
  autocomplete?: string;
}

export type ApplicantContext = Record<string, unknown>;

interface ScannableFieldEntry {
  data: ScannableFieldData;
  element: HTMLElement;
  selectElement: HTMLSelectElement | null;
}

const scannedFields = new Map<string, ScannableFieldEntry>();
/** Single-field AI fill callback (same job-application-fill API as full scan). */
let requestFieldAnswerFn: RequestFieldAnswerFn | null = null;

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "checkbox",
  "radio",
  "password",
  "search",
]);

const cleanLabelText = (text: string): string =>
  text.replace(/\*/g, "").replace(/\s+/g, " ").trim();

const isRequiredField = (element: HTMLElement): boolean => {
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
  const label =
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) ||
    element
      .closest(".field-wrapper, .select__container, .input-wrapper")
      ?.querySelector("label");
  return !!label?.textContent?.includes("*");
};

const isInsideExtension = (element: Element): boolean => {
  return !!element.closest(
    `#${EXTENSION_ROOT_ID}, .${SCAN_ICON_WRAPPER_CLASS}`,
  );
};

const isVisibleField = (element: HTMLElement): boolean => {
  if (element.closest(".visually-hidden, [aria-hidden='true']")) {
    return false;
  }
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }
  if (element.classList.contains("remix-css-1a0ro4n-requiredInput")) {
    return false;
  }
  if (element.classList.contains("iti__search-input")) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

const getFieldLabel = (element: HTMLElement): string => {
  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return cleanLabelText(ariaLabel);
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(" ")[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  const wrapperLabel = element
    .closest(
      ".field-wrapper, .input-wrapper, .select__container, .text-input-wrapper",
    )
    ?.querySelector("label");
  if (wrapperLabel?.textContent) {
    return cleanLabelText(wrapperLabel.textContent);
  }

  return id ?? "Unknown field";
};

const getFieldType = (element: HTMLElement): ScannableFieldType | null => {
  if (element instanceof HTMLTextAreaElement) {
    return "textarea";
  }

  if (element instanceof HTMLSelectElement) {
    return "select";
  }

  if (element instanceof HTMLInputElement) {
    if (element.getAttribute("role") === "combobox") {
      return "combobox";
    }

    const type = (element.type || "text").toLowerCase();
    if (SKIP_INPUT_TYPES.has(type)) {
      return null;
    }
    if (type === "tel") return "tel";
    if (type === "email") return "email";
    if (type === "url") return "url";
    if (type === "number") return "number";
    return "text";
  }

  return null;
};

const getCurrentValue = (
  element: HTMLElement,
  fieldType: ScannableFieldType,
): string => {
  if (element instanceof HTMLSelectElement) {
    return (
      element.options[element.selectedIndex]?.text?.trim() ?? element.value
    );
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    if (fieldType === "combobox") {
      const selected = element
        .closest(".select-shell, .select")
        ?.querySelector(".select__single-value");
      if (selected?.textContent) {
        return cleanLabelText(selected.textContent);
      }
      const placeholder = element
        .closest(".select-shell, .select")
        ?.querySelector(".select__placeholder");
      if (placeholder?.textContent && !element.value) {
        return "";
      }
    }
    return element.value?.trim() ?? "";
  }

  return "";
};

const buildFieldId = (element: HTMLElement, label: string): string => {
  return (
    element.getAttribute("id") ||
    element.getAttribute("name") ||
    `${fromatStirngInLowerCase(label)}-${scannedFields.size}`
  );
};

const extractFieldData = (element: HTMLElement): ScannableFieldData | null => {
  const fieldType = getFieldType(element);
  if (!fieldType) {
    return null;
  }

  const label = getFieldLabel(element);
  const id = buildFieldId(element, label);

  return {
    id,
    label,
    fieldType,
    currentValue: getCurrentValue(element, fieldType),
    autocomplete: element.getAttribute("autocomplete") ?? undefined,
  };
};

const findAutofillableElements = (): HTMLElement[] => {
  const candidates = document.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );
  const results: HTMLElement[] = [];
  const seenIds = new Set<string>();

  candidates.forEach((element) => {
    if (isInsideExtension(element) || !isVisibleField(element)) {
      return;
    }

    const fieldType = getFieldType(element);
    if (!fieldType) {
      return;
    }

    if (fieldType === "combobox" && element.getAttribute("tabindex") === "-1") {
      return;
    }

    const id = buildFieldId(element, getFieldLabel(element));
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);
    results.push(element);
  });

  return results;
};

const injectScanStyles = (): void => {
  if (document.getElementById(SCAN_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = SCAN_STYLE_ID;
  style.textContent = `
    .${SCAN_ICON_WRAPPER_CLASS} {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      z-index: 2147483646;
      pointer-events: auto;
    }
    .${SCAN_ICON_CLASS} {
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 50%;
      background: #0145fd;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      padding: 0;
      line-height: 1;
    }
    .${SCAN_ICON_CLASS}:hover {
      background: #0035c8;
    }
    .${SCAN_ICON_CLASS}--loading {
      background: #f59e0b;
      cursor: wait;
    }
    .${SCAN_ICON_CLASS}--filled {
      background: #16a34a;
    }
    .${SCAN_ICON_CLASS}--error {
      background: #dc2626;
    }
  `;
  document.head.appendChild(style);
};

const findIconAnchor = (element: HTMLElement): HTMLElement => {
  return (
    (element.closest(
      ".input-wrapper, .select__container, .field-wrapper, .text-input-wrapper, .phone-input__phone, .select",
    ) as HTMLElement) || element.parentElement!
  );
};

const setIconState = (
  button: HTMLButtonElement,
  state: "default" | "loading" | "filled" | "error",
): void => {
  button.classList.remove(
    `${SCAN_ICON_CLASS}--loading`,
    `${SCAN_ICON_CLASS}--filled`,
    `${SCAN_ICON_CLASS}--error`,
  );

  switch (state) {
    case "loading":
      button.textContent = "...";
      button.classList.add(`${SCAN_ICON_CLASS}--loading`);
      button.disabled = true;
      break;
    case "filled":
      button.textContent = "✓";
      button.classList.add(`${SCAN_ICON_CLASS}--filled`);
      button.disabled = true;
      break;
    case "error":
      button.textContent = "!";
      button.classList.add(`${SCAN_ICON_CLASS}--error`);
      button.disabled = false;
      break;
    default:
      button.textContent = "C";
      button.disabled = false;
  }
};

/**
 * Build a one-element API payload for this field (same shape as full form scan).
 * Combobox/select options are collected first so the model can pick a valid value.
 */
const buildApiElementForField = async (
  entry: ScannableFieldEntry,
): Promise<AiFormElement> => {
  const { data, element, selectElement } = entry;
  const required = isRequiredField(element);

  if (data.fieldType === "select" && selectElement) {
    const options = Array.from(selectElement.options)
      .map((opt) => cleanLabelText(opt.textContent ?? opt.value))
      .filter((label) => {
        if (!label) return false;
        if (/select|choose|---/i.test(label)) return false;
        return true;
      });
    return {
      label: data.label,
      required,
      type: "search",
      options,
    };
  }

  if (data.fieldType === "combobox" && element instanceof HTMLInputElement) {
    const scanned = await openToggleAndScanOptions(element);
    closeCombobox();
    await delay(150);
    const options = scanned.map((opt) => opt.label);
    return {
      label: data.label,
      required,
      type: "search",
      ...(options.length > 0 ? { options } : {}),
    };
  }

  return {
    label: data.label,
    required,
    type: "text",
  };
};

/**
 * Request AI answer for one field via job-application-fill API
 * (same endpoint as full-page scan in scanHtmlToMakeApi).
 */
const requestAiAnswerForField = async (
  entry: ScannableFieldEntry,
): Promise<string> => {
  if (!requestFieldAnswerFn) {
    throw new Error(
      "AI fill is not ready. Run Autofill with AI once first.",
    );
  }

  const apiElement = await buildApiElementForField(entry);
  const answer = await requestFieldAnswerFn(apiElement);
  if (!answer) {
    throw new Error("No answer returned from AI fill API");
  }
  return answer;
};

const matchOption = (answer: string, options: string[]): string | null => {
  const normalizedAnswer = fromatStirngInLowerCase(answer);

  for (const option of options) {
    if (fromatStirngInLowerCase(option) === normalizedAnswer) {
      return option;
    }
  }

  for (const option of options) {
    const normalizedOption = fromatStirngInLowerCase(option);
    if (
      normalizedOption?.includes(normalizedAnswer ?? "") ||
      normalizedAnswer?.includes(normalizedOption ?? "")
    ) {
      return option;
    }
  }

  return null;
};

const isGenderField = (fieldData: ScannableFieldData): boolean => {
  const labelKey = fromatStirngInLowerCase(fieldData.label) ?? "";
  const idKey = fromatStirngInLowerCase(fieldData.id) ?? "";
  return labelKey.includes("gender") || idKey.includes("gender");
};

const matchGenderOption = (
  answer: string,
  options: string[],
): string | null => {
  const direct = matchOption(answer, options);
  if (direct) {
    return direct;
  }

  const normalizedAnswer = fromatStirngInLowerCase(answer) ?? "";
  const aliases: Record<string, string[]> = {
    male: ["male", "man", "m"],
    female: ["female", "woman", "f"],
    nonbinary: ["nonbinary", "nonbinary/genderqueer", "genderqueer", "nb"],
  };

  let targetKeys: string[] = [];
  if (
    normalizedAnswer.includes("male") &&
    !normalizedAnswer.includes("female")
  ) {
    targetKeys = aliases.male;
  } else if (normalizedAnswer.includes("female")) {
    targetKeys = aliases.female;
  } else if (
    normalizedAnswer.includes("non") ||
    normalizedAnswer.includes("binary")
  ) {
    targetKeys = aliases.nonbinary;
  }

  for (const option of options) {
    const normalizedOption = fromatStirngInLowerCase(option) ?? "";
    if (targetKeys.some((alias) => normalizedOption.includes(alias))) {
      return option;
    }
  }

  return null;
};

const getComboboxToggleButton = (
  element: HTMLInputElement,
): HTMLButtonElement | null => {
  return element
    .closest(".select-shell, .select__container, .select")
    ?.querySelector(
      'button[aria-label="Toggle flyout"]',
    ) as HTMLButtonElement | null;
};

const closeCombobox = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

interface ScannedSelectOption {
  label: string;
  element: HTMLElement;
}

const clickToggleFlyout = (toggleBtn: HTMLButtonElement): void => {
  toggleBtn.focus();
  toggleBtn.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  toggleBtn.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  toggleBtn.click();
};

const waitForDomUpdate = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
};

const isNodeVisible = (node: HTMLElement): boolean => {
  if (!node.isConnected) {
    return false;
  }
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const scanSelectOptionsFromDom = (
  element: HTMLInputElement,
): ScannedSelectOption[] => {
  const results: ScannedSelectOption[] = [];
  const seen = new Set<string>();

  const addOption = (optionEl: HTMLElement) => {
    const label = cleanLabelText(optionEl.textContent ?? "");
    if (!label || seen.has(label)) {
      return;
    }
    seen.add(label);
    results.push({ label, element: optionEl });
  };

  if (element.id) {
    const listbox = document.getElementById(
      `react-select-${element.id}-listbox`,
    );
    listbox
      ?.querySelectorAll<HTMLElement>(".select__option[role='option']")
      .forEach(addOption);
  }

  document.querySelectorAll<HTMLElement>(".select__menu").forEach((menu) => {
    if (element.id) {
      const linkedListbox = menu.querySelector(
        `#react-select-${element.id}-listbox`,
      );
      if (linkedListbox) {
        linkedListbox
          .querySelectorAll<HTMLElement>(".select__option[role='option']")
          .forEach(addOption);
        return;
      }
    }

    if (isNodeVisible(menu)) {
      menu
        .querySelectorAll<HTMLElement>(".select__option[role='option']")
        .forEach(addOption);
    }
  });

  if (results.length === 0) {
    document
      .querySelectorAll<HTMLElement>(
        `[id="react-select-${element.id}-listbox"] .select__option, .select__menu-list [role="option"]`,
      )
      .forEach(addOption);
  }

  return results;
};

const openToggleAndScanOptions = async (
  element: HTMLInputElement,
): Promise<ScannedSelectOption[]> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeCombobox();
    await delay(150);
  }

  const toggleBtn = getComboboxToggleButton(element);
  if (!toggleBtn) {
    return [];
  }

  clickToggleFlyout(toggleBtn);
  await delay(300);
  await waitForDomUpdate();

  let scanned = scanSelectOptionsFromDom(element);

  if (scanned.length === 0) {
    await delay(200);
    await waitForDomUpdate();
    scanned = scanSelectOptionsFromDom(element);
  }

  return scanned;
};

const clickOptionElement = (optionEl: HTMLElement): void => {
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  optionEl.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, cancelable: true }),
  );
  optionEl.click();
};

const selectFromScannedOptions = async (
  element: HTMLInputElement,
  answer: string,
  scannedOptions: ScannedSelectOption[],
  matcher: (answer: string, options: string[]) => string | null = matchOption,
): Promise<boolean> => {
  if (scannedOptions.length === 0) {
    return false;
  }

  const labels = scannedOptions.map((opt) => opt.label);
  const matchedLabel = matcher(answer, labels);

  if (!matchedLabel) {
    closeCombobox();
    return false;
  }

  const target = scannedOptions.find((opt) => opt.label === matchedLabel);
  if (!target) {
    closeCombobox();
    return false;
  }

  clickOptionElement(target.element);
  await delay(300);
  await handleValueChanges(element);

  const selectedValue = element
    .closest(".select-shell, .select")
    ?.querySelector(".select__single-value");

  return (
    element.getAttribute("aria-expanded") === "false" ||
    !!selectedValue?.textContent?.trim()
  );
};

const fillGreenhouseCombobox = async (
  element: HTMLInputElement,
  answer: string,
  matcher: (answer: string, options: string[]) => string | null = matchOption,
): Promise<boolean> => {
  const scannedOptions = await openToggleAndScanOptions(element);
  return selectFromScannedOptions(element, answer, scannedOptions, matcher);
};

const fillGenderCombobox = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  return fillGreenhouseCombobox(element, answer, matchGenderOption);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  const options = Array.from(select.options).map((opt) =>
    cleanLabelText(opt.textContent ?? opt.value),
  );
  const matched = matchOption(answer, options);
  if (!matched) {
    return false;
  }

  for (const option of select.options) {
    const optionText = cleanLabelText(option.textContent ?? option.value);
    if (optionText === matched) {
      select.value = option.value;
      await handleValueChanges(select);
      return true;
    }
  }

  return false;
};

const fillCombobox = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  return fillGreenhouseCombobox(element, answer, matchOption);
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  element.focus();
  element.value = answer;
  await handleValueChanges(element);
  return true;
};

export const applyScannedFieldAnswer = async (
  entry: ScannableFieldEntry,
  answer: string,
): Promise<boolean> => {
  const { element, data, selectElement } = entry;

  if (data.fieldType === "select" && selectElement) {
    return fillNativeSelect(selectElement, answer);
  }

  if (data.fieldType === "combobox" && element instanceof HTMLInputElement) {
    if (isGenderField(data)) {
      return fillGenderCombobox(element, answer);
    }
    return fillCombobox(element, answer);
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(element, answer);
  }

  return false;
};

const attachIconToField = (element: HTMLElement): void => {
  const anchor = findIconAnchor(element);
  if (anchor.querySelector(`.${SCAN_ICON_WRAPPER_CLASS}`)) {
    return;
  }

  const computed = window.getComputedStyle(anchor);
  if (computed.position === "static") {
    anchor.style.position = "relative";
  }

  const fieldData = extractFieldData(element);
  if (!fieldData) {
    return;
  }

  const entry: ScannableFieldEntry = {
    data: fieldData,
    element,
    selectElement: element instanceof HTMLSelectElement ? element : null,
  };
  scannedFields.set(fieldData.id, entry);

  const wrapper = document.createElement("div");
  wrapper.className = SCAN_ICON_WRAPPER_CLASS;

  const button = document.createElement("button");
  button.type = "button";
  button.className = SCAN_ICON_CLASS;
  button.title = `Autofill: ${fieldData.label}`;
  button.setAttribute("aria-label", `Autofill ${fieldData.label}`);
  setIconState(button, "default");

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIconState(button, "loading");

    try {
      entry.data.currentValue = getCurrentValue(element, entry.data.fieldType);

      const answer = await requestAiAnswerForField(entry);

      const applied = await applyScannedFieldAnswer(entry, answer);
      if (!applied) {
        throw new Error(`Could not apply answer: ${answer}`);
      }

      setIconState(button, "filled");
    } catch (error) {
      console.error("[CareerAI FieldAI:greenhouse]", error);
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

/**
 * Scans the Greenhouse page body for autofillable inputs, textareas, and selects,
 * then injects a small icon on each field (Grammarly-style).
 *
 * Field icon clicks call the AI job-application-fill API for that one field
 * via `options.requestFieldAnswer` (wired from scanHtmlToMakeApi).
 */
export const initGreenhouseHtmlScanner = (
  _applicantData: ApplicantContext | null = null,
  options: AiFieldScannerOptions = {},
): number => {
  injectScanStyles();
  removeGreenhouseHtmlScannerIcons();
  requestFieldAnswerFn = options.requestFieldAnswer ?? null;

  const elements = findAutofillableElements();
  elements.forEach((element) => attachIconToField(element));

  return elements.length;
};

export const removeGreenhouseHtmlScannerIcons = (): void => {
  document
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  scannedFields.clear();
  requestFieldAnswerFn = null;
};

export const getGreenhouseScannedFieldCount = (): number => scannedFields.size;
