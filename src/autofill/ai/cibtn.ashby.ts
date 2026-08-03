import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { collectAshbyCandidateFields } from "./scan.ashby";

const SCAN_ICON_CLASS = "careerai-ashby-scan-field-icon";
const SCAN_ICON_WRAPPER_CLASS = "careerai-ashby-scan-icon-wrapper";
const SCAN_STYLE_ID = "careerai-ashby-scan-html-styles";

export type ScannableFieldType =
  | "text"
  | "textarea"
  | "tel"
  | "email"
  | "url"
  | "number"
  | "select"
  | "combobox"
  | "option-group";

export interface ScannableFieldData {
  id: string;
  label: string;
  fieldType: ScannableFieldType;
  currentValue: string;
  options?: string[];
}

export type ApplicantContext = Record<string, unknown>;

interface ScannableFieldEntry {
  data: ScannableFieldData;
  element: HTMLElement;
  selectElement: HTMLSelectElement | null;
  kind: string;
}

const scannedFields = new Map<string, ScannableFieldEntry>();
let applicantContext: ApplicantContext | null = null;

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getApplicantContext = (): ApplicantContext | null => applicantContext;

const getCurrentValue = (element: HTMLElement, kind: string): string => {
  if (element instanceof HTMLSelectElement) {
    return (
      element.options[element.selectedIndex]?.text?.trim() ?? element.value
    );
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.value?.trim() ?? "";
  }
  if (kind === "option-group") {
    const checked = element.querySelector<HTMLInputElement>(
      "input[type='radio']:checked",
    );
    if (checked) {
      const id = checked.id;
      const label = id
        ? document.querySelector(`label[for="${CSS.escape(id)}"]`)
        : null;
      return cleanLabelText(label?.textContent ?? checked.value ?? "");
    }
  }
  return "";
};

const mapKindToFieldType = (
  element: HTMLElement,
  kind: string,
): ScannableFieldType => {
  if (kind === "select") return "select";
  if (kind === "combobox") return "combobox";
  if (kind === "option-group") return "option-group";
  if (element instanceof HTMLTextAreaElement) return "textarea";
  if (element instanceof HTMLInputElement) {
    const type = (element.type || "text").toLowerCase();
    if (type === "tel") return "tel";
    if (type === "email") return "email";
    if (type === "url") return "url";
    if (type === "number") return "number";
  }
  return "text";
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
  const entry = element.closest(
    ".ashby-application-form-field-entry, [class*='_fieldEntry_']",
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

const callOpenAiForFields = async (
  fieldData: ScannableFieldData,
): Promise<{ answer: string }> => {
  await delay(400);

  const applicant = getApplicantContext();
  const labelKey = fromatStirngInLowerCase(fieldData.label) ?? "";
  const idKey = fromatStirngInLowerCase(fieldData.id) ?? "";

  const pick = (...values: (string | undefined | null)[]): string => {
    for (const value of values) {
      if (value) return value;
    }
    return "";
  };

  if (
    idKey.includes("name") ||
    labelKey === "name" ||
    labelKey.includes("fullname")
  ) {
    return { answer: pick(applicant?.full_name as string, " ") };
  }

  if (idKey.includes("email") || labelKey.includes("email")) {
    return {
      answer: pick(applicant?.email_address as string, ""),
    };
  }

  if (
    idKey.includes("phone") ||
    labelKey.includes("phone") ||
    fieldData.fieldType === "tel"
  ) {
    return {
      answer: pick(applicant?.phone_number as string, ""),
    };
  }

  if (labelKey.includes("linkedin") || idKey.includes("linkedin")) {
    return {
      answer: pick(applicant?.linkedin_url as string, ""),
    };
  }

  if (labelKey.includes("github") || idKey.includes("github")) {
    return {
      answer: pick(applicant?.github_url as string, ""),
    };
  }

  if (fieldData.fieldType === "textarea") {
    return {
      answer: "",
    };
  }

  if (
    fieldData.fieldType === "select" ||
    fieldData.fieldType === "combobox" ||
    fieldData.fieldType === "option-group"
  ) {
    if (labelKey.includes("gender")) {
      return { answer: pick(applicant?.gender as string, "Male") };
    }
    if (labelKey.includes("authoriz") || labelKey.includes("eligible")) {
      return { answer: "Yes" };
    }
    if (labelKey.includes("sponsor")) {
      return { answer: "No" };
    }
    return { answer: fieldData.options?.[0] ?? "Yes" };
  }

  return { answer: pick(applicant?.full_name as string, "Sample answer") };
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

const matchOption = (answer: string, options: string[]): string | null => {
  const normalizedAnswer = fromatStirngInLowerCase(answer);
  for (const option of options) {
    if (fromatStirngInLowerCase(option) === normalizedAnswer) return option;
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

const applyScannedFieldAnswer = async (
  entry: ScannableFieldEntry,
  answer: string,
): Promise<boolean> => {
  const { element, data, selectElement, kind } = entry;

  if (kind === "select" && selectElement) {
    const options = Array.from(selectElement.options).map((opt) =>
      cleanLabelText(opt.textContent ?? opt.value),
    );
    const matched = matchOption(answer, options);
    if (!matched) return false;
    for (const option of selectElement.options) {
      if (cleanLabelText(option.textContent ?? option.value) === matched) {
        selectElement.value = option.value;
        option.selected = true;
        await handleValueChanges(selectElement);
        return true;
      }
    }
    return false;
  }

  if (kind === "option-group") {
    const buttons = Array.from(
      element.querySelectorAll<HTMLElement>(
        "button, [role='radio'], input[type='radio']",
      ),
    );
    for (const btn of buttons) {
      const text =
        btn instanceof HTMLInputElement
          ? cleanLabelText(
              document.querySelector(`label[for="${CSS.escape(btn.id)}"]`)
                ?.textContent ??
                btn.value ??
                "",
            )
          : cleanLabelText(btn.textContent ?? "");
      if (
        fromatStirngInLowerCase(text) === fromatStirngInLowerCase(answer) ||
        fromatStirngInLowerCase(text)?.includes(
          fromatStirngInLowerCase(answer) ?? "",
        )
      ) {
        if (btn instanceof HTMLInputElement) {
          btn.checked = true;
          btn.click();
          await handleValueChanges(btn);
        } else {
          btn.click();
        }
        return true;
      }
    }
    return false;
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(element, answer);
  }

  return false;
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
      entry.data.currentValue = getCurrentValue(element, entry.kind);
      const result = await callOpenAiForFields(entry.data);
      if (!result?.answer) {
        throw new Error("No answer returned");
      }

      const applied = await applyScannedFieldAnswer(entry, result.answer);
      if (!applied) {
        throw new Error(`Could not apply answer: ${result.answer}`);
      }

      setIconState(button, "filled");
    } catch (error) {
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

/**
 * Scans the Ashby application form for autofillable fields and injects
 * Grammarly-style field icons. Returns the number of fields marked.
 */
export const initAshbyHtmlScanner = (
  applicantData: ApplicantContext | null = null,
): number => {
  injectScanStyles();
  removeAshbyHtmlScannerIcons();
  applicantContext = applicantData;

  const candidates = collectAshbyCandidateFields();

  candidates.forEach((candidate, index) => {
    const id =
      candidate.element.getAttribute("id") ||
      candidate.element.getAttribute("name") ||
      `${fromatStirngInLowerCase(candidate.label)}-${index}`;

    const entry: ScannableFieldEntry = {
      data: {
        id,
        label: candidate.label,
        fieldType: mapKindToFieldType(candidate.element, candidate.kind),
        currentValue: getCurrentValue(candidate.element, candidate.kind),
        options: candidate.options,
      },
      element: candidate.element,
      selectElement:
        candidate.element instanceof HTMLSelectElement
          ? candidate.element
          : null,
      kind: candidate.kind,
    };

    attachIconToField(entry);
  });

  return candidates.length;
};

export const removeAshbyHtmlScannerIcons = (): void => {
  document
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  scannedFields.clear();
  applicantContext = null;
};

export const getAshbyScannedFieldCount = (): number => scannedFields.size;
