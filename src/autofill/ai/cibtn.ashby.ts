import { fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { collectAshbyCandidateFields } from "./scan.ashby";
import {
  AiFieldScannerOptions,
  AiFormElement,
  RequestFieldAnswerFn,
} from "./types";

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
  | "option-group"
  | "checkbox-group";

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
/** Single-field AI fill callback (same job-application-fill API as full scan). */
let requestFieldAnswerFn: RequestFieldAnswerFn | null = null;

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getChoiceOptionLabel = (input: HTMLInputElement): string => {
  const id = input.id;
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel?.textContent) {
      return cleanLabelText(forLabel.textContent);
    }
  }
  const optionWrap = input.closest("[class*='_option_']");
  const wrapLabel = optionWrap?.querySelector("label");
  if (wrapLabel?.textContent) {
    return cleanLabelText(wrapLabel.textContent);
  }
  if (input.name && !input.name.includes("_systemfield") && input.name.length < 120) {
    return cleanLabelText(input.name);
  }
  return cleanLabelText(input.value ?? "");
};

const isAshbyYesNoStateCheckbox = (checkbox: HTMLInputElement): boolean => {
  if (checkbox.closest("[class*='_yesno_']")) return true;
  if (!checkbox.id && !checkbox.closest("[class*='_option_']")) return true;
  return false;
};

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
  if (kind === "checkbox-group") {
    const checked = Array.from(
      element.querySelectorAll<HTMLInputElement>("input[type='checkbox']:checked"),
    )
      .filter((cb) => !isAshbyYesNoStateCheckbox(cb))
      .map((cb) => getChoiceOptionLabel(cb))
      .filter(Boolean);
    return checked.join(", ");
  }
  if (kind === "option-group") {
    const checkedRadio = element.querySelector<HTMLInputElement>(
      "input[type='radio']:checked",
    );
    if (checkedRadio) {
      return getChoiceOptionLabel(checkedRadio);
    }
    const activeBtn = element.querySelector<HTMLElement>(
      "button[class*='_active_'], [class*='_yesno_'] button[class*='_active_'], [aria-pressed='true']",
    );
    if (activeBtn?.textContent) {
      return cleanLabelText(activeBtn.textContent);
    }
  }
  return "";
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

/**
 * Build a one-element API payload for this field (same shape as full form scan).
 */
const buildApiElementForField = (entry: ScannableFieldEntry): AiFormElement => {
  const { data, kind } = entry;
  const options = data.options;
  const isSearch =
    kind === "select" ||
    kind === "combobox" ||
    kind === "option-group" ||
    kind === "checkbox-group" ||
    (options != null && options.length > 0);

  return {
    label: data.label,
    required: false,
    type: isSearch ? "search" : "text",
    ...(options != null && options.length > 0 ? { options } : {}),
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

  const answer = await requestFieldAnswerFn(buildApiElementForField(entry));
  if (!answer) {
    throw new Error("No answer returned from AI fill API");
  }
  return answer;
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

const parseAnswerList = (answer: string): string[] => {
  const trimmed = answer.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      /* delimiter split */
    }
  }
  return trimmed
    .split(/\s*[,;|]\s*|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
};

const applyScannedFieldAnswer = async (
  entry: ScannableFieldEntry,
  answer: string,
): Promise<boolean> => {
  const { element, selectElement, kind } = entry;

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

  if (kind === "checkbox-group") {
    const labeled = Array.from(
      element.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
    )
      .filter((cb) => !isAshbyYesNoStateCheckbox(cb))
      .map((cb) => ({ input: cb, label: getChoiceOptionLabel(cb) }))
      .filter((item) => item.label);

    if (labeled.length === 0) return false;
    const optionLabels = labeled.map((i) => i.label);
    const parts = parseAnswerList(answer);
    const candidates =
      parts.length > 1
        ? parts
        : matchOption(answer, optionLabels)
          ? [matchOption(answer, optionLabels) as string]
          : parts.length === 1
            ? parts
            : [answer];

    let filledAny = false;
    for (const part of candidates) {
      const matched = matchOption(part, optionLabels);
      if (!matched) continue;
      const target = labeled.find((i) => i.label === matched);
      if (!target) continue;
      if (!target.input.checked) {
        if (target.input.id) {
          const label = document.querySelector<HTMLElement>(
            `label[for="${CSS.escape(target.input.id)}"]`,
          );
          if (label) {
            label.click();
          } else {
            target.input.checked = true;
            target.input.click();
          }
        } else {
          target.input.checked = true;
          target.input.click();
        }
        await handleValueChanges(target.input);
      }
      filledAny = true;
    }
    return filledAny;
  }

  if (kind === "option-group") {
    // Radios first
    const radios = Array.from(
      element.querySelectorAll<HTMLInputElement>("input[type='radio']"),
    );
    if (radios.length > 0) {
      for (const radio of radios) {
        const text = getChoiceOptionLabel(radio);
        if (
          fromatStirngInLowerCase(text) === fromatStirngInLowerCase(answer) ||
          fromatStirngInLowerCase(text)?.includes(
            fromatStirngInLowerCase(answer) ?? "",
          )
        ) {
          if (radio.id) {
            const label = document.querySelector<HTMLElement>(
              `label[for="${CSS.escape(radio.id)}"]`,
            );
            if (label) label.click();
            else {
              radio.checked = true;
              radio.click();
            }
          } else {
            radio.checked = true;
            radio.click();
          }
          await handleValueChanges(radio);
          return true;
        }
      }
      return false;
    }

    const buttons = Array.from(
      element.querySelectorAll<HTMLElement>(
        "button, [role='radio'], [role='option']",
      ),
    );
    for (const btn of buttons) {
      const text = cleanLabelText(btn.textContent ?? "");
      if (
        fromatStirngInLowerCase(text) === fromatStirngInLowerCase(answer) ||
        fromatStirngInLowerCase(text)?.includes(
          fromatStirngInLowerCase(answer) ?? "",
        )
      ) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  if (kind === "combobox") {
    if (element instanceof HTMLInputElement) {
      element.focus();
      element.click();
      element.value = answer;
      await handleValueChanges(element);
      await new Promise((r) => setTimeout(r, 250));
      const optionEls = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[role='listbox'] [role='option'], [role='option']",
        ),
      ).filter((opt) => {
        const style = window.getComputedStyle(opt);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      const labels = optionEls.map((o) => cleanLabelText(o.textContent ?? ""));
      const matched = matchOption(answer, labels);
      if (matched) {
        const target = optionEls.find(
          (o) => cleanLabelText(o.textContent ?? "") === matched,
        );
        target?.click();
      } else {
        element.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );
      }
      return true;
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
      const answer = await requestAiAnswerForField(entry);

      const applied = await applyScannedFieldAnswer(entry, answer);
      if (!applied) {
        throw new Error(`Could not apply answer: ${answer}`);
      }

      setIconState(button, "filled");
    } catch (error) {
      console.error("[CareerAI FieldAI:ashby]", error);
      setIconState(button, "error");
    }
  });

  wrapper.appendChild(button);
  anchor.appendChild(wrapper);
};

/**
 * Scans the Ashby application form and injects field icons on **textareas only**.
 * Inputs, selects, comboboxes, checkboxes, and yes/no groups are filled only via
 * the full Autofill with AI flow (no per-field button).
 *
 * Returns the number of textarea fields marked with icons.
 */
export const initAshbyHtmlScanner = (
  _applicantData: ApplicantContext | null = null,
  options: AiFieldScannerOptions = {},
): number => {
  injectScanStyles();
  removeAshbyHtmlScannerIcons();
  requestFieldAnswerFn = options.requestFieldAnswer ?? null;

  // Per-field "C" button: textarea only (not input / select / checkbox / radio / yes-no)
  const textareaCandidates = collectAshbyCandidateFields().filter(
    (candidate) => candidate.element instanceof HTMLTextAreaElement,
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
        currentValue: getCurrentValue(candidate.element, candidate.kind),
        options: candidate.options,
      },
      element: candidate.element,
      selectElement: null,
      kind: candidate.kind,
    };

    attachIconToField(entry);
  });

  return textareaCandidates.length;
};

export const removeAshbyHtmlScannerIcons = (): void => {
  document
    .querySelectorAll(`.${SCAN_ICON_WRAPPER_CLASS}`)
    .forEach((el) => el.remove());
  scannedFields.clear();
  requestFieldAnswerFn = null;
};

export const getAshbyScannedFieldCount = (): number => scannedFields.size;
