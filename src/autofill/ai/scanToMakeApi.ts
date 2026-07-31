import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface ScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface ScanToMakeApiOptions {
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

const cleanLabelText = (text: string): string =>
  text.replace(/\*/g, "").replace(/\s+/g, " ").trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

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
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
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
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  const uploadLabel = element
    .closest(".file-upload, [role='group']")
    ?.querySelector(".upload-label, .label");
  if (uploadLabel?.textContent) {
    return cleanLabelText(uploadLabel.textContent);
  }

  const wrapperLabel = element
    .closest(
      ".field-wrapper, .input-wrapper, .select__container, .text-input-wrapper, .phone-input__phone, .phone-input__country",
    )
    ?.querySelector("label");
  if (wrapperLabel?.textContent) {
    return cleanLabelText(wrapperLabel.textContent);
  }

  return id ?? "Unknown field";
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

  const label =
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) ||
    element
      .closest(
        ".field-wrapper, .select__container, .input-wrapper, .file-upload",
      )
      ?.querySelector("label, .upload-label, .label");

  if (
    label
      ?.querySelector(".required, [aria-hidden='true']")
      ?.textContent?.includes("*")
  ) {
    return true;
  }
  if (label?.textContent?.includes("*")) {
    return true;
  }

  return false;
};

const isComboboxInput = (element: HTMLElement): boolean =>
  element instanceof HTMLInputElement &&
  (element.getAttribute("role") === "combobox" ||
    element.classList.contains("select__input"));

const isPhoneCountryCombobox = (element: HTMLElement): boolean =>
  !!element.closest(".phone-input__country") ||
  element.id === "country" ||
  (getFieldLabel(element).toLowerCase() === "country" &&
    !!element.closest(".phone-input"));

const detectSource = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.includes("greenhouse")) return "greenhouse";
  if (lower.includes("lever.co")) return "lever";
  if (lower.includes("myworkdayjobs") || lower.includes("workday"))
    return "workday";
  if (lower.includes("ashbyhq")) return "ashby";
  if (lower.includes("smartrecruiters")) return "smartrecruiters";
  if (lower.includes("icims")) return "icims";
  if (lower.includes("bamboohr")) return "bamboohr";
  if (lower.includes("jobvite")) return "jobvite";
  return "unknown";
};

const extractPhoneCountryCodeOptions = (): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  document
    .querySelectorAll<HTMLElement>(".iti__country-list .iti__country")
    .forEach((item) => {
      const name = cleanLabelText(
        item.querySelector(".iti__country-name")?.textContent ?? "",
      );
      const dial = cleanLabelText(
        item.querySelector(".iti__dial-code")?.textContent ?? "",
      );
      if (!name || !dial) return;

      const label = `${name} ${dial}`;
      if (seen.has(label)) return;
      seen.add(label);
      options.push(label);
    });

  return options;
};

const getComboboxToggleButton = (
  element: HTMLInputElement,
): HTMLButtonElement | null =>
  element
    .closest(".select-shell, .select__container, .select")
    ?.querySelector(
      'button[aria-label="Toggle flyout"]',
    ) as HTMLButtonElement | null;

const closeCombobox = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

const clickToggleFlyout = (toggleBtn: HTMLButtonElement): void => {
  toggleBtn.focus();
  toggleBtn.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  toggleBtn.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  toggleBtn.click();
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const isNodeVisible = (node: HTMLElement): boolean => {
  if (!node.isConnected) return false;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const scanComboboxOptionsFromDom = (element: HTMLInputElement): string[] => {
  const results: string[] = [];
  const seen = new Set<string>();

  const addOption = (optionEl: HTMLElement) => {
    const label = cleanLabelText(optionEl.textContent ?? "");
    if (!label || seen.has(label)) return;
    seen.add(label);
    results.push(label);
  };

  if (element.id) {
    const listbox = document.getElementById(
      `react-select-${element.id}-listbox`,
    );
    listbox
      ?.querySelectorAll<HTMLElement>("[role='option'], .select__option")
      .forEach(addOption);
  }

  document.querySelectorAll<HTMLElement>(".select__menu").forEach((menu) => {
    if (element.id) {
      const linkedListbox = menu.querySelector(
        `#react-select-${element.id}-listbox`,
      );
      if (linkedListbox) {
        linkedListbox
          .querySelectorAll<HTMLElement>("[role='option'], .select__option")
          .forEach(addOption);
        return;
      }
    }

    if (isNodeVisible(menu)) {
      menu
        .querySelectorAll<HTMLElement>("[role='option'], .select__option")
        .forEach(addOption);
    }
  });

  if (results.length === 0) {
    document
      .querySelectorAll<HTMLElement>(
        `[id="react-select-${element.id}-listbox"] [role="option"], .select__menu-list [role="option"], [role="listbox"] [role="option"]`,
      )
      .forEach(addOption);
  }

  return results;
};

const openAndScanComboboxOptions = async (
  element: HTMLInputElement,
): Promise<string[]> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeCombobox();
    await delay(150);
  }

  const toggleBtn = getComboboxToggleButton(element);
  if (!toggleBtn) {
    console.warn(
      "[CareerAI ScanAPI] Toggle flyout not found for:",
      element.id || getFieldLabel(element),
    );
    return [];
  }

  clickToggleFlyout(toggleBtn);
  await delay(300);
  await waitForDomUpdate();

  let options = scanComboboxOptionsFromDom(element);
  if (options.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    options = scanComboboxOptionsFromDom(element);
  }

  closeCombobox();
  await delay(150);

  return options;
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label)) return;
    // Skip empty / placeholder options
    if (!opt.value && /select|choose|---/i.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

interface CandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: "text" | "combobox" | "select" | "phone-country";
}

const collectCandidateFields = (): CandidateField[] => {
  const candidates = document.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );
  const results: CandidateField[] = [];
  const seenIds = new Set<string>();
  let phoneCountryAdded = false;

  candidates.forEach((element) => {
    if (isInsideExtension(element) || !isVisibleElement(element)) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) {
        return;
      }
      // intl-tel search / hidden required inputs
      if (
        element.tabIndex === -1 &&
        element.getAttribute("aria-hidden") === "true"
      ) {
        return;
      }
    }

    if (isComboboxInput(element) && element.getAttribute("tabindex") === "-1") {
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

    if (isPhoneCountryCombobox(element)) {
      if (phoneCountryAdded) return;
      phoneCountryAdded = true;
      results.push({
        element,
        label: "Phone Country Code",
        required: isRequiredField(element),
        kind: "phone-country",
      });
      return;
    }

    if (element instanceof HTMLSelectElement) {
      results.push({
        element,
        label: getFieldLabel(element),
        required: isRequiredField(element),
        kind: "select",
      });
      return;
    }

    if (isComboboxInput(element)) {
      results.push({
        element,
        label: getFieldLabel(element),
        required: isRequiredField(element),
        kind: "combobox",
      });
      return;
    }

    results.push({
      element,
      label: getFieldLabel(element),
      required: isRequiredField(element),
      kind: "text",
    });
  });

  // If phone country list exists but no Country combobox was found, still include it
  if (!phoneCountryAdded && document.querySelector(".iti__country-list")) {
    const phoneInput = document.querySelector<HTMLElement>(
      ".phone-input, #phone, input[type='tel']",
    );
    results.push({
      element: phoneInput ?? document.body,
      label: "Phone Country Code",
      required: true,
      kind: "phone-country",
    });
  }

  return results;
};

/**
 * Scans the current page's application form and builds an API payload
 * with field labels, required flags, types, and select options.
 */
export const scanHtmlToMakeApiPayload = async (
  options: ScanToMakeApiOptions = {},
): Promise<ScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectCandidateFields();
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

    if (candidate.kind === "phone-country") {
      const phoneOptions = extractPhoneCountryCodeOptions();
      elements.push({
        label: "Phone Country Code",
        required: candidate.required,
        type: "search",
        options: phoneOptions,
      });
      continue;
    }

    if (candidate.kind === "select") {
      const selectOptions = getNativeSelectOptions(
        candidate.element as HTMLSelectElement,
      );
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        options: selectOptions,
      });
      continue;
    }

    // combobox – open flyout and collect full option list
    const comboboxOptions = await openAndScanComboboxOptions(
      candidate.element as HTMLInputElement,
    );
    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      ...(comboboxOptions.length > 0 ? { options: comboboxOptions } : {}),
    });
  }

  const payload: ScanToMakeApiPayload = {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: detectSource(url),
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };

  return payload;
};
