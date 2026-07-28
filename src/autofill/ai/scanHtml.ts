import { EXTENSION_ROOT_ID, LOCALSTORAGE } from "../../utils/constant";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

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
  autocomplete?: string;
}

interface ScannableFieldEntry {
  data: ScannableFieldData;
  element: HTMLElement;
  selectElement: HTMLSelectElement | null;
}

const scannedFields = new Map<string, ScannableFieldEntry>();

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

const getApplicantContext = (): Record<string, unknown> | null => {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_USERINFO);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const cleanLabelText = (text: string): string =>
  text.replace(/\*/g, "").replace(/\s+/g, " ").trim();

const isInsideExtension = (element: Element): boolean => {
  return !!element.closest(`#${EXTENSION_ROOT_ID}, .${SCAN_ICON_WRAPPER_CLASS}`);
};

const isVisibleField = (element: HTMLElement): boolean => {
  if (element.closest(".visually-hidden, [aria-hidden='true']")) {
    return false;
  }
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
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
    .closest(".field-wrapper, .input-wrapper, .select__container, .text-input-wrapper")
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

const getCurrentValue = (element: HTMLElement, fieldType: ScannableFieldType): string => {
  if (element instanceof HTMLSelectElement) {
    return element.options[element.selectedIndex]?.text?.trim() ?? element.value;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
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
    "input, textarea, select"
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
      ".input-wrapper, .select__container, .field-wrapper, .text-input-wrapper, .phone-input__phone, .select"
    ) as HTMLElement) || element.parentElement!
  );
};

const setIconState = (
  button: HTMLButtonElement,
  state: "default" | "loading" | "filled" | "error"
): void => {
  button.classList.remove(
    `${SCAN_ICON_CLASS}--loading`,
    `${SCAN_ICON_CLASS}--filled`,
    `${SCAN_ICON_CLASS}--error`
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
 * Dummy OpenAI API – returns mock answers based on field label/id and applicant profile.
 * Replace with real API call later.
 */
export const callOpenAiForFields = async (
  fieldData: ScannableFieldData
): Promise<{ answer: string }> => {
  await delay(600);

  const applicant = getApplicantContext();
  const labelKey = fromatStirngInLowerCase(fieldData.label) ?? "";
  const idKey = fromatStirngInLowerCase(fieldData.id) ?? "";
  const autocomplete = fromatStirngInLowerCase(fieldData.autocomplete) ?? "";

  const pick = (...values: (string | undefined | null)[]): string => {
    for (const value of values) {
      if (value) return value;
    }
    return "";
  };

  if (
    idKey.includes("first") ||
    labelKey.includes("firstname") ||
    autocomplete.includes("givenname")
  ) {
    return { answer: pick(applicant?.first_name as string, "John") };
  }

  if (
    idKey.includes("last") ||
    labelKey.includes("lastname") ||
    autocomplete.includes("familyname")
  ) {
    return { answer: pick(applicant?.last_name as string, "Doe") };
  }

  if (idKey.includes("email") || labelKey.includes("email") || autocomplete.includes("email")) {
    return { answer: pick(applicant?.email_address as string, "john.doe@example.com") };
  }

  if (
    idKey.includes("phone") ||
    labelKey.includes("phone") ||
    fieldData.fieldType === "tel" ||
    autocomplete.includes("tel")
  ) {
    return { answer: pick(applicant?.phone_number as string, "+1 555-010-1234") };
  }

  if (labelKey.includes("linkedin") || idKey.includes("linkedin")) {
    return { answer: pick(applicant?.linkedin_url as string, "https://linkedin.com/in/johndoe") };
  }

  if (fieldData.fieldType === "textarea") {
    return {
      answer:
        "I have 3+ years of experience resolving client-facing payroll inquiries, documenting cases, and escalating complex issues while maintaining SLAs.",
    };
  }

  if (fieldData.fieldType === "combobox" || fieldData.fieldType === "select") {
    if (labelKey.includes("country") && !labelKey.includes("phone")) {
      return { answer: pick(applicant?.country as string, "United States") };
    }
    if (labelKey.includes("eligible") || labelKey.includes("authorization")) {
      return { answer: "Yes" };
    }
    if (labelKey.includes("noncompete") || labelKey.includes("sponsorship")) {
      return { answer: "No" };
    }
    if (labelKey.includes("pronoun")) {
      return { answer: pick(applicant?.gender as string, "He/Him") };
    }
    if (labelKey.includes("consent") || labelKey.includes("privacy")) {
      return { answer: "Yes" };
    }
    if (labelKey.includes("hearabout") || labelKey.includes("howdidyouhear")) {
      return { answer: "LinkedIn" };
    }
    if (labelKey.includes("experience") || labelKey.includes("payroll")) {
      return { answer: "Yes" };
    }
    if (labelKey.includes("schedule") || labelKey.includes("available")) {
      return { answer: "Yes" };
    }
    return { answer: "Yes" };
  }

  return { answer: pick(applicant?.full_name as string, "Sample answer") };
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

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string
): Promise<boolean> => {
  const options = Array.from(select.options).map((opt) =>
    cleanLabelText(opt.textContent ?? opt.value)
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

const fillCombobox = async (element: HTMLInputElement, answer: string): Promise<boolean> => {
  element.focus();
  element.click();
  await delay(400);

  const options = Array.from(
    document.querySelectorAll('[role="option"], .select__option')
  );
  const matched = matchOption(
    answer,
    options.map((opt) => cleanLabelText(opt.textContent ?? ""))
  );

  if (!matched) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    return false;
  }

  for (const optionEl of options) {
    const optionText = cleanLabelText(optionEl.textContent ?? "");
    if (optionText === matched) {
      (optionEl as HTMLElement).click();
      await delay(300);
      return true;
    }
  }

  return false;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string
): Promise<boolean> => {
  element.focus();
  element.value = answer;
  await handleValueChanges(element);
  return true;
};

export const applyScannedFieldAnswer = async (
  entry: ScannableFieldEntry,
  answer: string
): Promise<boolean> => {
  const { element, data, selectElement } = entry;

  if (data.fieldType === "select" && selectElement) {
    return fillNativeSelect(selectElement, answer);
  }

  if (data.fieldType === "combobox" && element instanceof HTMLInputElement) {
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
      console.log("[CareerAI Scan] Field data:", entry.data);

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
      console.error("[CareerAI Scan]", error);
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

/**
 * Scans the page body for autofillable inputs, textareas, and selects,
 * then injects a small icon on each field (Grammarly-style).
 */
export const initHtmlScanner = (): number => {
  injectScanStyles();
  removeHtmlScannerIcons();

  const elements = findAutofillableElements();
  elements.forEach((element) => attachIconToField(element));

  console.log(`[CareerAI Scan] Found ${elements.length} autofillable fields`);
  return elements.length;
};

export const removeHtmlScannerIcons = (): void => {
  document.querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`).forEach((el) => el.remove());
  scannedFields.clear();
};

export const getScannedFieldCount = (): number => scannedFields.size;
