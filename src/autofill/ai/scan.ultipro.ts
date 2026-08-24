import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
  description?: string;
}

export interface UltiproScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface UltiproScanToMakeApiOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
}

export type UltiproFieldKind = "text" | "select";

export interface UltiproCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: UltiproFieldKind;
}

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "password",
  "image",
  "checkbox",
  "radio",
]);

const PLACEHOLDER_OPTION_RE =
  /^(choose(\.\.\.)?|select|please select|select one|\u2014+|\u2013+|-+)$/i;

const APPLY_SECTION_SELECTOR = [
  "#ApplyContactSection",
  '[data-automation="contact-information-panel"]',
  '[id^="Apply"][id$="Section"]',
  "[data-automation$='-panel']",
  "collapsible-panel",
].join(", ");

const cleanLabelText = (text: string): string =>
  text
    .replace(/[✱*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

/**
 * UKG / Ultipro apply container. Contact Information lives in
 * `#ApplyContactSection`; later apply panels use sibling Apply*Section ids.
 */
export const getUltiproFormRoot = (): HTMLElement => {
  const applyHost =
    document.querySelector<HTMLElement>(
      "#OpportunityApply, [data-automation='opportunity-apply'], #apply-container",
    ) ||
    document.querySelector<HTMLElement>(APPLY_SECTION_SELECTOR)?.parentElement;

  if (applyHost && !isInsideExtension(applyHost)) {
    return applyHost;
  }

  const section = document.querySelector<HTMLElement>(APPLY_SECTION_SELECTOR);
  if (section && !isInsideExtension(section)) {
    return section;
  }

  const form = document.querySelector<HTMLElement>(
    "#ApplyContactSection form, form[novalidate]",
  );
  return form && !isInsideExtension(form) ? form : document.body;
};

const getLabelOwnText = (label: Element): string => {
  const clone = label.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "select, input, textarea, script, style, .help-block, ukg-tooltip, ukg-button, ukg-icon, react-ko-bridge",
    )
    .forEach((node) => node.remove());
  return cleanLabelText(clone.textContent ?? "");
};

const getAssociatedLabel = (element: HTMLElement): HTMLLabelElement | null => {
  const id = element.getAttribute("id");
  if (id) {
    const byFor = document.querySelector<HTMLLabelElement>(
      `label[for="${CSS.escape(id)}"]`,
    );
    if (byFor) return byFor;
  }

  const parentLabel = element.closest("label");
  if (parentLabel instanceof HTMLLabelElement) return parentLabel;

  return null;
};

export const getUltiproFieldLabel = (element: HTMLElement): string => {
  const associated = getAssociatedLabel(element);
  if (associated) {
    const fromLabel = getLabelOwnText(associated);
    if (fromLabel) return fromLabel;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return cleanLabelText(ariaLabel);

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl) {
      const fromId = getLabelOwnText(labelEl);
      if (fromId) return fromId;
    }
  }

  const wrapper = element.closest(".form-group") as HTMLElement | null;
  const wrapperLabel = wrapper?.querySelector(
    ":scope > label, .control-label, .label-with-icon",
  );
  if (wrapperLabel) {
    const fromWrapper = getLabelOwnText(wrapperLabel);
    if (fromWrapper) return fromWrapper;
  }

  return (
    element.getAttribute("name") ||
    element.getAttribute("id") ||
    "Unknown field"
  );
};

const isDisabledField = (element: HTMLElement): boolean =>
  element.hasAttribute("disabled") ||
  element.getAttribute("aria-disabled") === "true";

const isReadOnlyField = (element: HTMLElement): boolean => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.readOnly || element.hasAttribute("readonly");
  }
  return false;
};

export const isUltiproCountryField = (element: HTMLElement): boolean => {
  const id = (element.getAttribute("id") || "").toLowerCase();
  if (id === "country") return true;
  return (
    getUltiproFieldLabel(element).replace(/[^a-z]/gi, "").toLowerCase() ===
    "country"
  );
};

export const isUltiproStateField = (element: HTMLElement): boolean => {
  const id = (element.getAttribute("id") || "").toLowerCase();
  if (id === "state") return true;
  const compact = getUltiproFieldLabel(element)
    .replace(/[^a-z]/gi, "")
    .toLowerCase();
  return compact.includes("state") || compact.includes("province");
};

export const isVisibleUltiproElement = (element: HTMLElement): boolean => {
  if (isDisabledField(element) || isReadOnlyField(element)) return false;
  if (element.closest(".visually-hidden, [hidden]")) return false;

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  let parent: HTMLElement | null = element.parentElement;
  while (parent && parent !== document.body) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === "none" || parentStyle.visibility === "hidden") {
      return false;
    }
    parent = parent.parentElement;
  }

  return true;
};

export const isRequiredUltiproField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const associated = getAssociatedLabel(element);
  if (
    associated?.classList.contains("required") ||
    associated?.querySelector(".required") ||
    associated?.textContent?.includes("*")
  ) {
    return true;
  }

  const wrapper = element.closest(".form-group");
  const wrapperLabel = wrapper?.querySelector(
    ":scope > label, .control-label, .label-with-icon",
  );
  if (
    wrapperLabel?.classList.contains("required") ||
    wrapperLabel?.querySelector(".required") ||
    wrapperLabel?.textContent?.includes("*")
  ) {
    return true;
  }

  return false;
};

const isPlaceholderOption = (label: string): boolean => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return true;
  return PLACEHOLDER_OPTION_RE.test(cleaned);
};

export const getUltiproNativeSelectOptions = (
  select: HTMLSelectElement,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.label ?? opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

export const collectUltiproCandidateFields = (): UltiproCandidateField[] => {
  const root = getUltiproFormRoot();
  const candidates = root.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );
  const results: UltiproCandidateField[] = [];
  const seenIds = new Set<string>();

  candidates.forEach((element) => {
    if (isInsideExtension(element)) return;

    const includeHiddenState =
      element instanceof HTMLSelectElement && isUltiproStateField(element);

    if (!includeHiddenState && !isVisibleUltiproElement(element)) {
      return;
    }
    if (includeHiddenState && (isDisabledField(element) || isReadOnlyField(element))) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) return;
    }

    const id =
      element.getAttribute("id") ||
      element.getAttribute("name") ||
      `${results.length}`;
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const label = getUltiproFieldLabel(element);
    if (!label) return;

    if (element instanceof HTMLSelectElement) {
      results.push({
        element,
        label,
        required: isRequiredUltiproField(element),
        kind: "select",
      });
      return;
    }

    results.push({
      element,
      label,
      required: isRequiredUltiproField(element),
      kind: "text",
    });
  });

  return results;
};

/**
 * Scans the UKG / Ultipro apply form (Contact Information first) and builds
 * an API payload with labels, required flags, types, and native select options.
 */
export const scanUltiproHtmlToMakeApiPayload = async (
  options: UltiproScanToMakeApiOptions = {},
): Promise<UltiproScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectUltiproCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "select") {
      const selectOptions = getUltiproNativeSelectOptions(
        candidate.element as HTMLSelectElement,
      );
      const isDependentState = isUltiproStateField(candidate.element);
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        ...(selectOptions.length > 0 ? { options: selectOptions } : {}),
        ...(isDependentState && selectOptions.length === 0
          ? {
              description:
                "State / Province options load after Country is selected",
            }
          : {}),
      });
      continue;
    }

    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "text",
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "ultipro",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
