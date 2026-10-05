import { handleValueChanges } from "../helper";
import { collectSearchCareersCandidateFields } from "./scan.searchcareers";
import {
  AiFieldScannerOptions,
  AiFormElement,
  RequestFieldAnswerFn,
} from "./types";

const SCAN_ICON_CLASS = "careerai-searchcareers-scan-field-icon";
const SCAN_ICON_WRAPPER_CLASS = "careerai-searchcareers-scan-icon-wrapper";
const SCAN_STYLE_ID = "careerai-searchcareers-scan-html-styles";

export type ScannableFieldType = "text" | "textarea";

export interface ScannableFieldData {
  id: string;
  label: string;
  fieldType: ScannableFieldType;
  currentValue: string;
  required: boolean;
}

export type ApplicantContext = Record<string, unknown>;

interface ScannableFieldEntry {
  data: ScannableFieldData;
  element: HTMLInputElement | HTMLTextAreaElement;
}

const scannedFields = new Map<string, ScannableFieldEntry>();
let requestFieldAnswerFn: RequestFieldAnswerFn | null = null;

const getCurrentValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
): string => element.value?.trim() ?? "";

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
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
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
  const field = element.closest<HTMLElement>(
    "[class*='field-'], [class*='input-module_input-wrapper']",
  );
  return field || element.parentElement || element;
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

const buildApiElementForField = (entry: ScannableFieldEntry): AiFormElement => ({
  label: entry.data.label,
  required: entry.data.required,
  type: "text",
});

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

const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  return !!element.value?.trim();
};

const attachIconToField = (entry: ScannableFieldEntry): void => {
  const { element, data } = entry;
  const anchor = findIconAnchor(element);

  if (anchor.querySelector(`.${SCAN_ICON_WRAPPER_CLASS}`)) {
    return;
  }

  const computed = window.getComputedStyle(anchor);
  if (computed.position === "static") {
    anchor.style.position = "relative";
  }

  scannedFields.set(data.id, entry);

  const wrapper = document.createElement("div");
  wrapper.className = SCAN_ICON_WRAPPER_CLASS;

  const button = document.createElement("button");
  button.type = "button";
  button.className = SCAN_ICON_CLASS;
  button.title = `Autofill: ${data.label}`;
  button.setAttribute("aria-label", `Autofill ${data.label}`);
  setIconState(button, "default");

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIconState(button, "loading");

    try {
      entry.data.currentValue = getCurrentValue(element);
      const answer = await requestAiAnswerForField(entry);
      const applied = await fillTextLikeField(element, answer);
      if (!applied) {
        throw new Error(`Could not apply answer: ${answer}`);
      }
      setIconState(button, "filled");
    } catch (error) {
      console.error("[CareerAI FieldAI:searchcareers]", error);
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

/**
 * Scans the SearchCareers application form and injects field icons on
 * text inputs and textareas. Dropdowns and checkboxes are filled by the
 * full Autofill with AI action.
 */
export const initSearchCareersHtmlScanner = (
  _applicantData: ApplicantContext | null = null,
  options: AiFieldScannerOptions = {},
): number => {
  injectScanStyles();
  removeSearchCareersHtmlScannerIcons();
  requestFieldAnswerFn = options.requestFieldAnswer ?? null;

  const textFields = collectSearchCareersCandidateFields().filter(
    (
      candidate,
    ): candidate is typeof candidate & {
      element: HTMLInputElement | HTMLTextAreaElement;
    } =>
      candidate.kind === "text" &&
      (candidate.element instanceof HTMLInputElement ||
        candidate.element instanceof HTMLTextAreaElement),
  );

  textFields.forEach((candidate, index) => {
    const id =
      candidate.element.getAttribute("id") ||
      candidate.element.getAttribute("name") ||
      `searchcareers-${index}`;

    attachIconToField({
      data: {
        id,
        label: candidate.label,
        fieldType:
          candidate.element instanceof HTMLTextAreaElement ? "textarea" : "text",
        currentValue: getCurrentValue(candidate.element),
        required: candidate.required,
      },
      element: candidate.element,
    });
  });

  return textFields.length;
};

export const removeSearchCareersHtmlScannerIcons = (): void => {
  document
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  scannedFields.clear();
  requestFieldAnswerFn = null;
};

export const getSearchCareersScannedFieldCount = (): number => scannedFields.size;
