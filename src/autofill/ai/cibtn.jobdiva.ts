import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { fromatStirngInLowerCase } from "../helper";
import { fillJobdivaTextControl } from "./autofill.jobdiva";
import { collectJobdivaCandidateFields } from "./scan.jobdiva";
import {
  AiFieldScannerOptions,
  AiFormElement,
  RequestFieldAnswerFn,
} from "./types";

const SCAN_ICON_CLASS = "careerai-jobdiva-scan-field-icon";
const SCAN_ICON_WRAPPER_CLASS = "careerai-jobdiva-scan-icon-wrapper";
const SCAN_STYLE_ID = "careerai-jobdiva-scan-html-styles";

export interface ScannableFieldData {
  id: string;
  label: string;
  required: boolean;
  currentValue: string;
}

export type ApplicantContext = Record<string, unknown>;

interface ScannableFieldEntry {
  data: ScannableFieldData;
  element: HTMLInputElement | HTMLTextAreaElement;
}

const scannedFields = new Map<string, ScannableFieldEntry>();
let requestFieldAnswerFn: RequestFieldAnswerFn | null = null;

const injectScanStyles = (): void => {
  if (document.getElementById(SCAN_STYLE_ID)) return;

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

const findIconAnchor = (element: HTMLElement): HTMLElement =>
  (element.closest(".jd-form-layout") as HTMLElement) ||
  element.parentElement ||
  element;

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

const attachIconToField = (entry: ScannableFieldEntry): void => {
  const anchor = findIconAnchor(entry.element);
  if (anchor.closest(`#${EXTENSION_ROOT_ID}`)) return;
  if (anchor.querySelector(`.${SCAN_ICON_WRAPPER_CLASS}`)) return;

  const computed = window.getComputedStyle(anchor);
  if (computed.position === "static") {
    anchor.style.position = "relative";
  }

  scannedFields.set(entry.data.id, entry);

  const wrapper = document.createElement("div");
  wrapper.className = SCAN_ICON_WRAPPER_CLASS;

  const button = document.createElement("button");
  button.type = "button";
  button.className = SCAN_ICON_CLASS;
  button.title = `Autofill: ${entry.data.label}`;
  button.setAttribute("aria-label", `Autofill ${entry.data.label}`);
  setIconState(button, "default");

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIconState(button, "loading");

    try {
      entry.data.currentValue = entry.element.value?.trim() ?? "";
      const answer = await requestAiAnswerForField(entry);
      const applied = await fillJobdivaTextControl(entry.element, answer);
      if (!applied) {
        throw new Error(`Could not apply answer for ${entry.data.label}`);
      }
      setIconState(button, "filled");
    } catch (error) {
      console.error("[CareerAI FieldAI:jobdiva]", error);
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

const collectIconFields = (): ScannableFieldEntry[] => {
  const entries: ScannableFieldEntry[] = [];

  collectJobdivaCandidateFields().forEach((field) => {
    if (field.kind !== "text") return;
    if (
      !(field.element instanceof HTMLInputElement) &&
      !(field.element instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    const id =
      field.element.id ||
      field.element.getAttribute("name") ||
      `${fromatStirngInLowerCase(field.label) ?? "field"}-${entries.length}`;

    entries.push({
      element: field.element,
      data: {
        id,
        label: field.label,
        required: field.required,
        currentValue: field.element.value?.trim() ?? "",
      },
    });
  });

  return entries;
};

/**
 * Marks visible JobDiva text fields and textareas with a field icon.
 * Password, select, and combobox fields are filled by the full Autofill with AI action.
 */
export const initJobdivaHtmlScanner = (
  _applicantData: ApplicantContext | null = null,
  options: AiFieldScannerOptions = {},
): number => {
  injectScanStyles();
  removeJobdivaHtmlScannerIcons();
  requestFieldAnswerFn = options.requestFieldAnswer ?? null;

  const entries = collectIconFields();
  entries.forEach((entry) => attachIconToField(entry));
  return entries.length;
};

export const removeJobdivaHtmlScannerIcons = (): void => {
  document
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  scannedFields.clear();
  requestFieldAnswerFn = null;
};

export const getJobdivaScannedFieldCount = (): number => scannedFields.size;
