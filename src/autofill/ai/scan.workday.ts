import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
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

const getFieldLabel = (element: HTMLElement): string => {
  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }

  // Listbox buttons often have verbose aria-label ("Country India Required")
  // Prefer associated label[for] above, then legend / formField label.
  const wrapper = getWorkdayFieldWrapper(element);
  const wrapperLabel =
    wrapper?.querySelector("legend label, legend, label") ?? null;
  if (wrapperLabel?.textContent) {
    const text = cleanLabelText(wrapperLabel.textContent);
    if (text) return text;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    // Strip trailing "Required" / current selection noise when possible
    return cleanLabelText(
      ariaLabel
        .replace(/\s+Required$/i, "")
        .replace(/\s+Select One$/i, "")
        .trim(),
    );
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
  return "Unknown field";
};

export type WorkdayFieldKind =
  | "text"
  | "listbox"
  | "multiselect"
  | "select"
  | "radio-group";

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
  const key = cleanLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  return (
    key === "country" ||
    key === "countryphonecode" ||
    key === "phonecountrycode" ||
    key === "phonecode"
  );
};

/**
 * Collect autofillable fields on the **current** Workday apply page.
 * Multi-step flows only expose the active page — re-scan after "Save and Continue".
 */
export const collectWorkdayCandidateFields = (): WorkdayCandidateField[] => {
  const results: WorkdayCandidateField[] = [];
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();

  const markSeen = (id: string, label: string): boolean => {
    const idKey = id.toLowerCase();
    const labelKey = label.toLowerCase();
    if (seenIds.has(idKey) || (labelKey && seenLabels.has(labelKey))) {
      return false;
    }
    seenIds.add(idKey);
    if (labelKey) seenLabels.add(labelKey);
    return true;
  };

  // 1) Custom listbox dropdowns (Country, State, Phone Device Type, …)
  // Country is set in prepareBeforeScan from applicant data — exclude from scan.
  document
    .querySelectorAll<HTMLButtonElement>(LISTBOX_BUTTON_SELECTOR)
    .forEach((button) => {
      if (isInsideExtension(button) || !isVisibleElement(button)) return;

      const id =
        button.getAttribute("id") ||
        button.getAttribute("name") ||
        `listbox-${results.length}`;
      const label = getFieldLabel(button);
      if (isWorkdayPrefillExcludedLabel(label)) return;
      if (
        button.getAttribute("name") === "country" ||
        button.id === "country--country"
      ) {
        return;
      }
      if (!markSeen(id, label)) return;

      results.push({
        element: button,
        label,
        required: isRequiredField(button),
        kind: "listbox",
      });
    });

  // 2) Multiselect / prompt fields
  // Country Phone Code auto-updates when Country changes — exclude from scan.
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
      let label = getMultiselectLabel(container);
      // Align with Greenhouse phone naming when applicable
      if (/country phone code|phone code/i.test(label)) {
        label = "Country Phone Code";
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
      if (!markSeen(id, label)) return;

      results.push({
        element: container,
        label,
        required: isRequiredField(input as HTMLElement) || isRequiredField(container),
        kind: "multiselect",
      });
    });

  // 3) Radio groups (Yes/No previous worker, etc.)
  document
    .querySelectorAll<HTMLElement>("fieldset")
    .forEach((container) => {
      if (isInsideExtension(container)) return;

      const radios = container.querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      );
      if (radios.length === 0) return;

      const options = getRadioGroupOptions(container);
      if (options.length === 0) return;

      const label = getRadioGroupLabel(container);
      const firstRadio = radios[0];
      const id =
        firstRadio.getAttribute("name") ||
        container.getAttribute("data-automation-id") ||
        `radio-${results.length}`;
      if (!markSeen(id, label)) return;

      results.push({
        element: container,
        label,
        required: isRequiredField(firstRadio) || isRequiredField(container),
        kind: "radio-group",
        options,
      });
    });

  // Also catch radio groups that are not wrapped in fieldset
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

      const label = getRadioGroupLabel(container);
      const firstRadio = radios[0];
      const id =
        firstRadio.getAttribute("name") ||
        container.getAttribute("data-automation-id") ||
        `radio-${results.length}`;
      if (!markSeen(id, label)) return;

      results.push({
        element: container,
        label,
        required: isRequiredField(firstRadio) || isRequiredField(container),
        kind: "radio-group",
        options,
      });
    });

  // 4) Native text / textarea / select
  document
    .querySelectorAll<HTMLElement>("input, textarea, select")
    .forEach((element) => {
      if (isInsideExtension(element) || !isVisibleElement(element)) return;
      if (isListboxValueStoreInput(element)) return;
      if (isInsideMultiselect(element)) return;

      if (element instanceof HTMLInputElement) {
        const type = (element.type || "text").toLowerCase();
        if (SKIP_INPUT_TYPES.has(type)) return;
      }

      const id =
        element.getAttribute("id") ||
        element.getAttribute("name") ||
        `field-${results.length}`;
      const label = getFieldLabel(element);
      if (!label || label === "Unknown field") {
        // Skip unlabeled store inputs
        if (!element.getAttribute("id") && !element.getAttribute("name")) {
          return;
        }
      }
      if (!markSeen(id, label)) return;

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

/**
 * Scans the current Workday apply page and builds an API payload
 * with field labels, required flags, types, and select options.
 */
export const scanWorkdayHtmlToMakeApiPayload = async (
  options: WorkdayScanToMakeApiOptions = {},
): Promise<WorkdayScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectWorkdayCandidateFields();
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

    if (candidate.kind === "select" || candidate.kind === "radio-group") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: candidate.options ?? [],
      });
      continue;
    }

    // listbox / multiselect – open and collect options
    const target =
      candidate.kind === "multiselect"
        ? (candidate.element.querySelector<HTMLElement>(
            'input[data-uxi-widget-type="selectinput"], input[id]',
          ) ?? candidate.element)
        : candidate.element;

    const optionList = await openAndScanListboxOptions(target);
    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      ...(optionList.length > 0 ? { options: optionList } : {}),
    });
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
