import { AiNestedFieldSchema } from "./types";
import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";
import { Applicant } from "../data";
import {
  isWorkdayApplicationQuestionsPage,
  isWorkdayMyExperiencePage,
} from "./workday/detect";
import {
  buildApplicationQuestionsScanElements,
  collectApplicationQuestionFields,
} from "./workday/sections/applicationQuestions";

export { isWorkdayMyExperiencePage };

export type ApiElementType = string;

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[] | AiNestedFieldSchema[];
  description?: string;
  count?: number;
}

export interface WorkdayScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface WorkdayScanToMakeApiOptions {
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

const MULTISELECT_SELECTOR =
  '[data-automation-id="multiSelectContainer"], [data-uxi-widget-type="multiselect"]';
const LISTBOX_BUTTON_SELECTOR = 'button[aria-haspopup="listbox"]';

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

const isVisibleElement = (element: HTMLElement): boolean => {
  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  // Companion value inputs next to listbox buttons are often zero-sized
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }
  return true;
};

/**
 * Text input that only stores the selected listbox id (sibling of dropdown button).
 */
const isListboxValueStoreInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) return false;
  const parent = element.parentElement;
  if (!parent) return false;
  return !!parent.querySelector(LISTBOX_BUTTON_SELECTOR);
};

const isInsideMultiselect = (element: Element): boolean =>
  !!element.closest(MULTISELECT_SELECTOR);

const getWorkdayFieldWrapper = (element: Element): HTMLElement | null =>
  element.closest(
    '[data-automation-id^="formField-"], [data-fkit-id], .css-7t35fz, fieldset',
  ) as HTMLElement | null;

/**
 * Panel title for repeated sections (e.g. "Work Experience 1", "Education 1").
 * Keeps labels unique when multiple entries share the same field name.
 */
const getSectionTitle = (element: Element): string => {
  let current: Element | null = element;
  while (current) {
    const group = current.closest('[role="group"]') as HTMLElement | null;
    if (!group || isInsideExtension(group)) break;

    const labelledBy = group.getAttribute("aria-labelledby");
    if (labelledBy) {
      const heading = document.getElementById(labelledBy.split(/\s+/)[0]);
      const text = cleanLabelText(heading?.textContent ?? "");
      // Prefer entry panels over section headers ("Work Experience 1" not "Work Experience")
      if (/^(work experience|education|certification)\s*\d+/i.test(text)) {
        return text;
      }
      if (/-?\d+-panel$/i.test(labelledBy) && text) {
        return text;
      }
    }

    const h5 = group.querySelector(":scope > div > h5, :scope h5");
    if (h5?.textContent) {
      const text = cleanLabelText(h5.textContent);
      if (/^(work experience|education)\s*\d+/i.test(text)) {
        return text;
      }
    }

    current = group.parentElement;
  }

  const panelRoot = element.closest(".css-1ebprri");
  const h5 = panelRoot?.querySelector("h5");
  if (h5?.textContent) {
    return cleanLabelText(h5.textContent);
  }

  return "";
};

/** Prefix field label with section when inside Work Experience N / Education N. */
export const withSectionLabel = (
  baseLabel: string,
  element: Element,
): string => {
  const base = cleanLabelText(baseLabel);
  if (!base) return base;
  const section = getSectionTitle(element);
  if (!section) return base;
  if (base.toLowerCase().startsWith(section.toLowerCase())) return base;
  return `${section} - ${base}`;
};

const getFieldLabel = (element: HTMLElement): string => {
  let base = "";

  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      base = cleanLabelText(label.textContent);
    }
  }

  if (!base) {
    const wrapper = getWorkdayFieldWrapper(element);
    const wrapperLabel =
      wrapper?.querySelector("legend label, legend, label") ?? null;
    if (wrapperLabel?.textContent) {
      base = cleanLabelText(wrapperLabel.textContent);
    }
  }

  if (!base) {
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
      base = cleanLabelText(
        ariaLabel
          .replace(/\s+Required$/i, "")
          .replace(/\s+Select One$/i, "")
          .trim(),
      );
    }
  }

  if (!base) {
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
      if (labelEl?.textContent) {
        base = cleanLabelText(labelEl.textContent);
      }
    }
  }

  if (!base) {
    base = id ?? element.getAttribute("name") ?? "Unknown field";
  }

  return withSectionLabel(base, element);
};

const isRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const group = element.closest("[aria-required], [required]");
  if (
    group?.getAttribute("aria-required") === "true" ||
    group?.hasAttribute("required")
  ) {
    return true;
  }

  const id = element.getAttribute("id");
  const label =
    (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
    getWorkdayFieldWrapper(element)?.querySelector("label, legend");

  if (label?.querySelector("abbr")?.textContent?.includes("*")) {
    return true;
  }
  if (label?.textContent?.includes("*")) {
    return true;
  }

  // Workday listbox buttons: aria-label often ends with "Required"
  const ariaLabel = element.getAttribute("aria-label") ?? "";
  if (/\brequired\b/i.test(ariaLabel)) {
    return true;
  }

  return false;
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

const isNodeVisible = (node: HTMLElement): boolean => {
  if (!node.isConnected) return false;
  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const scanOpenListboxOptions = (): string[] => {
  const results: string[] = [];
  const seen = new Set<string>();

  document
    .querySelectorAll<HTMLElement>(
      '[role="listbox"] [role="option"], [role="option"], [data-automation-id="promptOption"]',
    )
    .forEach((opt) => {
      if (!isNodeVisible(opt)) return;
      // Skip already-selected multiselect pills in the closed control
      if (opt.closest('[data-automation-id="selectedItemList"]')) return;

      const label =
        cleanLabelText(
          opt.getAttribute("data-automation-label") ??
            opt.getAttribute("aria-label") ??
            opt.textContent ??
            "",
        ) || "";
      // Strip "press delete..." accessibility suffixes
      const cleaned = label
        .replace(/,?\s*press delete.*$/i, "")
        .replace(/,?\s*press enter.*$/i, "")
        .trim();
      if (!cleaned || seen.has(cleaned)) return;
      if (/^select one$/i.test(cleaned)) return;
      seen.add(cleaned);
      results.push(cleaned);
    });

  return results;
};

const openAndScanListboxOptions = async (
  element: HTMLElement,
): Promise<string[]> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(100);
  }

  element.focus();
  element.click();
  await delay(250);
  await waitForDomUpdate();

  let options = scanOpenListboxOptions();
  if (options.length === 0) {
    // Multiselect / prompt: may need a second click on the icon
    const multi = element.closest(MULTISELECT_SELECTOR) as HTMLElement | null;
    const icon = multi?.querySelector<HTMLElement>(
      '[data-automation-id="promptIcon"]',
    );
    if (icon) {
      icon.click();
      await delay(250);
      await waitForDomUpdate();
      options = scanOpenListboxOptions();
    }
  }

  if (options.length === 0) {
    await delay(200);
    await waitForDomUpdate();
    options = scanOpenListboxOptions();
  }

  closeListbox();
  await delay(100);
  return options;
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

/** Labels for radio options under a fieldset / formField. */
const getRadioGroupOptions = (container: HTMLElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();
  const title = cleanLabelText(
    container.querySelector("legend, legend label, label")?.textContent ?? "",
  );

  container
    .querySelectorAll<HTMLInputElement>('input[type="radio"]')
    .forEach((radio) => {
      let label = "";
      if (radio.id) {
        const forLabel = document.querySelector(
          `label[for="${CSS.escape(radio.id)}"]`,
        );
        if (forLabel?.textContent) {
          label = cleanLabelText(forLabel.textContent);
        }
      }
      if (!label) {
        const siblingLabel = radio
          .closest("div")
          ?.querySelector("label:not([id])");
        label = cleanLabelText(siblingLabel?.textContent ?? "");
      }
      if (!label && radio.value) {
        label =
          radio.value === "true"
            ? "Yes"
            : radio.value === "false"
              ? "No"
              : cleanLabelText(radio.value);
      }
      if (!label || seen.has(label) || label === title) return;
      seen.add(label);
      options.push(label);
    });

  return options;
};

const getRadioGroupLabel = (container: HTMLElement): string => {
  const legendLabel = container.querySelector("legend label, legend");
  if (legendLabel?.textContent) {
    return cleanLabelText(legendLabel.textContent);
  }
  const labelledBy = container.getAttribute("aria-labelledby");
  if (labelledBy) {
    const el = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (el?.textContent) return cleanLabelText(el.textContent);
  }
  return "Unknown field";
};

const getMultiselectLabel = (container: HTMLElement): string => {
  const input = container.querySelector<HTMLElement>(
    'input[data-uxi-widget-type="selectinput"], input[id]',
  );
  if (input) {
    return getFieldLabel(input);
  }
  return withSectionLabel("Unknown field", container);
};

export type WorkdayFieldKind =
  | "text"
  | "listbox"
  | "multiselect"
  | "select"
  | "radio-group"
  | "date-mmyyyy"
  | "checkbox";

export interface WorkdayCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: WorkdayFieldKind;
  options?: string[];
}

/**
 * Pre-filled by Workday prep (applicant country) or auto-filled by the site
 * when Country changes. Never scan or AI-fill these fields.
 */
export const isWorkdayPrefillExcludedLabel = (label: string): boolean => {
  const bare = label.includes(" - ")
    ? label.slice(label.lastIndexOf(" - ") + 3)
    : label;
  const key = cleanLabelText(bare)
    .toLowerCase()
    .replace(/['\u2019`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  return (
    key === "country" ||
    key === "countryphonecode" ||
    key === "phonecountrycode" ||
    key === "phonecode"
  );
};

const isDateSpinbutton = (element: HTMLElement): boolean =>
  element.getAttribute("role") === "spinbutton" ||
  !!element.closest('[data-automation-id="dateInputWrapper"]') ||
  !!element.getAttribute("data-automation-id")?.includes("dateSection");

/**
 * Collect autofillable fields on the **current** Workday apply page.
 * Multi-step flows only expose the active page — re-scan after "Save and Continue".
 * My Experience: Work Experience N / Education N get section-prefixed labels.
 * Application Questions: rich-text listbox questions (section module).
 */
export const collectWorkdayCandidateFields = (): WorkdayCandidateField[] => {
  // Application Questions — dedicated collector (rich-text legends, not aria "Select One")
  if (isWorkdayApplicationQuestionsPage()) {
    return collectApplicationQuestionFields().map((field) => {
      const kind: WorkdayFieldKind =
        field.kind === "listbox"
          ? "listbox"
          : field.kind === "radio-group"
            ? "radio-group"
            : field.kind === "checkbox"
              ? "checkbox"
              : "text";
      return {
        element: field.element,
        label: field.label,
        required: field.required,
        kind,
        options: field.options,
      };
    });
  }

  const results: WorkdayCandidateField[] = [];
  const seenIds = new Set<string>();

  // Deduplicate by control id only so multiple WE entries aren't collapsed by label.
  const markSeen = (id: string): boolean => {
    const idKey = id.toLowerCase();
    if (seenIds.has(idKey)) return false;
    seenIds.add(idKey);
    return true;
  };

  // 1) Custom listbox dropdowns (Country, State, Degree, …)
  document
    .querySelectorAll<HTMLButtonElement>(LISTBOX_BUTTON_SELECTOR)
    .forEach((button) => {
      if (isInsideExtension(button) || !isVisibleElement(button)) return;

      const id =
        button.getAttribute("id") ||
        button.getAttribute("name") ||
        `listbox-${results.length}`;
      if (!markSeen(id)) return;

      const label = getFieldLabel(button);
      if (isWorkdayPrefillExcludedLabel(label)) return;
      if (
        button.getAttribute("name") === "country" ||
        button.id === "country--country"
      ) {
        return;
      }

      results.push({
        element: button,
        label,
        required: isRequiredField(button),
        kind: "listbox",
      });
    });

  // 2) Multiselect / type-to-search (School, Field of Study, Skills, …)
  document
    .querySelectorAll<HTMLElement>(MULTISELECT_SELECTOR)
    .forEach((container) => {
      if (isInsideExtension(container) || !isVisibleElement(container)) return;

      const input =
        container.querySelector<HTMLElement>(
          'input[data-uxi-widget-type="selectinput"], input[id]',
        ) ?? container;
      const id =
        input.getAttribute("id") ||
        container.getAttribute("id") ||
        `multiselect-${results.length}`;
      if (!markSeen(id)) return;

      let label = getMultiselectLabel(container);
      if (/country phone code|phone code/i.test(label)) {
        label = withSectionLabel("Country Phone Code", container);
      }
      if (isWorkdayPrefillExcludedLabel(label)) return;
      if (
        input.id === "phoneNumber--countryPhoneCode" ||
        container
          .closest("[data-automation-id]")
          ?.getAttribute("data-automation-id")
          ?.includes("countryPhoneCode")
      ) {
        return;
      }

      results.push({
        element: container,
        label,
        required:
          isRequiredField(input as HTMLElement) || isRequiredField(container),
        kind: "multiselect",
      });
    });

  // 3) MM/YYYY date groups (Work Experience From / To)
  document
    .querySelectorAll<HTMLElement>('[data-automation-id="dateInputWrapper"]')
    .forEach((wrapper) => {
      if (isInsideExtension(wrapper) || !isVisibleElement(wrapper)) return;

      const id = wrapper.getAttribute("id") || `date-${results.length}`;
      if (!markSeen(id)) return;

      const fieldset = wrapper.closest("fieldset");
      const formField = wrapper.closest(
        '[data-automation-id^="formField-"]',
      ) as HTMLElement | null;
      const legendLabel = cleanLabelText(
        fieldset?.querySelector("legend label, legend")?.textContent ?? "",
      );
      const baseLabel = legendLabel || "Date";
      const label = withSectionLabel(`${baseLabel} (MM/YYYY)`, wrapper);
      const monthInput = wrapper.querySelector<HTMLElement>(
        '[data-automation-id="dateSectionMonth-input"]',
      );
      const required =
        isRequiredField(monthInput ?? wrapper) ||
        !!formField?.querySelector("abbr") ||
        (fieldset?.querySelector("legend")?.textContent ?? "").includes("*");

      results.push({
        element: wrapper,
        label,
        required,
        kind: "date-mmyyyy",
      });
    });

  // 4) Radio groups (Yes/No previous worker, etc.)
  document.querySelectorAll<HTMLElement>("fieldset").forEach((container) => {
    if (isInsideExtension(container)) return;
    if (container.querySelector('[data-automation-id="dateInputWrapper"]')) {
      return;
    }

    const radios = container.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    );
    if (radios.length === 0) return;

    const options = getRadioGroupOptions(container);
    if (options.length === 0) return;

    const firstRadio = radios[0];
    const id =
      firstRadio.getAttribute("name") ||
      container.getAttribute("data-automation-id") ||
      `radio-${results.length}`;
    if (!markSeen(id)) return;

    results.push({
      element: container,
      label: getRadioGroupLabel(container),
      required: isRequiredField(firstRadio) || isRequiredField(container),
      kind: "radio-group",
      options,
    });
  });

  document
    .querySelectorAll<HTMLElement>('[data-automation-id^="formField-"]')
    .forEach((container) => {
      if (isInsideExtension(container)) return;
      if (container.querySelector("fieldset")) return;

      const radios = container.querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      );
      if (radios.length === 0) return;

      const options = getRadioGroupOptions(container);
      if (options.length === 0) return;

      const firstRadio = radios[0];
      const id =
        firstRadio.getAttribute("name") ||
        container.getAttribute("data-automation-id") ||
        `radio-${results.length}`;
      if (!markSeen(id)) return;

      results.push({
        element: container,
        label: getRadioGroupLabel(container),
        required: isRequiredField(firstRadio) || isRequiredField(container),
        kind: "radio-group",
        options,
      });
    });

  // 5) Labeled checkboxes (e.g. "I currently work here")
  document
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((checkbox) => {
      if (isInsideExtension(checkbox) || !isVisibleElement(checkbox)) return;

      if (
        checkbox.getAttribute("data-automation-id") === "phone-sms-opt-in" ||
        checkbox.id?.includes("sms")
      ) {
        return;
      }

      const id =
        checkbox.getAttribute("id") ||
        checkbox.getAttribute("name") ||
        `checkbox-${results.length}`;
      if (!markSeen(id)) return;

      const label = getFieldLabel(checkbox);
      if (!label || label === "Unknown field") return;

      results.push({
        element: checkbox,
        label,
        required: isRequiredField(checkbox),
        kind: "checkbox",
        options: ["Yes", "No"],
      });
    });

  // 6) Native text / textarea / select
  document
    .querySelectorAll<HTMLElement>("input, textarea, select")
    .forEach((element) => {
      if (isInsideExtension(element) || !isVisibleElement(element)) return;
      if (isListboxValueStoreInput(element)) return;
      if (isInsideMultiselect(element)) return;
      if (isDateSpinbutton(element)) return;

      if (element instanceof HTMLInputElement) {
        const type = (element.type || "text").toLowerCase();
        if (SKIP_INPUT_TYPES.has(type)) return;
      }

      const id =
        element.getAttribute("id") ||
        element.getAttribute("name") ||
        `field-${results.length}`;
      if (!markSeen(id)) return;

      const label = getFieldLabel(element);
      if (!label || label === "Unknown field") {
        if (!element.getAttribute("id") && !element.getAttribute("name")) {
          return;
        }
      }

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

      results.push({
        element,
        label,
        required: isRequiredField(element),
        kind: "text",
      });
    });

  return results;
};

/** Workday My Experience page detector re-exported from workday/detect. */

/** Count entry panels like "Work Experience 1", "Education 2". */
export const countWorkdayEntryPanels = (
  kind: "work" | "education",
): number => {
  const re =
    kind === "work"
      ? /^Work Experience\s*(\d+)$/i
      : /^Education\s*(\d+)$/i;
  const nums = new Set<number>();
  document.querySelectorAll("h5, [id$='-panel']").forEach((el) => {
    const text = cleanLabelText(el.textContent ?? "");
    const m = text.match(re);
    if (m) nums.add(Number(m[1]));
  });
  // Fallback: jobTitle / school inputs
  if (nums.size === 0) {
    if (kind === "work") {
      return document.querySelectorAll(
        'input[name="jobTitle"], [data-automation-id="formField-jobTitle"]',
      ).length;
    }
    return document.querySelectorAll(
      'input[id*="--school"], [data-automation-id="formField-school"]',
    ).length;
  }
  return nums.size;
};

const findSectionAddButton = (
  sectionLabelledBy: string,
): HTMLButtonElement | null => {
  const section =
    document.querySelector<HTMLElement>(
      `[aria-labelledby="${sectionLabelledBy}"]`,
    ) ||
    document
      .getElementById(sectionLabelledBy)
      ?.closest('[role="group"]')
      ?.parentElement;

  if (!section) return null;

  const add =
    section.querySelector<HTMLButtonElement>(
      'button[data-automation-id="add-button"]',
    ) ||
    Array.from(section.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => /add/i.test(b.textContent ?? ""),
    );

  return add ?? null;
};

/**
 * Click "Add Another" until the page has `needed` Work Experience or Education panels.
 * One panel is usually present already — only add the difference.
 */
export const ensureWorkdayEntryPanels = async (
  kind: "work" | "education",
  needed: number,
): Promise<void> => {
  if (!needed || needed < 1) return;

  const sectionId =
    kind === "work" ? "Work-Experience-section" : "Education-section";

  let current = countWorkdayEntryPanels(kind);
  // If section has no entry yet but has an Add button, click once to open first panel
  if (current === 0) {
    const add = findSectionAddButton(sectionId);
    if (add) {
      add.click();
      await delay(600);
      current = countWorkdayEntryPanels(kind);
    }
  }

  let guard = 0;
  while (current < needed && guard < 20) {
    const add = findSectionAddButton(sectionId);
    if (!add) break;
    add.click();
    await delay(700);
    const next = countWorkdayEntryPanels(kind);
    if (next <= current) {
      // DOM still settling
      await delay(500);
    }
    current = countWorkdayEntryPanels(kind);
    guard += 1;
  }
};

/**
 * Expand Work Experience / Education panels from applicant profile counts
 * before scanning the My Experience page.
 */
export const prepareWorkdayExperiencePanels = async (
  applicantData: Applicant | null | undefined,
): Promise<void> => {
  if (!isWorkdayMyExperiencePage()) return;

  const empCount = Array.isArray(applicantData?.employment_history)
    ? applicantData!.employment_history!.length
    : 0;
  const eduCount = Array.isArray(applicantData?.education)
    ? applicantData!.education!.length
    : 0;

  if (empCount > 0) {
    await ensureWorkdayEntryPanels("work", empCount);
  }
  if (eduCount > 0) {
    await ensureWorkdayEntryPanels("education", eduCount);
  }
};

const isRepeatableSectionFieldLabel = (label: string): boolean =>
  /^(work experience|education)\s*\d+\s*-/i.test(label.trim());

/**
 * Build nested Employment + Education group payload for My Experience.
 * Other top-level fields (Skills, LinkedIn) stay flat.
 */
const buildWorkdayExperiencePageElements = async (
  applicantData?: Applicant | null,
): Promise<ApiFormElement[]> => {
  const elements: ApiFormElement[] = [];

  const empCount = Array.isArray(applicantData?.employment_history)
    ? Math.max(1, applicantData!.employment_history!.length)
    : Math.max(1, countWorkdayEntryPanels("work") || 1);

  const eduCount = Array.isArray(applicantData?.education)
    ? Math.max(1, applicantData!.education!.length)
    : Math.max(1, countWorkdayEntryPanels("education") || 1);

  // Employment template (API returns one object per job inside the answer)
  const employmentFields: AiNestedFieldSchema[] = [
    { type: "text", label: "Job Title" },
    { type: "text", label: "Company" },
    { type: "text", label: "Location" },
    {
      type: "checkbox",
      label: "I currently work here",
      options: ["I currently work here"],
    },
    { type: "date", label: "From", description: "MM/YYYY" },
    { type: "date", label: "To", description: "MM/YYYY" },
    { type: "text", label: "Role Description" },
  ];

  elements.push({
    label: "Employment",
    required: true,
    type: "employment",
    count: empCount,
    options: employmentFields,
  });

  // Degree listbox options from first education Degree control
  let degreeOptions: string[] = [];
  const degreeBtn = document.querySelector<HTMLElement>(
    'button[aria-haspopup="listbox"][name="degree"], button[id*="--degree"]',
  );
  if (degreeBtn) {
    degreeOptions = await openAndScanListboxOptions(degreeBtn);
  }
  if (degreeOptions.length === 0) {
    degreeOptions = [
      "High School Diploma",
      "General Education Development Diploma (GED)",
      "Associates Degree",
      "Bachelor's Degree",
      "Master's Degree",
      "Doctorate Degree",
    ];
  }

  const educationFields: AiNestedFieldSchema[] = [
    { type: "multi-select", label: "School or University" },
    {
      type: "listbox",
      label: "Degree",
      options: degreeOptions,
    },
    { type: "multi-select", label: "Field of Study" },
  ];

  elements.push({
    label: "Education",
    required: true,
    type: "education",
    count: eduCount,
    options: educationFields,
  });

  // Flat companion fields on this page (not part of WE/Edu groups)
  const candidates = collectWorkdayCandidateFields().filter(
    (c) => !isRepeatableSectionFieldLabel(c.label),
  );

  for (const candidate of candidates) {
    // Skip fields that live inside WE/Education panels even if label format differs
    if (
      candidate.element.closest(
        '[aria-labelledby*="Work-Experience-"][aria-labelledby$="-panel"], [aria-labelledby*="Education-"][aria-labelledby$="-panel"]',
      )
    ) {
      continue;
    }
    // Skills multiselect, LinkedIn, websites
    if (candidate.kind === "text" || candidate.kind === "date-mmyyyy") {
      elements.push({
        label: candidate.label.replace(/\s*:$/, ""),
        required: candidate.required,
        type: "text",
      });
      continue;
    }
    if (candidate.kind === "multiselect") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "multi-select",
        options: [],
      });
      continue;
    }
    if (candidate.kind === "listbox") {
      const optionList = await openAndScanListboxOptions(candidate.element);
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "listbox",
        ...(optionList.length > 0 ? { options: optionList } : {}),
      });
      continue;
    }
    if (candidate.kind === "checkbox") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "checkbox",
        options: candidate.options ?? ["Yes", "No"],
      });
    }
  }

  return elements;
};

/**
 * Scans the current Workday apply page and builds an API payload.
 * Routes by section (only the active step is scanned):
 * - Application Questions: rich-text listbox questions
 * - My Experience: Employment / Education nested groups (+ skills, LinkedIn, …)
 * - My Information / other: flat text/search fields
 */
export const scanWorkdayHtmlToMakeApiPayload = async (
  options: WorkdayScanToMakeApiOptions & {
    applicantData?: Applicant | null;
  } = {},
): Promise<WorkdayScanToMakeApiPayload> => {
  const url = window.location.href;
  let elements: ApiFormElement[] = [];

  // Section-wise scan: only touch the active step.
  if (isWorkdayApplicationQuestionsPage()) {
    elements = (await buildApplicationQuestionsScanElements({
      applicantData: options.applicantData,
    })) as ApiFormElement[];
  } else if (isWorkdayMyExperiencePage()) {
    elements = await buildWorkdayExperiencePageElements(options.applicantData);
  } else {
    const candidates = collectWorkdayCandidateFields();

    for (const candidate of candidates) {
      if (candidate.kind === "text" || candidate.kind === "date-mmyyyy") {
        elements.push({
          label: candidate.label,
          required: candidate.required,
          type: "text",
        });
        continue;
      }

      if (candidate.kind === "checkbox") {
        elements.push({
          label: candidate.label,
          required: candidate.required,
          type: "search",
          options: candidate.options ?? ["Yes", "No"],
        });
        continue;
      }

      if (candidate.kind === "select" || candidate.kind === "radio-group") {
        elements.push({
          label: candidate.label,
          required: candidate.required,
          type: "search",
          options: candidate.options ?? [],
        });
        continue;
      }

      if (candidate.kind === "multiselect") {
        elements.push({
          label: candidate.label,
          required: candidate.required,
          type: "search",
        });
        continue;
      }

      const optionList = await openAndScanListboxOptions(candidate.element);
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        ...(optionList.length > 0 ? { options: optionList } : {}),
      });
    }
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "workday",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
