import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface AshbyScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface AshbyScanToMakeApiOptions {
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
  "checkbox",
  "radio",
  "password",
  "image",
]);

const FIELD_ENTRY_SELECTOR =
  ".ashby-application-form-field-entry, [class*='_fieldEntry_']";
const FORM_CONTAINER_SELECTOR =
  ".ashby-application-form-container, [class*='_jobPostingForm_'], .ashby-survey-form-container, [class*='ashby-survey-form']";

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

/** All Ashby application + survey form roots on the page (first-match query only misses diversity survey). */
const getAshbyFormRoots = (): HTMLElement[] => {
  const roots = Array.from(
    document.querySelectorAll<HTMLElement>(FORM_CONTAINER_SELECTOR),
  ).filter((el) => !isInsideExtension(el));

  if (roots.length === 0) {
    return [document.body];
  }

  // Prefer leaf-most containers so nested survey wrappers don't double-scan children
  return roots.filter(
    (root) => !roots.some((other) => other !== root && root.contains(other)),
  );
};

const isVisibleElement = (element: HTMLElement): boolean => {
  if (element.closest(".visually-hidden, [aria-hidden='true']")) {
    return false;
  }
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }

  // Ashby resume input is visually clipped; other clipped file-like controls still skip
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  // Visually clipped absolute inputs (except we skip file already)
  if (
    style.position === "absolute" &&
    (style.clipPath?.includes("inset") || style.clip?.includes("rect"))
  ) {
    return false;
  }

  return true;
};

const getAshbyFieldEntry = (element: Element): HTMLElement | null =>
  element.closest(FIELD_ENTRY_SELECTOR) as HTMLElement | null;

const getFieldLabel = (element: HTMLElement): string => {
  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }

  const entry = getAshbyFieldEntry(element);
  const entryLabel =
    entry?.querySelector(
      "label.ashby-application-form-question-title, label._heading_f7cvd_52",
    ) ??
    entry?.querySelector("label[class*='_label_'], label");
  if (entryLabel?.textContent) {
    return cleanLabelText(entryLabel.textContent);
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return cleanLabelText(ariaLabel);
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  return id ?? element.getAttribute("name") ?? "Unknown field";
};

const isRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const id = element.getAttribute("id");
  const label =
    (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
    getAshbyFieldEntry(element)?.querySelector("label");

  if (!label) return false;

  if (
    label.classList.contains("_required_f7cvd_91") ||
    Array.from(label.classList).some((c) => c.includes("required"))
  ) {
    return true;
  }

  if (label.textContent?.includes("*")) {
    return true;
  }

  return false;
};

const isComboboxInput = (element: HTMLElement): boolean =>
  (element instanceof HTMLInputElement ||
    element instanceof HTMLButtonElement) &&
  (element.getAttribute("role") === "combobox" ||
    element.getAttribute("aria-haspopup") === "listbox");

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

/** Resolve the human-readable label for a radio/checkbox option control. */
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

  const aria = input.getAttribute("aria-label");
  if (aria) return cleanLabelText(aria);

  // Ashby multi-checkbox uses option text as `name`
  if (input.name && !input.name.includes("_systemfield") && input.name.length < 120) {
    return cleanLabelText(input.name);
  }

  if (input.value) return cleanLabelText(input.value);
  return "";
};

/**
 * True for Ashby's internal yes/no state checkbox (not a labeled survey option).
 */
const isAshbyYesNoStateCheckbox = (checkbox: HTMLInputElement): boolean => {
  if (checkbox.closest("[class*='_yesno_']")) return true;
  // Hidden state-only checkbox without an option label
  if (!checkbox.id && !checkbox.closest("[class*='_option_']")) return true;
  return false;
};

const extractRadioOrButtonOptions = (entry: HTMLElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();
  const titleLabel =
    entry.querySelector(
      "label.ashby-application-form-question-title, label._heading_f7cvd_52",
    ) ?? entry.querySelector("legend");
  const titleText = cleanLabelText(titleLabel?.textContent ?? "");

  const add = (text: string) => {
    const label = cleanLabelText(text);
    if (!label || seen.has(label)) return;
    // Skip the question title itself
    if (titleText && titleText === label) return;
    seen.add(label);
    options.push(label);
  };

  entry
    .querySelectorAll<HTMLInputElement>("input[type='radio']")
    .forEach((radio) => {
      const label = getChoiceOptionLabel(radio);
      if (label) add(label);
    });

  // Multi-select survey checkboxes ("select all that apply")
  entry
    .querySelectorAll<HTMLInputElement>("input[type='checkbox']")
    .forEach((checkbox) => {
      if (isAshbyYesNoStateCheckbox(checkbox)) return;
      const label = getChoiceOptionLabel(checkbox);
      if (label) add(label);
    });

  if (options.length > 0) return options;

  // Ashby yes/no (and multi-option) button groups under the question title
  entry
    .querySelectorAll<HTMLElement>("button, [role='radio'], [role='option']")
    .forEach((btn) => {
      const text = cleanLabelText(btn.textContent ?? "");
      if (!text || text.length > 80) return;
      if (/replace|delete|remove|submit|continue|upload/i.test(text)) return;
      add(text);
    });

  return options;
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const closeListbox = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const scanOpenListboxOptions = (): string[] => {
  const results: string[] = [];
  const seen = new Set<string>();

  document
    .querySelectorAll<HTMLElement>(
      "[role='listbox'] [role='option'], [role='option']",
    )
    .forEach((opt) => {
      const style = window.getComputedStyle(opt);
      if (style.display === "none" || style.visibility === "hidden") return;
      const label = cleanLabelText(opt.textContent ?? "");
      if (!label || seen.has(label)) return;
      seen.add(label);
      results.push(label);
    });

  return results;
};

const openAndScanComboboxOptions = async (
  element: HTMLElement,
): Promise<string[]> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(100);
  }

  element.focus();
  element.click();
  await delay(200);
  await waitForDomUpdate();

  let options = scanOpenListboxOptions();
  if (options.length === 0) {
    await delay(200);
    await waitForDomUpdate();
    options = scanOpenListboxOptions();
  }

  closeListbox();
  await delay(100);
  return options;
};

export type AshbyFieldKind =
  | "text"
  | "combobox"
  | "select"
  | "option-group"
  | "checkbox-group";

export interface AshbyCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: AshbyFieldKind;
  /** Pre-collected options for option-groups / selects (used by autofill). */
  options?: string[];
}

/**
 * Collect autofillable Ashby application form fields from the host page
 * (main application form + optional diversity survey).
 */
export const collectAshbyCandidateFields = (): AshbyCandidateField[] => {
  const formRoots = getAshbyFormRoots();
  const results: AshbyCandidateField[] = [];
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();

  const collectFromRoot = (formRoot: HTMLElement) => {
    const candidates = formRoot.querySelectorAll<HTMLElement>(
      "input, textarea, select, [role='combobox']",
    );

    candidates.forEach((element) => {
      if (isInsideExtension(element) || !isVisibleElement(element)) {
        return;
      }

      if (element instanceof HTMLInputElement) {
        const type = (element.type || "text").toLowerCase();
        if (SKIP_INPUT_TYPES.has(type)) {
          return;
        }
      }

      // Skip non-form buttons that happen to be comboboxes outside a field entry
      if (
        element instanceof HTMLButtonElement &&
        !getAshbyFieldEntry(element) &&
        element.getAttribute("role") !== "combobox"
      ) {
        return;
      }

      const id =
        element.getAttribute("id") ||
        element.getAttribute("name") ||
        `${results.length}`;
      if (seenIds.has(id)) {
        return;
      }
      seenIds.add(id);

      const label = getFieldLabel(element);
      if (seenLabels.has(label.toLowerCase())) {
        return;
      }
      seenLabels.add(label.toLowerCase());

      if (element instanceof HTMLSelectElement) {
        results.push({
          element,
          label,
          required: isRequiredField(element),
          kind: "select",
          options: getNativeSelectOptions(element),
        });
        return;
      }

      if (isComboboxInput(element)) {
        results.push({
          element,
          label,
          required: isRequiredField(element),
          kind: "combobox",
        });
        return;
      }

      results.push({
        element,
        label,
        required: isRequiredField(element),
        kind: "text",
      });
    });

    // Option groups: Yes/No toggles, radio groups, multi-select checkboxes
    formRoot
      .querySelectorAll<HTMLElement>(FIELD_ENTRY_SELECTOR)
      .forEach((entry) => {
        if (isInsideExtension(entry)) return;

        const hasTextControl = entry.querySelector(
          "input:not([type='hidden']):not([type='file']):not([type='radio']):not([type='checkbox']):not([type='submit']):not([type='button']), textarea, select, [role='combobox']",
        );
        if (hasTextControl) return;

        const title =
          entry.querySelector(
            "label.ashby-application-form-question-title, label._heading_f7cvd_52",
          ) ??
          entry.querySelector("legend") ??
          entry.querySelector("label");
        const label = cleanLabelText(title?.textContent ?? "");
        if (!label || seenLabels.has(label.toLowerCase())) return;

        const options = extractRadioOrButtonOptions(entry);
        if (options.length === 0) return;

        const labeledCheckboxes = Array.from(
          entry.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
        ).filter((cb) => !isAshbyYesNoStateCheckbox(cb) && getChoiceOptionLabel(cb));

        const hasRadios =
          entry.querySelectorAll("input[type='radio']").length > 0;
        const hasYesNoButtons =
          !!entry.querySelector("[class*='_yesno_'] button, [class*='_yesno_'] [role='radio']");

        const kind: AshbyFieldKind =
          labeledCheckboxes.length > 0 && !hasRadios && !hasYesNoButtons
            ? "checkbox-group"
            : "option-group";

        seenLabels.add(label.toLowerCase());
        results.push({
          element: entry,
          label,
          required:
            !!title &&
            (Array.from(title.classList).some((c) => c.includes("required")) ||
              title.textContent?.includes("*") === true),
          kind,
          options,
        });
      });
  };

  formRoots.forEach(collectFromRoot);
  return results;
};

/**
 * Scans the Ashby application form and builds an API payload
 * with field labels, required flags, types, and select options.
 */
export const scanAshbyHtmlToMakeApiPayload = async (
  options: AshbyScanToMakeApiOptions = {},
): Promise<AshbyScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectAshbyCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "text") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "text",
      });
      continue;
    }

    if (
      candidate.kind === "select" ||
      candidate.kind === "option-group" ||
      candidate.kind === "checkbox-group"
    ) {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: candidate.options ?? [],
      });
      continue;
    }

    // combobox – open and collect options when possible
    const comboboxOptions = await openAndScanComboboxOptions(candidate.element);
    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      ...(comboboxOptions.length > 0 ? { options: comboboxOptions } : {}),
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "ashby",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
