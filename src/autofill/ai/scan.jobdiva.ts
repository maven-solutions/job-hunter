import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface JobdivaScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface JobdivaScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

/** Text inputs, account-password inputs, native selects, and custom dropdowns. */
export type JobdivaFieldKind = "text" | "password" | "select" | "combobox";

export interface JobdivaCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: JobdivaFieldKind;
}

export interface JobdivaOptionNode {
  label: string;
  element: HTMLElement;
}

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "checkbox",
  "radio",
  "image",
]);

const LAYOUT_SELECTOR = ".jd-form-layout";

const OPTION_SELECTOR = [
  "[role='option']",
  "[role='menuitem']",
  ".dropdown-item",
  ".jd-dropdown-item",
  ".jd-option",
  ".dropdown-menu > li",
  "[role='listbox'] > li",
].join(", ");

const OPEN_MENU_SELECTOR = [
  "[role='listbox']",
  ".dropdown-menu.show",
  ".jd-dropdown-menu",
  ".jd-select-menu",
].join(", ");

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

const isVisibleElement = (element: HTMLElement): boolean => {
  if (!element.isConnected) return false;
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
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const isPlaceholderOption = (label: string): boolean =>
  /^(select|choose|please select|please choose|[-–—]+|none)$/i.test(label);

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

export const getJobdivaFieldLabel = (element: HTMLElement): string => {
  const layout = element.closest(LAYOUT_SELECTOR);
  const jdLabel = layout?.querySelector(".jd-label");
  if (jdLabel?.textContent) {
    return cleanLabelText(jdLabel.textContent);
  }

  const id = element.getAttribute("id");
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel?.textContent) {
      return cleanLabelText(forLabel.textContent);
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

  const wrapping = element.closest("label");
  if (wrapping?.textContent) {
    return cleanLabelText(wrapping.textContent);
  }

  return id ?? element.getAttribute("name") ?? "Unknown field";
};

const isPhoneCountryField = (element: HTMLElement, label: string): boolean => {
  const normalized = label.toLowerCase();
  if (
    /phone\s*country|country\s*code|dial(?:ing)?\s*code|country\s*calling/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (!/^country$/i.test(label)) return false;

  const group = element.closest(LAYOUT_SELECTOR)?.parentElement;
  if (!group) return false;
  const blob = (group.textContent ?? "").toLowerCase();
  return (
    blob.includes("phone") &&
    !!group.querySelector("input[type='tel'], input[autocomplete='tel']")
  );
};

const isRequiredField = (element: HTMLElement): boolean => {
  if (
    element.hasAttribute("required") ||
    element.getAttribute("aria-required") === "true"
  ) {
    return true;
  }

  const layout = element.closest(LAYOUT_SELECTOR);
  const label =
    layout?.querySelector(".jd-label") ||
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`));

  if (label?.querySelector(".jd-text-red")?.textContent?.includes("*")) {
    return true;
  }
  if (label?.textContent?.includes("*")) return true;
  return false;
};

const isSkippableInput = (input: HTMLInputElement): boolean => {
  const type = (input.type || "text").toLowerCase();
  if (SKIP_INPUT_TYPES.has(type)) return true;
  if (input.tabIndex === -1 && input.getAttribute("aria-hidden") === "true") {
    return true;
  }
  return false;
};

const isComboboxElement = (element: HTMLElement): boolean =>
  element.getAttribute("role") === "combobox" ||
  element.getAttribute("aria-haspopup") === "listbox" ||
  (element instanceof HTMLInputElement && !!element.list?.options.length);

const isWizardNavButton = (element: HTMLElement): boolean =>
  /^(back|next|submit|save|continue|cancel)$/i.test(
    cleanLabelText(element.textContent ?? ""),
  );

const classifyControl = (element: HTMLElement): JobdivaFieldKind => {
  if (element instanceof HTMLInputElement && element.type === "password") {
    return "password";
  }
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLButtonElement || isComboboxElement(element)) {
    return "combobox";
  }
  return "text";
};

const isEligibleControl = (element: HTMLElement): boolean => {
  if (isInsideExtension(element) || !isVisibleElement(element)) return false;
  if (element instanceof HTMLButtonElement) {
    return element.type !== "submit" && !isWizardNavButton(element);
  }
  if (element instanceof HTMLInputElement && isSkippableInput(element)) {
    return false;
  }
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    isComboboxElement(element)
  );
};

const pickControl = (layout: HTMLElement): HTMLElement | null => {
  const combo = Array.from(
    layout.querySelectorAll<HTMLElement>(
      "[role='combobox'], [aria-haspopup='listbox']",
    ),
  ).find((el) => isEligibleControl(el));
  if (combo) return combo;

  const select = Array.from(layout.querySelectorAll<HTMLSelectElement>("select")).find(
    (el) => isEligibleControl(el),
  );
  if (select) return select;

  const textarea = Array.from(
    layout.querySelectorAll<HTMLTextAreaElement>("textarea"),
  ).find((el) => isEligibleControl(el));
  if (textarea) return textarea;

  const input = Array.from(layout.querySelectorAll<HTMLInputElement>("input")).find(
    (el) => isEligibleControl(el),
  );
  if (input) return input;

  const button = Array.from(layout.querySelectorAll<HTMLButtonElement>("button")).find(
    (el) => isEligibleControl(el),
  );
  return button ?? null;
};

const pushUniqueOptions = (
  results: JobdivaOptionNode[],
  seen: Set<string>,
  optionEl: HTMLElement,
): void => {
  if (isInsideExtension(optionEl)) return;
  const label = cleanLabelText(optionEl.textContent ?? "");
  if (!label || seen.has(label) || isPlaceholderOption(label)) return;
  if (label.length > 200) return;
  seen.add(label);
  results.push({ label, element: optionEl });
};

export const readJobdivaMenuOptions = (
  root: ParentNode,
  visibleOnly = false,
): JobdivaOptionNode[] => {
  const results: JobdivaOptionNode[] = [];
  const seen = new Set<string>();

  root.querySelectorAll<HTMLElement>(OPTION_SELECTOR).forEach((optionEl) => {
    if (visibleOnly && !isVisibleElement(optionEl)) return;
    pushUniqueOptions(results, seen, optionEl);
  });

  return results;
};

const readOwnedListbox = (element: HTMLElement): JobdivaOptionNode[] => {
  const controlsId = element.getAttribute("aria-controls");
  if (!controlsId) return [];
  const owned = document.getElementById(controlsId);
  if (!owned) return [];
  return readJobdivaMenuOptions(owned, false);
};

const readOpenMenus = (): JobdivaOptionNode[] => {
  const results: JobdivaOptionNode[] = [];
  const seen = new Set<string>();

  document.querySelectorAll<HTMLElement>(OPEN_MENU_SELECTOR).forEach((menu) => {
    if (isInsideExtension(menu) || !isVisibleElement(menu)) return;
    readJobdivaMenuOptions(menu, true).forEach((option) => {
      if (seen.has(option.label)) return;
      seen.add(option.label);
      results.push(option);
    });
  });

  return results;
};

const getComboboxTrigger = (element: HTMLElement): HTMLElement => {
  if (
    element.getAttribute("role") === "combobox" ||
    element.getAttribute("aria-haspopup") === "listbox" ||
    element instanceof HTMLButtonElement
  ) {
    return element;
  }

  const layout = element.closest(LAYOUT_SELECTOR);
  const button = layout?.querySelector<HTMLElement>(
    "button[aria-haspopup='listbox'], button[aria-expanded], [role='combobox']",
  );
  return button ?? element;
};

export const closeJobdivaFlyout = (): void => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  document.dispatchEvent(
    new KeyboardEvent("keyup", { key: "Escape", bubbles: true }),
  );
};

const waitForMenuOptions = (timeoutMs: number): Promise<JobdivaOptionNode[]> =>
  new Promise((resolve) => {
    const existing = readOpenMenus();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(readOpenMenus());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const found = readOpenMenus();
      if (found.length === 0) return;
      window.clearTimeout(timer);
      observer?.disconnect();
      resolve(found);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-expanded", "hidden"],
    });
  });

const clickTrigger = (trigger: HTMLElement): void => {
  trigger.focus();
  trigger.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }),
  );
  trigger.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }),
  );
  trigger.click();
};

/**
 * Open a JobDiva custom dropdown and return its option nodes.
 * Caller closes the flyout when it only needed labels.
 */
export const openJobdivaCombobox = async (
  element: HTMLElement,
): Promise<JobdivaOptionNode[]> => {
  if (element instanceof HTMLInputElement && element.list?.options.length) {
    const options: JobdivaOptionNode[] = [];
    const seen = new Set<string>();
    Array.from(element.list.options).forEach((opt) => {
      const label = cleanLabelText(opt.label || opt.value);
      if (!label || seen.has(label) || isPlaceholderOption(label)) return;
      seen.add(label);
      options.push({ label, element: opt });
    });
    return options;
  }

  const owned = readOwnedListbox(element);
  if (owned.length > 0 && element.getAttribute("aria-expanded") === "true") {
    return owned;
  }

  const trigger = getComboboxTrigger(element);
  if (trigger.getAttribute("aria-expanded") === "true") {
    const already = readOpenMenus();
    if (already.length > 0) return already;
    closeJobdivaFlyout();
    await nextFrame();
  }

  clickTrigger(trigger);
  await nextFrame();

  const ownedAfter = readOwnedListbox(element);
  if (ownedAfter.length > 0) return ownedAfter;

  return waitForMenuOptions(600);
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    if (!opt.value && /select|choose|---/i.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const getDatalistOptions = (input: HTMLInputElement): string[] => {
  if (!input.list) return [];
  const options: string[] = [];
  const seen = new Set<string>();
  Array.from(input.list.options).forEach((opt) => {
    const label = cleanLabelText(opt.label || opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    seen.add(label);
    options.push(label);
  });
  return options;
};

const collectStaticComboboxLabels = (element: HTMLElement): string[] => {
  if (element instanceof HTMLInputElement && element.list) {
    return getDatalistOptions(element);
  }

  const owned = readOwnedListbox(element).map((option) => option.label);
  if (owned.length > 0) return owned;

  const layout = element.closest(LAYOUT_SELECTOR);
  if (!layout) return [];
  return readJobdivaMenuOptions(layout, false).map((option) => option.label);
};

/**
 * Visible JobDiva application fields on the current wizard step.
 * Password inputs are included because this registration step requires them.
 * Hidden, file, checkbox, and radio inputs are skipped.
 */
export const collectJobdivaCandidateFields = (): JobdivaCandidateField[] => {
  const results: JobdivaCandidateField[] = [];
  const seen = new Set<HTMLElement>();
  let phoneCountryAdded = false;

  const add = (element: HTMLElement): void => {
    if (seen.has(element) || !isEligibleControl(element)) return;
    seen.add(element);

    let label = getJobdivaFieldLabel(element);
    if (!label || label === "Unknown field") return;

    if (isPhoneCountryField(element, label)) {
      if (phoneCountryAdded) return;
      phoneCountryAdded = true;
      label = "Phone Country Code";
    }

    results.push({
      element,
      label,
      required: isRequiredField(element),
      kind: classifyControl(element),
    });
  };

  document.querySelectorAll<HTMLElement>(LAYOUT_SELECTOR).forEach((layout) => {
    if (isInsideExtension(layout) || !isVisibleElement(layout)) return;
    const control = pickControl(layout);
    if (control) add(control);
  });

  document
    .querySelectorAll<HTMLElement>(
      "form input.jd-form, form textarea.jd-form, form select.jd-form, form [role='combobox'].jd-form",
    )
    .forEach((element) => {
      if (element.closest(LAYOUT_SELECTOR)) return;
      add(element);
    });

  return results;
};

const toApiElement = async (
  field: JobdivaCandidateField,
): Promise<ApiFormElement> => {
  if (field.kind === "text" || field.kind === "password") {
    return {
      label: field.label,
      required: field.required,
      type: "text",
    };
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return {
      label: field.label,
      required: field.required,
      type: "search",
      options: getNativeSelectOptions(field.element),
    };
  }

  let options = collectStaticComboboxLabels(field.element);
  if (options.length === 0) {
    try {
      options = (await openJobdivaCombobox(field.element)).map(
        (option) => option.label,
      );
    } finally {
      closeJobdivaFlyout();
      await nextFrame();
    }
  }

  return {
    label: field.label,
    required: field.required,
    type: "search",
    ...(options.length > 0 ? { options } : {}),
  };
};

/**
 * Scan the visible JobDiva application step and build the AI fill payload.
 * Later wizard steps are not in the DOM until Next is clicked.
 */
export const scanJobdivaHtmlToMakeApiPayload = async (
  options: JobdivaScanToMakeApiOptions = {},
): Promise<JobdivaScanToMakeApiPayload> => {
  const fields = collectJobdivaCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const field of fields) {
    elements.push(await toApiElement(field));
  }

  return {
    elements,
    token: options.token ?? "",
    url: window.location.href,
    parser: options.parser ?? "internal",
    source: "jobdiva",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
