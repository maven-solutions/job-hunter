import { fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  collectIcimsCandidateFields,
  getIcimsFieldLabel,
  getIcimsFormDocument,
  isHtmlTextArea,
  isIcimsRequiredField,
} from "./scan.icims";
import {
  AiFieldScannerOptions,
  AiFormElement,
  RequestFieldAnswerFn,
} from "./types";

const SCAN_ICON_CLASS = "careerai-icims-scan-field-icon";
const SCAN_ICON_WRAPPER_CLASS = "careerai-icims-scan-icon-wrapper";
const SCAN_STYLE_ID = "careerai-icims-scan-html-styles";

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

const injectScanStyles = (doc: Document = getIcimsFormDocument()): void => {
  if (doc.getElementById(SCAN_STYLE_ID)) {
    return;
  }

  const style = doc.createElement("style");
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
  (doc.head || doc.documentElement).appendChild(style);
};

const findIconAnchor = (element: HTMLElement): HTMLElement => {
  const cell = element.closest(
    ".iCIMS_InfoData, .iCIMS_TableCell, .iCIMS_TableRow",
  ) as HTMLElement | null;
  if (cell) return cell;
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
  required: isIcimsRequiredField(entry.element),
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

const attachIconToField = (element: HTMLTextAreaElement): void => {
  const doc = element.ownerDocument || getIcimsFormDocument();
  const view = doc.defaultView || window;
  const anchor = findIconAnchor(element);
  if (anchor.querySelector(`.${SCAN_ICON_WRAPPER_CLASS}`)) {
    return;
  }

  const computed = view.getComputedStyle(anchor);
  if (computed.position === "static") {
    anchor.style.position = "relative";
  }

  const label = getIcimsFieldLabel(element);
  const id =
    element.getAttribute("id") ||
    element.getAttribute("name") ||
    `${fromatStirngInLowerCase(label)}-${scannedFields.size}`;

  const entry: ScannableFieldEntry = {
    data: {
      id,
      label,
      fieldType: "textarea",
      currentValue: getCurrentValue(element),
    },
    element,
  };
  scannedFields.set(id, entry);

  const wrapper = doc.createElement("div");
  wrapper.className = SCAN_ICON_WRAPPER_CLASS;

  const button = doc.createElement("button");
  button.type = "button";
  button.className = SCAN_ICON_CLASS;
  button.title = `Autofill: ${label}`;
  button.setAttribute("aria-label", `Autofill ${label}`);
  setIconState(button, "default");

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIconState(button, "loading");

    try {
      entry.data.currentValue = getCurrentValue(element);
      const answer = await requestAiAnswerForField(entry);
      const applied = await fillTextareaField(element, answer);
      if (!applied) {
        throw new Error(`Could not apply answer: ${answer}`);
      }
      setIconState(button, "filled");
    } catch (error) {
      console.error("[CareerAI FieldAI:icims]", error);
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

/**
 * Scans the iCIMS page and injects field icons on textareas only.
 * Other inputs / selects are filled via full Autofill with AI.
 * Targets `#icims_content_iframe` document when the form is framed.
 */
export const initIcimsHtmlScanner = (
  _applicantData: ApplicantContext | null = null,
  options: AiFieldScannerOptions = {},
): number => {
  const doc = getIcimsFormDocument();
  injectScanStyles(doc);
  removeIcimsHtmlScannerIcons();
  requestFieldAnswerFn = options.requestFieldAnswer ?? null;

  const textareas = collectIcimsCandidateFields()
    .filter(
      (f): f is typeof f & { element: HTMLTextAreaElement } =>
        f.kind === "text" && isHtmlTextArea(f.element),
    )
    .map((f) => f.element);

  textareas.forEach((element) => attachIconToField(element));
  return textareas.length;
};

export const removeIcimsHtmlScannerIcons = (): void => {
  const doc = getIcimsFormDocument();
  doc
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  // Also clear any leftovers on the top document
  document
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  scannedFields.clear();
  requestFieldAnswerFn = null;
};

export const getIcimsScannedFieldCount = (): number => scannedFields.size;
