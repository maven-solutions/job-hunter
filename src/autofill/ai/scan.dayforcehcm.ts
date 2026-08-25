import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface DayforceHcmScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface DayforceHcmScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

export type DayforceHcmFieldKind = "text" | "combobox" | "select";

export interface DayforceHcmCandidateField {
  element: HTMLElement;
  /** Ant Select root when kind is combobox. */
  selectRoot?: HTMLElement;
  label: string;
  required: boolean;
  kind: DayforceHcmFieldKind;
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

const PLACEHOLDER_OPTION_RE =
  /^(select(\s+one)?|please select|choose(\s+one)?|n\/?a|-|—|--|\.+)$/i;

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const isDisplayVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

export const getDayforceHcmAntSelectRoot = (
  element: Element,
): HTMLElement | null =>
  (element.closest(".ant-select") as HTMLElement | null) ?? null;

export const getDayforceHcmComboboxInput = (
  selectRoot: HTMLElement,
): HTMLInputElement | null =>
  selectRoot.querySelector<HTMLInputElement>(
    "input.ant-select-selection-search-input, input[role='combobox']",
  );

const isAntSelectDisabled = (selectRoot: HTMLElement): boolean =>
  selectRoot.classList.contains("ant-select-disabled") ||
  selectRoot.getAttribute("aria-disabled") === "true" ||
  !!getDayforceHcmComboboxInput(selectRoot)?.disabled;

const getAntSelectDisplayValue = (selectRoot: HTMLElement): string => {
  const item = selectRoot.querySelector<HTMLElement>(
    ".ant-select-selection-item",
  );
  if (item?.textContent) {
    return cleanLabelText(item.textContent);
  }
  const input = getDayforceHcmComboboxInput(selectRoot);
  return cleanLabelText(input?.value ?? "");
};

const getFormItem = (element: Element): HTMLElement | null =>
  (element.closest(".ant-form-item") as HTMLElement | null) ?? null;

const getFormItemLabelText = (formItem: HTMLElement | null): string => {
  if (!formItem) return "";
  const label =
    formItem.querySelector<HTMLElement>(".ant-form-item-label label") ??
    formItem.querySelector<HTMLElement>("label");
  return cleanLabelText(
    label?.textContent ?? label?.getAttribute("title") ?? "",
  );
};

export const isDayforceHcmPhoneCountryCombobox = (
  selectRoot: HTMLElement,
): boolean => {
  const testId = selectRoot.getAttribute("test-id") || "";
  if (/phone-dropdown/i.test(testId)) return true;
  const aria =
    selectRoot.getAttribute("aria-label") ||
    getDayforceHcmComboboxInput(selectRoot)?.getAttribute("aria-label") ||
    "";
  return /country dialing code|dialing code|country code/i.test(aria);
};

export const getDayforceHcmFieldLabel = (element: HTMLElement): string => {
  const selectRoot = getDayforceHcmAntSelectRoot(element);
  if (selectRoot && isDayforceHcmPhoneCountryCombobox(selectRoot)) {
    const parentLabel = getFormItemLabelText(getFormItem(selectRoot));
    if (parentLabel) return `${parentLabel} Country Code`;
    return "Phone Country Code";
  }

  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel && !/country dialing code/i.test(ariaLabel)) {
    return cleanLabelText(ariaLabel);
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  const formItemLabel = getFormItemLabelText(getFormItem(element));
  if (formItemLabel) return formItemLabel;

  return id ?? "Unknown field";
};

export const isDayforceHcmRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const formItem = getFormItem(element);
  if (
    formItem?.querySelector(
      ".ant-form-item-required, label.ant-form-item-required",
    )
  ) {
    return true;
  }

  const label =
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) ||
    formItem?.querySelector("label");

  if (label?.classList.contains("ant-form-item-required")) return true;
  if (label?.textContent?.includes("*")) return true;

  return false;
};

export const getDayforceHcmFieldValue = (
  field: DayforceHcmCandidateField,
): string => {
  if (field.kind === "combobox" && field.selectRoot) {
    return getAntSelectDisplayValue(field.selectRoot);
  }
  if (field.element instanceof HTMLSelectElement) {
    const selected = field.element.selectedOptions[0];
    return cleanLabelText(selected?.textContent ?? field.element.value ?? "");
  }
  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return (field.element.value ?? "").trim();
  }
  return "";
};

export const isDayforceHcmFieldFilled = (
  field: DayforceHcmCandidateField,
): boolean => getDayforceHcmFieldValue(field).length > 0;

const isVisibleTextControl = (element: HTMLElement): boolean => {
  if (isInsideExtension(element)) return false;
  if (element.closest(".ant-select")) return false;
  if (element.closest(".visually-hidden, [aria-hidden='true']")) return false;
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }
  return isDisplayVisible(element);
};

const isVisibleSelectRoot = (selectRoot: HTMLElement): boolean => {
  if (isInsideExtension(selectRoot)) return false;
  if (selectRoot.getAttribute("aria-hidden") === "true") return false;
  // Compact phone-code selects are easy to miss with rect/aria-hidden checks.
  if (isDayforceHcmPhoneCountryCombobox(selectRoot)) {
    return selectRoot.isConnected;
  }
  return isDisplayVisible(selectRoot);
};

const getVisibleAntDropdown = (): HTMLElement | null => {
  const dropdowns = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
    ),
  ).filter((node) => {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  });
  return dropdowns[dropdowns.length - 1] ?? null;
};

/** Resolve the open Ant / rc-virtual-list listbox for this select. */
export const getDayforceHcmListbox = (
  selectRoot: HTMLElement,
): HTMLElement | null => {
  const input = getDayforceHcmComboboxInput(selectRoot);
  const listId =
    input?.getAttribute("aria-controls") || input?.getAttribute("aria-owns");
  if (listId) {
    const list = document.getElementById(listId);
    if (list?.querySelector('[role="option"], .ant-select-item-option')) {
      return list;
    }
  }

  const virtualInner = document.querySelector<HTMLElement>(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .rc-virtual-list-holder-inner[role='listbox'], .rc-virtual-list-holder-inner[role='listbox']",
  );
  if (virtualInner?.querySelector('[role="option"]')) {
    return virtualInner;
  }

  return getVisibleAntDropdown();
};

const collectOptionsFromDropdown = (dropdown: HTMLElement): string[] => {
  const results: string[] = [];
  const seen = new Set<string>();

  dropdown
    .querySelectorAll<HTMLElement>(
      ".ant-select-item-option, [role='option']",
    )
    .forEach((optionEl) => {
      if (
        optionEl.getAttribute("aria-disabled") === "true" ||
        optionEl.classList.contains("ant-select-item-option-disabled")
      ) {
        return;
      }
      const content =
        optionEl.querySelector(".ant-select-item-option-content")
          ?.textContent ?? optionEl.textContent;
      const label = cleanLabelText(content ?? "");
      if (!label || seen.has(label)) return;
      if (PLACEHOLDER_OPTION_RE.test(label)) return;
      seen.add(label);
      results.push(label);
    });

  return results;
};

const closeAntSelect = async (): Promise<void> => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await delay(80);
};

const openAntSelect = async (selectRoot: HTMLElement): Promise<boolean> => {
  if (isAntSelectDisabled(selectRoot)) return false;

  if (selectRoot.classList.contains("ant-select-open")) {
    await closeAntSelect();
    await delay(100);
  }

  const selector =
    selectRoot.querySelector<HTMLElement>(".ant-select-selector") ?? selectRoot;
  selector.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  selector.click();

  const input = getDayforceHcmComboboxInput(selectRoot);
  if (input && !input.readOnly) {
    input.focus();
    input.click();
  }

  await waitForDomUpdate();
  await delay(160);

  return (
    selectRoot.classList.contains("ant-select-open") ||
    input?.getAttribute("aria-expanded") === "true" ||
    getDayforceHcmListbox(selectRoot) != null
  );
};

const waitForAntDropdown = (timeoutMs = 900): Promise<HTMLElement | null> =>
  new Promise((resolve) => {
    const existing = getVisibleAntDropdown();
    if (existing) {
      resolve(existing);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(getVisibleAntDropdown());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const dropdown = getVisibleAntDropdown();
      if (dropdown) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(dropdown);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  });

export const openAndScanDayforceHcmComboboxOptions = async (
  selectRoot: HTMLElement,
): Promise<string[]> => {
  if (isAntSelectDisabled(selectRoot)) return [];

  const opened = await openAntSelect(selectRoot);
  if (!opened) return [];

  let dropdown =
    getDayforceHcmListbox(selectRoot) ?? (await waitForAntDropdown(1200));
  let options = dropdown ? collectOptionsFromDropdown(dropdown) : [];

  if (options.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    dropdown = getDayforceHcmListbox(selectRoot) ?? getVisibleAntDropdown();
    options = dropdown ? collectOptionsFromDropdown(dropdown) : [];
  }

  await closeAntSelect();
  return options;
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label)) return;
    if (!opt.value && PLACEHOLDER_OPTION_RE.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

/**
 * Collect autofillable Dayforce (Ant Design) fields on the host page.
 * Resume file input is skipped (handled in prepareBeforeScan).
 */
export const collectDayforceHcmCandidateFields =
  (): DayforceHcmCandidateField[] => {
    const results: DayforceHcmCandidateField[] = [];
    const seen = new Set<string>();

    const add = (field: DayforceHcmCandidateField): void => {
      const key =
        field.element.getAttribute("id") ||
        `${field.label}:${field.kind}:${results.length}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(field);
    };

    const addSelect = (selectRoot: HTMLElement): void => {
      if (!isVisibleSelectRoot(selectRoot)) return;
      const input = getDayforceHcmComboboxInput(selectRoot);
      if (!input) return;
      add({
        element: input,
        selectRoot,
        label: getDayforceHcmFieldLabel(input),
        required: isDayforceHcmRequiredField(input),
        kind: "combobox",
      });
    };

    // Compact "Country dialing code" selects (home/mobile) — collect first.
    document
      .querySelectorAll<HTMLElement>(
        '.ant-select[aria-label="Country dialing code"], [test-id$="-phone-dropdown"], input[aria-label="Country dialing code"]',
      )
      .forEach((el) => {
        const root = el.classList.contains("ant-select")
          ? el
          : getDayforceHcmAntSelectRoot(el);
        if (root) addSelect(root);
      });

    document
      .querySelectorAll<HTMLElement>(".ant-select")
      .forEach((selectRoot) => {
        addSelect(selectRoot);
      });

    document
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      )
      .forEach((element) => {
        if (!isVisibleTextControl(element)) return;
        if (element instanceof HTMLInputElement) {
          const type = (element.type || "text").toLowerCase();
          if (SKIP_INPUT_TYPES.has(type)) return;
        }

        add({
          element,
          label: getDayforceHcmFieldLabel(element),
          required: isDayforceHcmRequiredField(element),
          kind: "text",
        });
      });

    document.querySelectorAll<HTMLSelectElement>("select").forEach((element) => {
      if (!isVisibleTextControl(element)) return;
      add({
        element,
        label: getDayforceHcmFieldLabel(element),
        required: isDayforceHcmRequiredField(element),
        kind: "select",
      });
    });

    return results;
  };

/**
 * Scans the Dayforce HCM application form after resume parse.
 * Already-filled fields (from Dayforce's parser) are omitted so the AI
 * only answers remaining questions and does not overwrite parsed values.
 */
export const scanDayforceHcmHtmlToMakeApiPayload = async (
  options: DayforceHcmScanToMakeApiOptions = {},
): Promise<DayforceHcmScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectDayforceHcmCandidateFields().filter(
    (field) => !isDayforceHcmFieldFilled(field),
  );
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

    if (candidate.kind === "select") {
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: getNativeSelectOptions(
          candidate.element as HTMLSelectElement,
        ),
      });
      continue;
    }

    const comboboxOptions = candidate.selectRoot
      ? await openAndScanDayforceHcmComboboxOptions(candidate.selectRoot).catch(
          () => [] as string[],
        )
      : [];
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
    source: "dayforcehcm",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
