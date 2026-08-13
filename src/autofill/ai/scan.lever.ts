import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface LeverScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface LeverScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "password",
  "image",
]);

export type LeverFieldKind =
  | "text"
  | "select"
  | "location"
  | "checkbox-group"
  | "radio-group";

export interface LeverCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: LeverFieldKind;
  options?: string[];
}

const cleanLabelText = (text: string): string =>
  text
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

export const getLeverFormRoot = (): HTMLElement => {
  const form =
    document.querySelector<HTMLElement>("form#application-form") ||
    document.querySelector<HTMLElement>("#application-form") ||
    document.querySelector<HTMLElement>("form[enctype='multipart/form-data']") ||
    document.querySelector<HTMLElement>("form.application-form");
  return form && !isInsideExtension(form) ? form : document.body;
};

const isDisabledField = (element: HTMLElement): boolean =>
  element.hasAttribute("disabled") ||
  element.getAttribute("aria-disabled") === "true";

/**
 * Lever EEO (Gender / Race / Veteran) lives in `.eeo-section.hidden` until a
 * location is chosen. Those native <select>s must still be scanned.
 */
const isEeoQuestion = (element: HTMLElement): boolean =>
  !!element.closest(".eeo-section, [data-qa='eeo-section']") ||
  !!element.querySelector("select[name^='eeo[']") ||
  (element instanceof HTMLSelectElement &&
    (element.name.startsWith("eeo[") || element.name.startsWith("eeo")));

const isVisibleElement = (element: HTMLElement): boolean => {
  if (isDisabledField(element)) {
    return false;
  }
  // EEO selects are in the form even while the section is display:none
  if (isEeoQuestion(element)) {
    return true;
  }
  if (
    element.closest(
      ".hidden, [hidden], .visually-hidden, [aria-hidden='true']",
    )
  ) {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

const getQuestionLabel = (question: HTMLElement): string => {
  const textEl = question.querySelector(".application-label .text");
  if (textEl?.textContent) {
    return cleanLabelText(textEl.textContent);
  }

  const labelEl = question.querySelector(".application-label");
  if (labelEl) {
    const clone = labelEl.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(
        ".required, .eeo-more-info-button, a, svg, .eeo-expandable-description",
      )
      .forEach((el) => el.remove());
    const text = cleanLabelText(clone.textContent ?? "");
    if (text) return text;
  }

  return "";
};

const getFieldLabel = (element: HTMLElement): string => {
  const question = element.closest(".application-question") as HTMLElement | null;
  if (question) {
    const fromQuestion = getQuestionLabel(question);
    if (fromQuestion) return fromQuestion;
  }

  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return cleanLabelText(ariaLabel);

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  return id ?? element.getAttribute("name") ?? "Unknown field";
};

const isRequiredField = (
  element: HTMLElement,
  question: HTMLElement | null,
): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const scope = question ?? element.closest(".application-question");
  if (scope?.querySelector(".required, .application-label .required")) {
    return true;
  }
  if (
    scope
      ?.querySelector(".application-label")
      ?.textContent?.match(/[✱*]/)
  ) {
    return true;
  }

  return false;
};

const getChoiceLabel = (input: HTMLInputElement): string => {
  const alt = input.parentElement?.querySelector(
    ".application-answer-alternative",
  );
  if (alt?.textContent) {
    return cleanLabelText(alt.textContent);
  }

  const wrappingLabel = input.closest("label");
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, svg, .required").forEach((el) => el.remove());
    const text = cleanLabelText(clone.textContent ?? "");
    if (text) return text;
  }

  return cleanLabelText(input.value || input.getAttribute("aria-label") || "");
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label)) return;
    if (!opt.value && /select|choose|---/i.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const isSkipQuestion = (question: HTMLElement): boolean => {
  if (isInsideExtension(question)) return true;
  if (question.classList.contains("resume")) return true;
  if (question.classList.contains("awli-application-row")) return true;
  // Native selects (location + EEO Gender/Race/Veteran) are always scanned
  if (question.querySelector("select")) return false;
  return !isVisibleElement(question);
};

const isLocationInput = (element: HTMLElement): boolean =>
  element.id === "location-input" ||
  element.classList.contains("location-input") ||
  element.getAttribute("data-qa") === "location-input";

const pushSelectField = (
  select: HTMLSelectElement,
  question: HTMLElement | null,
  results: LeverCandidateField[],
  remember: (id: string | null | undefined) => boolean,
): boolean => {
  if (isDisabledField(select) || isInsideExtension(select)) return false;
  if (!remember(select.getAttribute("name") || select.id)) return false;

  const label =
    (question && getQuestionLabel(question)) || getFieldLabel(select);
  results.push({
    element: select,
    label,
    required: isRequiredField(select, question),
    kind: "select",
    options: getNativeSelectOptions(select),
  });
  return true;
};

/**
 * Collect autofillable Lever application fields from `#application-form`.
 * Resume/file, LinkedIn Apply, and hidden inputs are skipped.
 * Native selects (including hidden EEO Gender/Race/Veteran) are always included.
 */
export const collectLeverCandidateFields = (): LeverCandidateField[] => {
  const form = getLeverFormRoot();
  const results: LeverCandidateField[] = [];
  const seenIds = new Set<string>();

  const remember = (id: string | null | undefined): boolean => {
    const key = id || `field-${results.length}`;
    if (seenIds.has(key)) return false;
    seenIds.add(key);
    return true;
  };

  form
    .querySelectorAll<HTMLElement>(".application-question")
    .forEach((question) => {
      if (isSkipQuestion(question)) return;

      const label = getQuestionLabel(question);

      const select = question.querySelector<HTMLSelectElement>("select");
      if (select) {
        pushSelectField(select, question, results, remember);
        return;
      }

      const textarea = question.querySelector<HTMLTextAreaElement>("textarea");
      if (textarea && isVisibleElement(textarea)) {
        if (!remember(textarea.getAttribute("name") || textarea.id)) return;
        results.push({
          element: textarea,
          label: label || getFieldLabel(textarea),
          required: isRequiredField(textarea, question),
          kind: "text",
        });
        return;
      }

      const checkboxes = Array.from(
        question.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
      ).filter((cb) => isVisibleElement(cb));
      if (checkboxes.length > 0) {
        const groupId =
          checkboxes[0].getAttribute("name") || `checkbox-${results.length}`;
        if (!remember(groupId)) return;
        const options = checkboxes.map(getChoiceLabel).filter(Boolean);
        results.push({
          element: question,
          label: label || "Unknown field",
          required: isRequiredField(checkboxes[0], question),
          kind: "checkbox-group",
          options,
        });
        return;
      }

      const radios = Array.from(
        question.querySelectorAll<HTMLInputElement>("input[type='radio']"),
      ).filter((radio) => isVisibleElement(radio));
      if (radios.length > 0) {
        const groupId =
          radios[0].getAttribute("name") || `radio-${results.length}`;
        if (!remember(groupId)) return;
        const options = radios.map(getChoiceLabel).filter(Boolean);
        results.push({
          element: question,
          label: label || "Unknown field",
          required: isRequiredField(radios[0], question),
          kind: "radio-group",
          options,
        });
        return;
      }

      const textInput = question.querySelector<HTMLInputElement>(
        "input:not([type='hidden']):not([type='file']):not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio']):not([type='password']):not([type='reset'])",
      );
      if (
        textInput &&
        isVisibleElement(textInput) &&
        !SKIP_INPUT_TYPES.has((textInput.type || "text").toLowerCase())
      ) {
        if (!remember(textInput.getAttribute("name") || textInput.id)) return;
        results.push({
          element: textInput,
          label: label || getFieldLabel(textInput),
          required: isRequiredField(textInput, question),
          kind: isLocationInput(textInput) ? "location" : "text",
        });
      }
    });

  // Catch native selects missed above (EEO often sits in a sibling `.eeo-section`).
  const selectRoot =
    document.querySelector("form#application-form") ||
    document.querySelector("#application-form") ||
    document;
  selectRoot.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    const question = select.closest(
      ".application-question",
    ) as HTMLElement | null;
    pushSelectField(select, question, results, remember);
  });

  return results;
};

/**
 * Scans the Lever application form and builds an API payload
 * with field labels, required flags, types, and select/checkbox options.
 */
export const scanLeverHtmlToMakeApiPayload = async (
  options: LeverScanToMakeApiOptions = {},
): Promise<LeverScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectLeverCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "text" || candidate.kind === "location") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "text",
      });
      continue;
    }

    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      options: candidate.options ?? [],
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "lever",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
