import { fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { collectAmazonCandidateFields } from "./scan.amazon";
import {
  AiFieldScannerOptions,
  AiFormElement,
  RequestFieldAnswerFn,
} from "./types";

const SCAN_ICON_CLASS = "careerai-amazon-scan-field-icon";
const SCAN_ICON_WRAPPER_CLASS = "careerai-amazon-scan-icon-wrapper";
const SCAN_STYLE_ID = "careerai-amazon-scan-html-styles";

/** Per-field icons are textarea-only on amazon.jobs (same as Greenhouse). */
export type ScannableFieldType = "textarea";

export interface ScannableFieldData {
  id: string;
  label: string;
  fieldType: ScannableFieldType;
  currentValue: string;
}

export type ApplicantContext = Record<string, unknown>;

interface ScannableFieldEntry {
  data: ScannableFieldData;
  element: HTMLTextAreaElement;
}

const scannedFields = new Map<string, ScannableFieldEntry>();
let requestFieldAnswerFn: RequestFieldAnswerFn | null = null;

const getCurrentValue = (element: HTMLTextAreaElement): string =>
  element.value?.trim() ?? "";

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
  const entry = element.closest(
    ".text-field, .form-group, .contact-information",
  ) as HTMLElement | null;
  if (entry) return entry;
  return (element.parentElement as HTMLElement) || element;
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
  required: false,
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

const fillTextareaField = async (
  element: HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  element.focus();
  element.value = answer;
  await handleValueChanges(element);
  return true;
};

const applyScannedFieldAnswer = async (
  entry: ScannableFieldEntry,
  answer: string,
): Promise<boolean> => fillTextareaField(entry.element, answer);

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

      const applied = await applyScannedFieldAnswer(entry, answer);
      if (!applied) {
        throw new Error(`Could not apply answer: ${answer}`);
      }

      setIconState(button, "filled");
    } catch (error) {
      console.error("[CareerAI FieldAI:amazon]", error);
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

/**
 * Scans the amazon.jobs application form and injects field icons on
 * **textareas only**. Contact-info inputs/selects are filled via full
 * Autofill with AI. Later sections with textareas will pick up icons.
 */
export const initAmazonHtmlScanner = (
  _applicantData: ApplicantContext | null = null,
  options: AiFieldScannerOptions = {},
): number => {
  injectScanStyles();
  removeAmazonHtmlScannerIcons();
  requestFieldAnswerFn = options.requestFieldAnswer ?? null;

  const textareaCandidates = collectAmazonCandidateFields().filter(
    (
      candidate,
    ): candidate is typeof candidate & { element: HTMLTextAreaElement } =>
      candidate.element instanceof HTMLTextAreaElement,
  );

  textareaCandidates.forEach((candidate, index) => {
    const id =
      candidate.element.getAttribute("id") ||
      candidate.element.getAttribute("name") ||
      `${fromatStirngInLowerCase(candidate.label)}-${index}`;

    const entry: ScannableFieldEntry = {
      data: {
        id,
        label: candidate.label,
        fieldType: "textarea",
        currentValue: getCurrentValue(candidate.element),
      },
      element: candidate.element,
    };

    attachIconToField(entry);
  });

  return textareaCandidates.length;
};

export const removeAmazonHtmlScannerIcons = (): void => {
  document
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  scannedFields.clear();
  requestFieldAnswerFn = null;
};

export const getAmazonScannedFieldCount = (): number => scannedFields.size;
