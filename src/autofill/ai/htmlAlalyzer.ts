import { BASE_URL } from "../../config/urlconfig";
import { LOCALSTORAGE } from "../../utils/constant";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const ANALYZER_BTN_CLASS = "careerai-analyzer-field-btn";
const ANALYZER_WRAPPER_CLASS = "careerai-analyzer-btn-wrapper";
const ANALYZER_COLLECTED_ATTR = "data-careerai-analyzer-collected";
const ANALYZER_COLLECTED_EVENT = "careerai-analyzer-collected";

export type FieldType =
  | "select"
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "unknown";

export interface FieldsetFieldData {
  label: string;
  fieldType: FieldType;
  currentValue: string;
  options: string[];
  selectButton: HTMLButtonElement | null;
  textInput: HTMLInputElement | HTMLTextAreaElement | null;
  fieldset: HTMLFieldSetElement;
}

export interface StoredFieldData {
  id: string;
  label: string;
  fieldType: FieldType;
  currentValue: string;
  options: string[];
}

interface CollectedFieldEntry {
  stored: StoredFieldData;
  fieldData: FieldsetFieldData;
}

interface OpenAiFieldAnswer {
  label: string;
  answer: string;
}

interface OpenAiBatchResponse {
  answers: OpenAiFieldAnswer[];
}

const collectedFields = new Map<string, CollectedFieldEntry>();

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

const notifyCollectedChange = (): void => {
  window.dispatchEvent(
    new CustomEvent(ANALYZER_COLLECTED_EVENT, {
      detail: { count: collectedFields.size },
    })
  );
};

export const getCollectedFieldsCount = (): number => collectedFields.size;

export const getCollectedFieldEntries = (): StoredFieldData[] => {
  return Array.from(collectedFields.values())
    .map((entry) => entry.stored)
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const clearCollectedFields = (): void => {
  collectedFields.clear();
  notifyCollectedChange();
};

const cleanLabelText = (text: string): string => {
  return text
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getFieldsetId = (fieldset: HTMLFieldSetElement, label: string): string => {
  const fkitId = fieldset
    .closest("[data-fkit-id]")
    ?.getAttribute("data-fkit-id");
  if (fkitId) {
    return fkitId;
  }

  const automationId = fieldset
    .closest('[data-automation-id^="formField-"]')
    ?.getAttribute("data-automation-id");
  if (automationId) {
    return automationId;
  }

  const selectButton = fieldset.querySelector('button[aria-haspopup="listbox"]');
  const name = selectButton?.getAttribute("name") || selectButton?.getAttribute("id");
  if (name) {
    return name;
  }

  return label;
};

const extractFieldsetLabel = (fieldset: HTMLFieldSetElement): string => {
  const legend = fieldset.querySelector("legend");
  if (!legend) {
    return "";
  }

  const richText = legend.querySelector('[data-automation-id="richText"]');
  if (richText?.textContent) {
    return cleanLabelText(richText.textContent);
  }

  const heading = legend.querySelector("h1, h2, h3, h4, label");
  if (heading?.textContent) {
    return cleanLabelText(heading.textContent);
  }

  return cleanLabelText(legend.textContent ?? "");
};

const getSelectButton = (
  fieldset: HTMLFieldSetElement
): HTMLButtonElement | null => {
  return fieldset.querySelector('button[aria-haspopup="listbox"]');
};

const getTextInput = (
  fieldset: HTMLFieldSetElement
): HTMLInputElement | HTMLTextAreaElement | null => {
  const textarea = fieldset.querySelector("textarea");
  if (textarea) {
    return textarea;
  }

  const textInput = fieldset.querySelector(
    'input[type="text"], input:not([type])'
  );
  return textInput as HTMLInputElement | null;
};

const getRadioLabels = (fieldset: HTMLFieldSetElement): string[] => {
  const labels: string[] = [];
  fieldset.querySelectorAll("label").forEach((label) => {
    const text = cleanLabelText(label.textContent ?? "");
    if (text) {
      labels.push(text);
    }
  });
  return labels;
};

const getCheckedRadioValue = (fieldset: HTMLFieldSetElement): string => {
  const checkedInput = fieldset.querySelector(
    'input[type="radio"]:checked'
  ) as HTMLInputElement | null;

  if (!checkedInput) {
    return "";
  }

  const label = fieldset.querySelector(`label[for="${checkedInput.id}"]`);
  if (label?.textContent) {
    return cleanLabelText(label.textContent);
  }

  return checkedInput.value ?? "";
};

const collectSelectOptions = async (
  selectButton: HTMLButtonElement
): Promise<string[]> => {
  selectButton.click();
  await delay(500);

  const options = Array.from(document.querySelectorAll('[role="option"]'))
    .map((option) => cleanLabelText(option.textContent ?? ""))
    .filter(Boolean);

  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  await delay(200);

  return options;
};

export const extractFieldsetData = async (
  fieldset: HTMLFieldSetElement
): Promise<FieldsetFieldData> => {
  const label = extractFieldsetLabel(fieldset);
  const selectButton = getSelectButton(fieldset);
  const textInput = getTextInput(fieldset);

  if (selectButton) {
    const currentValue = cleanLabelText(selectButton.textContent ?? "");
    const options = await collectSelectOptions(selectButton);

    return {
      label,
      fieldType: "select",
      currentValue,
      options,
      selectButton,
      textInput: null,
      fieldset,
    };
  }

  if (textInput) {
    return {
      label,
      fieldType: textInput.tagName === "TEXTAREA" ? "textarea" : "text",
      currentValue: textInput.value ?? "",
      options: [],
      selectButton: null,
      textInput,
      fieldset,
    };
  }

  const radioLabels = getRadioLabels(fieldset);
  if (radioLabels.length > 0) {
    return {
      label,
      fieldType: "radio",
      currentValue: getCheckedRadioValue(fieldset),
      options: radioLabels,
      selectButton: null,
      textInput: null,
      fieldset,
    };
  }

  return {
    label,
    fieldType: "unknown",
    currentValue: "",
    options: [],
    selectButton: null,
    textInput: null,
    fieldset,
  };
};

const toStoredFieldData = (
  fieldData: FieldsetFieldData,
  id: string
): StoredFieldData => ({
  id,
  label: fieldData.label,
  fieldType: fieldData.fieldType,
  currentValue: fieldData.currentValue,
  options: fieldData.options,
});

const storeFieldData = (
  fieldData: FieldsetFieldData,
  id: string
): StoredFieldData => {
  const stored = toStoredFieldData(fieldData, id);
  collectedFields.set(id, { stored, fieldData });
  notifyCollectedChange();
  return stored;
};

const buildBatchAnalyzerPrompt = (fields: StoredFieldData[]): string => {
  const applicantContext = getApplicantContext();

  const fieldsPayload = fields.map((field) => ({
    label: field.label,
    fieldType: field.fieldType,
    currentValue: field.currentValue || "empty",
    options: field.options,
  }));

  return `
You are helping fill out job application form fields.

Applicant Profile:
${applicantContext ? JSON.stringify(applicantContext, null, 2) : "No applicant profile available."}

Form Fields to answer:
${JSON.stringify(fieldsPayload, null, 2)}

For each field, determine the best answer based on the applicant profile.
If a field has options, the answer MUST exactly match one of the available options.
If unsure, choose the most conservative/safe answer (e.g. "No", "None", "Not Applicable").

Respond with JSON only in this format:
{"answers": [{"label": "exact question label", "answer": "your answer"}, ...]}
`.trim();
};

const parseOpenAiBatchResponse = (raw: string): OpenAiBatchResponse | null => {
  try {
    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed?.answers)) {
      return {
        answers: parsed.answers.map((item: OpenAiFieldAnswer) => ({
          label: String(item.label ?? "").trim(),
          answer: String(item.answer ?? "").trim(),
        })),
      };
    }
    return null;
  } catch {
    return null;
  }
};

const callOpenAiForFields = async (
  fields: StoredFieldData[]
): Promise<OpenAiBatchResponse | null> => {
  const prompt = buildBatchAnalyzerPrompt(fields);

  const response = await fetch(`${BASE_URL}/gpt/write/gpt40`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();
  const result = data?.data;
  if (!result) {
    throw new Error("Empty response from OpenAI");
  }

  return parseOpenAiBatchResponse(result);
};

const matchOption = (answer: string, options: string[]): string | null => {
  const normalizedAnswer = fromatStirngInLowerCase(answer);

  for (const option of options) {
    if (fromatStirngInLowerCase(option) === normalizedAnswer) {
      return option;
    }
  }

  for (const option of options) {
    if (
      fromatStirngInLowerCase(option)?.includes(normalizedAnswer ?? "") ||
      normalizedAnswer?.includes(fromatStirngInLowerCase(option) ?? "")
    ) {
      return option;
    }
  }

  return null;
};

const applySelectAnswer = async (
  selectButton: HTMLButtonElement,
  answer: string,
  knownOptions: string[]
): Promise<boolean> => {
  selectButton.click();
  await delay(500);

  const optionElements = Array.from(
    document.querySelectorAll('[role="option"]')
  );

  const matchedOption = matchOption(
    answer,
    optionElements.map((el) => cleanLabelText(el.textContent ?? ""))
  );

  if (!matchedOption) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    return false;
  }

  for (const optionEl of optionElements) {
    const optionText = cleanLabelText(optionEl.textContent ?? "");
    if (optionText === matchedOption) {
      (optionEl as HTMLElement).click();
      await delay(300);
      return true;
    }
  }

  if (knownOptions.length > 0) {
    const fallback = matchOption(answer, knownOptions);
    if (fallback) {
      for (const optionEl of optionElements) {
        const optionText = cleanLabelText(optionEl.textContent ?? "");
        if (optionText === fallback) {
          (optionEl as HTMLElement).click();
          await delay(300);
          return true;
        }
      }
    }
  }

  return false;
};

const applyTextAnswer = async (
  input: HTMLInputElement | HTMLTextAreaElement,
  answer: string
): Promise<boolean> => {
  input.focus();
  input.value = answer;
  await handleValueChanges(input);
  return true;
};

const applyRadioAnswer = async (
  fieldset: HTMLFieldSetElement,
  answer: string
): Promise<boolean> => {
  const labels = fieldset.querySelectorAll("label");
  const matched = matchOption(
    answer,
    Array.from(labels).map((l) => cleanLabelText(l.textContent ?? ""))
  );

  if (!matched) {
    return false;
  }

  for (const label of labels) {
    const labelText = cleanLabelText(label.textContent ?? "");
    if (labelText === matched) {
      label.click();
      await delay(200);
      return true;
    }
  }

  return false;
};

export const applyFieldAnswer = async (
  fieldData: FieldsetFieldData,
  answer: string
): Promise<boolean> => {
  switch (fieldData.fieldType) {
    case "select":
      if (!fieldData.selectButton) {
        return false;
      }
      return applySelectAnswer(
        fieldData.selectButton,
        answer,
        fieldData.options
      );
    case "text":
    case "textarea":
      if (!fieldData.textInput) {
        return false;
      }
      return applyTextAnswer(fieldData.textInput, answer);
    case "radio":
      return applyRadioAnswer(fieldData.fieldset, answer);
    default:
      return false;
  }
};

const findAnswerForField = (
  stored: StoredFieldData,
  answers: OpenAiFieldAnswer[]
): string | null => {
  const exact = answers.find((item) => item.label === stored.label);
  if (exact?.answer) {
    return exact.answer;
  }

  const normalizedLabel = fromatStirngInLowerCase(stored.label);
  const fuzzy = answers.find(
    (item) => fromatStirngInLowerCase(item.label) === normalizedLabel
  );
  return fuzzy?.answer ?? null;
};

const setButtonState = (
  button: HTMLButtonElement,
  state: "default" | "loading" | "collected" | "filled" | "error"
) => {
  switch (state) {
    case "loading":
      button.textContent = "Reading...";
      button.disabled = true;
      button.style.backgroundColor = "#f59e0b";
      button.style.cursor = "wait";
      break;
    case "collected":
      button.textContent = "✓ Selected";
      button.disabled = true;
      button.style.backgroundColor = "#16a34a";
      button.style.cursor = "default";
      button.setAttribute(ANALYZER_COLLECTED_ATTR, "true");
      break;
    case "filled":
      button.textContent = "✓ Filled";
      button.disabled = true;
      button.style.backgroundColor = "#059669";
      button.style.cursor = "default";
      button.setAttribute(ANALYZER_COLLECTED_ATTR, "true");
      break;
    case "error":
      button.textContent = "Retry";
      button.disabled = false;
      button.style.backgroundColor = "#dc2626";
      button.style.cursor = "pointer";
      button.removeAttribute(ANALYZER_COLLECTED_ATTR);
      break;
    default:
      button.textContent = "Select";
      button.disabled = false;
      button.style.backgroundColor = "#0145fd";
      button.style.cursor = "pointer";
      button.removeAttribute(ANALYZER_COLLECTED_ATTR);
  }
};

const styleAnalyzerButton = (button: HTMLButtonElement) => {
  button.className = ANALYZER_BTN_CLASS;
  button.type = "button";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.gap = "4px";
  button.style.marginTop = "8px";
  button.style.marginBottom = "4px";
  button.style.padding = "6px 12px";
  button.style.borderRadius = "6px";
  button.style.border = "none";
  button.style.color = "#fff";
  button.style.fontSize = "13px";
  button.style.fontWeight = "600";
  button.style.backgroundColor = "#0145fd";
  button.style.cursor = "pointer";
  button.style.zIndex = "9999";
  button.style.position = "relative";
};

const createAnalyzerButton = (
  fieldset: HTMLFieldSetElement
): HTMLButtonElement => {
  const button = document.createElement("button");
  styleAnalyzerButton(button);
  button.textContent = "Select";

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (button.getAttribute(ANALYZER_COLLECTED_ATTR) === "true") {
      return;
    }

    setButtonState(button, "loading");

    try {
      const fieldData = await extractFieldsetData(fieldset);

      if (!fieldData.label) {
        throw new Error("Could not extract field label");
      }

      const id = getFieldsetId(fieldset, fieldData.label);
      storeFieldData(fieldData, id);
      setButtonState(button, "collected");
    } catch (error) {
      console.error("[CareerAI Analyzer]", error);
      setButtonState(button, "error");
    }
  });

  return button;
};

const addButtonToFieldset = (fieldset: HTMLFieldSetElement) => {
  if (fieldset.querySelector(`.${ANALYZER_BTN_CLASS}`)) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = ANALYZER_WRAPPER_CLASS;
  wrapper.style.display = "block";
  wrapper.style.marginBottom = "8px";

  const button = createAnalyzerButton(fieldset);
  wrapper.appendChild(button);

  const legend = fieldset.querySelector("legend");
  if (legend?.parentElement) {
    legend.insertAdjacentElement("afterend", wrapper);
  } else {
    fieldset.prepend(wrapper);
  }
};

/**
 * Scans the page for fieldsets and injects a "Select" button on each one.
 * Clicking a field button collects label + value for later API submission.
 */
export const initHtmlAnalyzer = (): number => {
  const fieldsets = document.querySelectorAll("fieldset");

  fieldsets.forEach((fieldset) => {
    addButtonToFieldset(fieldset as HTMLFieldSetElement);
  });

  return fieldsets.length;
};

/**
 * Sends all collected field data to OpenAI and applies answers to the form.
 */
export const sendCollectedFieldsToApi = async (): Promise<{
  sent: number;
  applied: number;
  failed: number;
}> => {
  const entries = Array.from(collectedFields.values()).sort((a, b) =>
    a.stored.label.localeCompare(b.stored.label)
  );

  if (entries.length === 0) {
    throw new Error("No fields selected. Click Select on form fields first.");
  }

  const storedFields = entries.map((entry) => entry.stored);
  const aiResult = await callOpenAiForFields(storedFields);

  if (!aiResult?.answers?.length) {
    throw new Error("No answers returned from OpenAI");
  }

  let applied = 0;
  let failed = 0;

  for (const entry of entries) {
    const answer = findAnswerForField(entry.stored, aiResult.answers);
    const fieldButton = entry.fieldData.fieldset.querySelector(
      `.${ANALYZER_BTN_CLASS}`
    ) as HTMLButtonElement | null;

    if (!answer) {
      failed += 1;
      if (fieldButton) {
        setButtonState(fieldButton, "error");
      }
      continue;
    }

    const success = await applyFieldAnswer(entry.fieldData, answer);
    if (success) {
      applied += 1;
      if (fieldButton) {
        setButtonState(fieldButton, "filled");
      }
    } else {
      failed += 1;
      if (fieldButton) {
        setButtonState(fieldButton, "error");
      }
    }
  }

  clearCollectedFields();

  return {
    sent: storedFields.length,
    applied,
    failed,
  };
};

export const ANALYZER_COLLECTED_EVENT_NAME = ANALYZER_COLLECTED_EVENT;

/**
 * Removes all injected analyzer buttons from the page.
 */
export const removeHtmlAnalyzerButtons = (): void => {
  document
    .querySelectorAll(`.${ANALYZER_WRAPPER_CLASS}`)
    .forEach((wrapper) => wrapper.remove());
  clearCollectedFields();
};
