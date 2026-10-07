import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface SearchCareersScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface SearchCareersScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

export type SearchCareersFieldKind =
  | "text"
  | "select"
  | "combobox"
  | "checkbox"
  | "checkbox-group"
  | "radio-group";

export interface SearchCareersCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: SearchCareersFieldKind;
  /** Choice labels for checkbox / radio groups. Combobox options are read when opened. */
  options?: string[];
}

export interface SearchCareersOptionNode {
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
  "password",
  "image",
]);

const GENERIC_PLACEHOLDER_RE =
  /^(select|select country code|choose|please select|search|search for job title or keywords|search for location)$/i;

const PLACEHOLDER_OPTION_RE =
  /^(select|choose|please select|select one|[-–—]+)$/i;

const cleanLabelText = (text: string): string =>
  text
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

const hasRequiredClass = (element: Element | null | undefined): boolean => {
  if (!element) return false;
  if (
    Array.from(element.classList).some(
      (className) => className === "required" || className.startsWith("required-"),
    )
  ) {
    return true;
  }
  return (element.textContent ?? "").includes("*");
};

const isSkippedControl = (element: HTMLElement): boolean => {
  const id = (element.id || "").toLowerCase();
  const name = (element.getAttribute("name") || "").toLowerCase();
  const className = (element.getAttribute("class") || "").toLowerCase();
  if (
    id.includes("recaptcha") ||
    name.includes("recaptcha") ||
    className.includes("recaptcha")
  ) {
    return true;
  }
  if (element.closest("#apply-form-container, [data-form-section-id], [class*='applyFormContainer']")) {
    return false;
  }
  if (
    element.closest(
      "nav, header, footer, [role='navigation'], [role='listbox']",
    )
  ) {
    return true;
  }
  return false;
};

const isDisabledField = (element: HTMLElement): boolean =>
  element.hasAttribute("disabled") ||
  element.getAttribute("aria-disabled") === "true";

export const isVisibleSearchCareersElement = (element: HTMLElement): boolean => {
  if (!element.isConnected || isDisabledField(element)) return false;
  if (element.closest("[hidden]")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

const getOwnText = (element: Element): string => {
  const clone = element.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("input, textarea, select, script, style, svg")
    .forEach((node) => node.remove());
  return cleanLabelText(clone.textContent ?? "");
};

const textFromIds = (ids: string): string => {
  const parts = ids
    .split(/\s+/)
    .map((id) => {
      const el = document.getElementById(id);
      return el ? getOwnText(el) : "";
    })
    .filter(Boolean);
  return cleanLabelText(parts.join(" "));
};

const isSearchChromeLabel = (label: string): boolean =>
  /^search for\b/i.test(label) || /^search jobs$/i.test(label);

/**
 * Inline phone country picker is labelled "Country code".
 * Send it as Phone Country Code. Keep the separate "Country Phone Code" question.
 */
const normalizeFieldLabel = (label: string, element: HTMLElement): string => {
  const normalized = label.toLowerCase().replace(/\s+/g, " ").trim();
  const idBlob = [
    element.id,
    element.closest("[id]")?.id ?? "",
    element.getAttribute("data-test-id") ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (
    normalized === "country code" ||
    (/phone-country-code/.test(idBlob) && /country code/.test(normalized))
  ) {
    return "Phone Country Code";
  }
  return label;
};

const labelForWrapperId = (wrapperId: string): string => {
  if (!wrapperId) return "";
  const byFor = document.querySelector<HTMLElement>(
    `label[for="${CSS.escape(wrapperId)}"]`,
  );
  if (byFor) return getOwnText(byFor);
  const legend = document.getElementById(`${wrapperId}_legend`);
  if (legend) return getOwnText(legend);
  const labelled = document.getElementById(`${wrapperId}_label`);
  if (labelled) return getOwnText(labelled);
  return "";
};

export const getSearchCareersFieldLabel = (element: HTMLElement): string => {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const fromIds = textFromIds(labelledBy);
    if (fromIds) return normalizeFieldLabel(fromIds, element);
  }

  const id = element.getAttribute("id");
  if (id) {
    const byFor = document.querySelector<HTMLElement>(
      `label[for="${CSS.escape(id)}"]`,
    );
    if (byFor) {
      const fromFor = getOwnText(byFor);
      if (fromFor) return normalizeFieldLabel(fromFor, element);
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    const cleaned = cleanLabelText(ariaLabel);
    if (cleaned && !GENERIC_PLACEHOLDER_RE.test(cleaned)) {
      return normalizeFieldLabel(cleaned, element);
    }
  }

  const selectWrapper = element.closest<HTMLElement>(
    "[class*='select-module_select-wrapper']",
  );
  if (selectWrapper?.id) {
    const fromWrapper = labelForWrapperId(selectWrapper.id);
    if (fromWrapper) return normalizeFieldLabel(fromWrapper, element);
  }

  const field = element.closest<HTMLElement>("[class*='field-']");
  const fieldLabel = field?.querySelector<HTMLElement>(
    "label[class*='label-'], legend[class*='label-']",
  );
  if (fieldLabel) {
    const fromField = getOwnText(fieldLabel);
    if (fromField) return normalizeFieldLabel(fromField, element);
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const placeholder = element.getAttribute("placeholder");
    if (placeholder && !GENERIC_PLACEHOLDER_RE.test(placeholder.trim())) {
      return normalizeFieldLabel(cleanLabelText(placeholder), element);
    }
  }

  return normalizeFieldLabel(
    element.getAttribute("name") || element.id || "Unknown field",
    element,
  );
};

const isRequiredField = (element: HTMLElement, labelHost?: Element | null): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const described = element.getAttribute("aria-labelledby");
  if (described && textFromIds(described) && hasRequiredClass(labelHost ?? null)) {
    return true;
  }

  const hosts: Array<Element | null> = [labelHost ?? null];
  const id = element.getAttribute("id");
  if (id) {
    hosts.push(
      document.querySelector(`label[for="${CSS.escape(id)}"]`),
      document.getElementById(`${id}_label`),
      document.getElementById(`${id}_legend`),
    );
  }
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    labelledBy.split(/\s+/).forEach((labelId) => {
      hosts.push(document.getElementById(labelId));
    });
  }
  const selectWrapper = element.closest("[class*='select-module_select-wrapper']");
  if (selectWrapper?.id) {
    hosts.push(
      document.querySelector(`label[for="${CSS.escape(selectWrapper.id)}"]`),
      document.getElementById(`${selectWrapper.id}_label`),
    );
  }

  return hosts.some((host) => hasRequiredClass(host));
};

export const getSearchCareersChoiceLabel = (input: HTMLInputElement): string => {
  if (input.id) {
    const byFor = document.querySelector<HTMLElement>(
      `label[for="${CSS.escape(input.id)}"]`,
    );
    const visible = byFor?.querySelector<HTMLElement>(
      "[class*='selector-label'], [class*='radio-module_selector-label']",
    );
    if (visible?.textContent) {
      const fromVisible = cleanLabelText(visible.textContent);
      if (fromVisible) return fromVisible;
    }
    if (byFor) {
      const fromFor = getOwnText(byFor);
      if (fromFor) return fromFor;
    }
  }

  const aria = input.getAttribute("aria-label");
  if (aria) {
    return cleanLabelText(
      aria.replace(/,?\s*please check one of the boxes below:?/i, ""),
    );
  }

  const parentLabel = input.closest("label");
  if (parentLabel) {
    const fromParent = getOwnText(parentLabel);
    if (fromParent) return fromParent;
  }

  return cleanLabelText(input.value || "");
};

const getGroupQuestionLabel = (group: HTMLElement): string => {
  const labelledBy = group.getAttribute("aria-labelledby");
  if (labelledBy) {
    const fromIds = textFromIds(labelledBy);
    if (fromIds) return fromIds;
  }

  if (group.id) {
    const fromId = labelForWrapperId(group.id);
    if (fromId) return fromId;
  }

  const field = group.closest<HTMLElement>("[class*='field-']");
  const legend = field?.querySelector<HTMLElement>(
    "legend[class*='label-'], label[class*='label-']",
  );
  if (legend) return getOwnText(legend);

  return "";
};

const remember = (seen: Set<string>, key: string): boolean => {
  if (!key || seen.has(key)) return false;
  seen.add(key);
  return true;
};

const isComboboxInput = (element: HTMLElement): element is HTMLInputElement =>
  element instanceof HTMLInputElement &&
  (element.getAttribute("role") === "combobox" ||
    Array.from(element.classList).some((className) =>
      className.startsWith("select-module_select-input"),
    ));

const waitFor = <T>(
  getter: () => T | null,
  timeoutMs: number,
): Promise<T | null> =>
  new Promise((resolve) => {
    const existing = getter();
    if (existing) {
      resolve(existing);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(getter());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const value = getter();
      if (value) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(value);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded", "class", "id"],
    });
  });

const optionLabel = (optionEl: HTMLElement): string => {
  const title = optionEl.getAttribute("title");
  if (title?.trim()) return cleanLabelText(title);
  const labelEl = optionEl.querySelector<HTMLElement>(
    "[class*='menuItem-module_label']",
  );
  if (labelEl?.textContent) return cleanLabelText(labelEl.textContent);
  return cleanLabelText(optionEl.textContent ?? "");
};

/** Chevron only. The first button in a filled select is Clear, which unmounts dependent questions. */
const getSearchCareersComboboxToggle = (
  input: HTMLInputElement,
): HTMLButtonElement | null => {
  const wrap = input.closest<HTMLElement>("[class*='select-module_select-wrapper']");
  if (!wrap) return null;
  const buttons = Array.from(wrap.querySelectorAll<HTMLButtonElement>("button"));
  const chevron = buttons.find(
    (button) => button.getAttribute("aria-hidden") === "true",
  );
  if (chevron) return chevron;
  return (
    buttons.find((button) => {
      const label = button.getAttribute("aria-label") || "";
      const className = button.className?.toString() || "";
      return !/^clear\b/i.test(label) && !className.includes("select-clear");
    }) ?? null
  );
};

export const readSearchCareersListboxOptions = (
  input: HTMLInputElement,
): SearchCareersOptionNode[] => {
  const listId = input.getAttribute("aria-controls");
  const list = listId ? document.getElementById(listId) : null;
  if (!list) return [];

  const results: SearchCareersOptionNode[] = [];
  const seen = new Set<string>();
  list.querySelectorAll<HTMLElement>("[role='option']").forEach((optionEl) => {
    const label = optionLabel(optionEl);
    if (!label || seen.has(label) || PLACEHOLDER_OPTION_RE.test(label)) return;
    seen.add(label);
    results.push({ label, element: optionEl });
  });
  return results;
};

export const closeSearchCareersCombobox = async (
  input?: HTMLInputElement | null,
): Promise<void> => {
  if (input) {
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  }
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  if (input?.getAttribute("aria-expanded") === "true") {
    getSearchCareersComboboxToggle(input)?.click();
  }
  if (input) {
    await waitFor(
      () => (input.getAttribute("aria-expanded") !== "true" ? true : null),
      400,
    );
  }
};

export const openSearchCareersCombobox = async (
  input: HTMLInputElement,
): Promise<SearchCareersOptionNode[]> => {
  if (input.getAttribute("aria-expanded") === "true") {
    const existing = readSearchCareersListboxOptions(input);
    if (existing.length > 0) return existing;
    await closeSearchCareersCombobox(input);
  }

  const toggle = getSearchCareersComboboxToggle(input);

  input.focus();
  input.click();

  let options = await waitFor(() => {
    const found = readSearchCareersListboxOptions(input);
    return found.length > 0 ? found : null;
  }, 700);

  if (!options?.length && toggle) {
    toggle.click();
    options = await waitFor(() => {
      const found = readSearchCareersListboxOptions(input);
      return found.length > 0 ? found : null;
    }, 800);
  }

  return options ?? readSearchCareersListboxOptions(input);
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();
  Array.from(select.options).forEach((option) => {
    const label = cleanLabelText(option.textContent ?? option.label ?? option.value);
    if (!label || seen.has(label) || PLACEHOLDER_OPTION_RE.test(label)) return;
    if (!option.value && /select|choose/i.test(label)) return;
    seen.add(label);
    options.push(label);
  });
  return options;
};

const pushField = (
  results: SearchCareersCandidateField[],
  seen: Set<string>,
  field: SearchCareersCandidateField,
  key: string,
): void => {
  if (!field.label || field.label === "Unknown field") return;
  if (isSearchChromeLabel(field.label)) return;
  if (!remember(seen, key)) return;
  results.push(field);
};

export const getSearchCareersFieldKey = (
  field: SearchCareersCandidateField,
): string => {
  const wrapper = field.element.closest<HTMLElement>(
    "[data-test-id], [class*='select-module_select-wrapper']",
  );
  const stable =
    field.element.getAttribute("data-test-id") ||
    wrapper?.getAttribute("data-test-id") ||
    wrapper?.id ||
    field.element.getAttribute("name") ||
    field.element.id ||
    "";
  return `${field.kind}:${stable || field.label}`;
};

/**
 * Country / source answers mount extra questions (legal name, address,
 * "Which job board?") a moment later. Wait until that DOM goes quiet.
 */
export const waitForSearchCareersFieldsToSettle = async (): Promise<void> => {
  const root = getSearchCareersFormRoot();
  const countFields = (): number =>
    root.querySelectorAll(
      "[data-form-section-id] input, [data-form-section-id] textarea, [data-form-section-id] select",
    ).length;

  let lastCount = countFields();
  const started = Date.now();

  while (Date.now() - started < 2500) {
    const mutated = await new Promise<boolean>((resolve) => {
      let observer: MutationObserver | null = null;
      const timer = window.setTimeout(() => {
        observer?.disconnect();
        resolve(false);
      }, 400);
      observer = new MutationObserver(() => {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(true);
      });
      observer.observe(root, { childList: true, subtree: true });
    });

    const nextCount = countFields();
    if (!mutated && nextCount === lastCount) return;
    lastCount = nextCount;
  }
};

const candidateToElement = async (
  candidate: SearchCareersCandidateField,
): Promise<ApiFormElement> => {
  if (candidate.kind === "text") {
    return {
      label: candidate.label,
      required: candidate.required,
      type: "text",
    };
  }

  if (candidate.kind === "combobox" && candidate.element instanceof HTMLInputElement) {
    if (!candidate.element.isConnected) {
      return {
        label: candidate.label,
        required: candidate.required,
        type: "search",
      };
    }
    const optionNodes = await openSearchCareersCombobox(candidate.element);
    const optionLabels = optionNodes.map((option) => option.label);
    await closeSearchCareersCombobox(candidate.element);
    return {
      label: candidate.label,
      required: candidate.required,
      type: "search",
      ...(optionLabels.length > 0 ? { options: optionLabels } : {}),
    };
  }

  return {
    label: candidate.label,
    required: candidate.required,
    type: "search",
    ...(candidate.options && candidate.options.length > 0
      ? { options: candidate.options }
      : {}),
  };
};

/**
 * Read labels/options for an explicit field list (follow-up questions
 * that mount after a parent dropdown is filled).
 */
export const scanSearchCareersCandidateElements = async (
  candidates: SearchCareersCandidateField[],
): Promise<ApiFormElement[]> => {
  const elements: ApiFormElement[] = [];
  for (const candidate of candidates) {
    elements.push(await candidateToElement(candidate));
  }
  return elements;
};

/**
 * Whole apply form, not the first section card.
 * `closest("form")` from the first card is correct here, but a lone
 * applyFormSection card is not — later sections (Application questions)
 * are siblings and must stay inside the root.
 */
export const getSearchCareersFormRoot = (): HTMLElement => {
  const container = document.querySelector<HTMLElement>(
    "#apply-form-container, [class*='applyFormContainer']",
  );
  if (container && !isInsideExtension(container)) return container;

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-form-section-id]"),
  ).filter((section) => !isInsideExtension(section));
  if (sections.length > 0) {
    let node: HTMLElement | null = sections[0];
    while (node && !sections.every((section) => node!.contains(section))) {
      node = node.parentElement;
    }
    if (node && node !== document.documentElement && node !== document.body) {
      return node;
    }
  }

  const section = document.querySelector<HTMLElement>(
    "[class*='applyFormSection']",
  );
  if (section && !isInsideExtension(section)) {
    return (
      (section.closest("#apply-form-container, #main-content, main") as HTMLElement | null) ??
      section
    );
  }

  const terms = document.querySelector<HTMLElement>(
    "#Terms_and_Conditions_Terms_Acceptance, [data-test-id='Terms_and_Conditions_Terms_Acceptance'], [class*='checkbox-module_checkbox-group']",
  );
  if (terms && !isInsideExtension(terms)) {
    return (
      (terms.closest("#main-content, main, form") as HTMLElement | null) ??
      document.body
    );
  }

  const main = document.querySelector<HTMLElement>("#main-content, main");
  if (main && !isInsideExtension(main)) return main;
  return document.body;
};

/**
 * Collect autofillable SearchCareers application fields.
 * Skips resume file inputs, reCAPTCHA, and site-header search boxes.
 */
export const collectSearchCareersCandidateFields =
  (): SearchCareersCandidateField[] => {
    const root = getSearchCareersFormRoot();
    const results: SearchCareersCandidateField[] = [];
    const seen = new Set<string>();
    const consumedChecks = new Set<HTMLInputElement>();

    root
      .querySelectorAll<HTMLElement>("[class*='checkbox-module_checkbox-group']")
      .forEach((group) => {
        if (isInsideExtension(group) || isSkippedControl(group)) return;
        const boxes = Array.from(
          group.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
        ).filter((box) => !isDisabledField(box) && !isSkippedControl(box));
        if (boxes.length === 0) return;

        const question = getGroupQuestionLabel(group);
        const optionLabels = boxes
          .map((box) => getSearchCareersChoiceLabel(box))
          .filter(Boolean);
        const label = question || optionLabels[0] || "";
        const required = boxes.some((box) => isRequiredField(box)) ||
          hasRequiredClass(
            group.getAttribute("aria-labelledby")
              ? document.getElementById(
                  group.getAttribute("aria-labelledby")!.split(/\s+/)[0],
                )
              : null,
          );

        pushField(
          results,
          seen,
          {
            element: group,
            label,
            required,
            kind: "checkbox-group",
            options: question ? optionLabels : ["Yes"],
          },
          group.id || boxes[0].name || `checkbox-group-${results.length}`,
        );
        boxes.forEach((box) => consumedChecks.add(box));
      });

    root.querySelectorAll<HTMLInputElement>("input[type='checkbox']").forEach((box) => {
      if (consumedChecks.has(box)) return;
      if (
        isInsideExtension(box) ||
        isSkippedControl(box) ||
        isDisabledField(box) ||
        !isVisibleSearchCareersElement(box)
      ) {
        return;
      }
      const label = getSearchCareersChoiceLabel(box);
      pushField(
        results,
        seen,
        {
          element: box,
          label,
          required: isRequiredField(box),
          kind: "checkbox",
          options: ["Yes"],
        },
        box.id || box.name || `checkbox-${results.length}`,
      );
    });

    const radioGroups = new Map<string, HTMLInputElement[]>();
    root.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach((radio) => {
      if (
        isInsideExtension(radio) ||
        isSkippedControl(radio) ||
        isDisabledField(radio)
      ) {
        return;
      }
      const key = radio.name || radio.id || `radio-${radioGroups.size}`;
      const list = radioGroups.get(key) ?? [];
      list.push(radio);
      radioGroups.set(key, list);
    });

    radioGroups.forEach((radios, key) => {
      const host =
        radios[0].closest<HTMLElement>(
          "[role='radiogroup'], [class*='radio-module_radio-group']",
        ) ??
        radios[0].closest<HTMLElement>("fieldset, [class*='field-']") ??
        radios[0];
      const question = getGroupQuestionLabel(host);
      const optionLabels = radios
        .map((radio) => getSearchCareersChoiceLabel(radio))
        .filter(Boolean);
      pushField(
        results,
        seen,
        {
          element: host,
          label: question || getSearchCareersFieldLabel(radios[0]),
          required: radios.some((radio) => isRequiredField(radio)),
          kind: "radio-group",
          options: optionLabels,
        },
        `radio:${key}`,
      );
    });

    const controls = root.querySelectorAll<HTMLElement>("input, textarea, select");
    controls.forEach((element) => {
      if (isInsideExtension(element) || isSkippedControl(element)) return;
      if (!isVisibleSearchCareersElement(element)) return;

      if (element instanceof HTMLSelectElement) {
        pushField(
          results,
          seen,
          {
            element,
            label: getSearchCareersFieldLabel(element),
            required: isRequiredField(element),
            kind: "select",
            options: getNativeSelectOptions(element),
          },
          element.id || element.name || `select-${results.length}`,
        );
        return;
      }

      if (isComboboxInput(element)) {
        pushField(
          results,
          seen,
          {
            element,
            label: getSearchCareersFieldLabel(element),
            required: isRequiredField(element),
            kind: "combobox",
          },
          element.id ||
            element.closest("[id]")?.id ||
            `combobox-${results.length}`,
        );
        return;
      }

      if (element instanceof HTMLTextAreaElement) {
        pushField(
          results,
          seen,
          {
            element,
            label: getSearchCareersFieldLabel(element),
            required: isRequiredField(element),
            kind: "text",
          },
          element.id || element.name || `textarea-${results.length}`,
        );
        return;
      }

      if (!(element instanceof HTMLInputElement)) return;
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) return;

      pushField(
        results,
        seen,
        {
          element,
          label: getSearchCareersFieldLabel(element),
          required: isRequiredField(element),
          kind: "text",
        },
        element.id || element.name || `input-${results.length}`,
      );
    });

    return results;
  };

/**
 * Scans the SearchCareers application form and builds an API payload
 * with field labels, required flags, types, and dropdown / choice options.
 * Collects again after dropdowns settle so conditional questions
 * (Which job board?, legal name, address) are included.
 */
export const scanSearchCareersHtmlToMakeApiPayload = async (
  options: SearchCareersScanToMakeApiOptions = {},
): Promise<SearchCareersScanToMakeApiPayload> => {
  const url = window.location.href;
  await waitForSearchCareersFieldsToSettle();

  const elements: ApiFormElement[] = [];
  const seen = new Set<string>();

  const consume = async (
    candidates: SearchCareersCandidateField[],
  ): Promise<number> => {
    let added = 0;
    for (const candidate of candidates) {
      const key = getSearchCareersFieldKey(candidate);
      if (seen.has(key)) continue;
      seen.add(key);
      elements.push(await candidateToElement(candidate));
      added += 1;
    }
    return added;
  };

  await consume(collectSearchCareersCandidateFields());

  for (let pass = 0; pass < 2; pass += 1) {
    await closeSearchCareersCombobox();
    await waitForSearchCareersFieldsToSettle();
    const extra = collectSearchCareersCandidateFields().filter(
      (candidate) => !seen.has(getSearchCareersFieldKey(candidate)),
    );
    if (extra.length === 0) break;
    await consume(extra);
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "searchcareers",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
