import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  AiFieldScannerOptions,
  AiFormElement,
  RequestFieldAnswerFn,
} from "./types";

const SCAN_ICON_CLASS = "careerai-scan-field-icon";
const SCAN_ICON_WRAPPER_CLASS = "careerai-scan-icon-wrapper";
const SCAN_STYLE_ID = "careerai-scan-html-styles";

/** Per-field icons are textarea-only on Greenhouse. */
export type ScannableFieldType = "textarea";

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
}

const scannedFields = new Map<string, ScannableFieldEntry>();
/** Single-field AI fill callback (same job-application-fill API as full scan). */
let requestFieldAnswerFn: RequestFieldAnswerFn | null = null;

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

const getCurrentValue = (element: HTMLElement): string => {
  if (element instanceof HTMLTextAreaElement) {
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
  if (!(element instanceof HTMLTextAreaElement)) {
    return null;
  }

  const label = getFieldLabel(element);
  const id = buildFieldId(element, label);

  return {
    id,
    label,
    fieldType: "textarea",
    currentValue: getCurrentValue(element),
    autocomplete: element.getAttribute("autocomplete") ?? undefined,
  };
};

/**
 * Find fields that get the per-field "C" icon.
 * Greenhouse: **textarea only** (inputs, selects, comboboxes use full Autofill with AI).
 */
const findAutofillableElements = (): HTMLElement[] => {
  const candidates = document.querySelectorAll<HTMLTextAreaElement>("textarea");
  const results: HTMLElement[] = [];
  const seenIds = new Set<string>();

  candidates.forEach((element) => {
    if (isInsideExtension(element) || !isVisibleField(element)) {
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
      left: 8px;
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
 * Build a one-element API payload for this textarea (same shape as full form scan).
 */
const buildApiElementForField = (entry: ScannableFieldEntry): AiFormElement => {
  return {
    label: entry.data.label,
    required: isRequiredField(entry.element),
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
    throw new Error("AI fill is not ready. Run Autofill with AI once first.");
  }

  const answer = await requestFieldAnswerFn(buildApiElementForField(entry));
  if (!answer) {
    throw new Error("No answer returned from AI fill API");
  }
  return answer;
};

const fillTextareaField = async (
  element: HTMLTextAreaElement,
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
  if (entry.element instanceof HTMLTextAreaElement) {
    return fillTextareaField(entry.element, answer);
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
      entry.data.currentValue = getCurrentValue(element);
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
 * Scans the Greenhouse page and injects field icons on **textareas only**.
 * Inputs, selects, and comboboxes are filled only via full Autofill with AI.
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
