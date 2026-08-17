import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface AmazonScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface AmazonScanToMakeApiOptions {
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

export type AmazonFieldKind =
  | "text"
  | "select"
  | "select2"
  | "phone-country";

export interface AmazonCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: AmazonFieldKind;
}

export const cleanAmazonLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/auto-save unavailable for this section/gi, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

/** Native <select> that Select2 hides and drives from its UI. */
export const isAmazonSelect2NativeSelect = (
  element: HTMLElement,
): element is HTMLSelectElement =>
  element instanceof HTMLSelectElement &&
  (element.classList.contains("select2-hidden-accessible") ||
    element.classList.contains("country") ||
    element.classList.contains("state-province") ||
    !!element
      .closest(".country-dropdown, .form-group")
      ?.querySelector(".select2-container"));

const isDisplayed = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

/**
 * Contact (and later sections) live in tab panels. Only scan the active /
 * visible panel so hidden steps are not sent to the API.
 */
const isInScannableSection = (element: HTMLElement): boolean => {
  const panel = element.closest<HTMLElement>(
    ".question-form, [role='tabpanel']",
  );
  if (!panel) return true;
  if (panel.classList.contains("active")) return true;
  if (panel.getAttribute("aria-hidden") === "true") return false;
  if (panel.classList.contains("collapse") && !panel.classList.contains("show")) {
    return false;
  }
  return isDisplayed(panel);
};

const isVisibleAmazonField = (element: HTMLElement): boolean => {
  if (isAmazonSelect2NativeSelect(element)) {
    return isInScannableSection(element);
  }

  if (element.closest(".visually-hidden, .sr-only, [aria-hidden='true']")) {
    return false;
  }
  if (element.classList.contains("iti__search-input")) {
    return false;
  }
  if (element.classList.contains("select2-search__field")) {
    return false;
  }
  if (!isInScannableSection(element)) {
    return false;
  }
  return isDisplayed(element);
};

export const getAmazonFieldLabel = (element: HTMLElement): string => {
  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanAmazonLabelText(label.textContent);
    }
  }

  const wrapperLabel = element
    .closest(
      ".text-field, .phone-number, .country-dropdown, .form-group, .contact-information",
    )
    ?.querySelector("label");
  if (wrapperLabel?.textContent) {
    return cleanAmazonLabelText(wrapperLabel.textContent);
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return cleanAmazonLabelText(ariaLabel);
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanAmazonLabelText(labelEl.textContent);
    }
  }

  return id ?? "Unknown field";
};

export const isAmazonRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required") ||
    element.classList.contains("required")
  ) {
    return true;
  }

  const label =
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) ||
    element
      .closest(".text-field, .phone-number, .country-dropdown, .form-group")
      ?.querySelector("label");

  if (label?.classList.contains("required")) {
    return true;
  }
  if (label?.textContent?.includes("*")) {
    return true;
  }

  return false;
};

const isPlaceholderOption = (label: string, value: string): boolean => {
  if (!label) return true;
  if (!value && /select|choose|available|---/i.test(label)) return true;
  if (/^select a /i.test(label)) return true;
  if (/no states\/provinces available/i.test(label)) return true;
  return false;
};

export const getAmazonNativeSelectOptions = (
  select: HTMLSelectElement,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanAmazonLabelText(opt.textContent ?? opt.value);
    if (isPlaceholderOption(label, opt.value)) return;
    if (seen.has(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

export const extractAmazonPhoneCountryCodeOptions = (
  root: ParentNode = document,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  root
    .querySelectorAll<HTMLElement>(".iti__country-list .iti__country")
    .forEach((item) => {
      const name = cleanAmazonLabelText(
        item.querySelector(".iti__country-name")?.textContent ?? "",
      );
      const dial = cleanAmazonLabelText(
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

const isReadonlyInput = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) return false;
  return (
    element.readOnly ||
    element.getAttribute("aria-readonly") === "true" ||
    element.hasAttribute("readonly")
  );
};

export const collectAmazonCandidateFields = (): AmazonCandidateField[] => {
  const candidates = document.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );
  const results: AmazonCandidateField[] = [];
  const seenIds = new Set<string>();

  candidates.forEach((element) => {
    if (isInsideExtension(element) || !isVisibleAmazonField(element)) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) {
        return;
      }
      if (isReadonlyInput(element)) {
        return;
      }
      if (
        element.tabIndex === -1 &&
        element.getAttribute("aria-hidden") === "true"
      ) {
        return;
      }
    }

    const id =
      element.getAttribute("id") ||
      element.getAttribute("name") ||
      `${getAmazonFieldLabel(element)}-${results.length}`;
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);

    if (element instanceof HTMLSelectElement) {
      results.push({
        element,
        label: getAmazonFieldLabel(element),
        required: isAmazonRequiredField(element),
        kind: isAmazonSelect2NativeSelect(element) ? "select2" : "select",
      });
      return;
    }

    results.push({
      element,
      label: getAmazonFieldLabel(element),
      required: isAmazonRequiredField(element),
      kind: "text",
    });
  });

  const phoneRoot =
    document.querySelector<HTMLElement>(
      "#CONTACT_DETAILS .phone-number, .contact-information .phone-number, .phone-number",
    ) ?? document.body;

  if (phoneRoot.querySelector(".iti__country-list")) {
    const phoneInput =
      phoneRoot.querySelector<HTMLElement>(
        "input[type='tel'], #applicant_primary_phone_number",
      ) ?? phoneRoot;
    results.push({
      element: phoneInput,
      label: "Phone Country Code",
      required: true,
      kind: "phone-country",
    });
  }

  return results;
};

/**
 * Scans the amazon.jobs application form (currently the visible section,
 * e.g. Contact information) and builds an API payload.
 */
export const scanAmazonHtmlToMakeApiPayload = async (
  options: AmazonScanToMakeApiOptions = {},
): Promise<AmazonScanToMakeApiPayload> => {
  await delay(50);

  const url = window.location.href;
  const candidates = collectAmazonCandidateFields();
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
      const phoneRoot =
        candidate.element.closest(".phone-number") ?? document;
      const phoneOptions = extractAmazonPhoneCountryCodeOptions(phoneRoot);
      elements.push({
        label: "Phone Country Code",
        required: candidate.required,
        type: "search",
        ...(phoneOptions.length > 0 ? { options: phoneOptions } : {}),
      });
      continue;
    }

    if (
      candidate.kind === "select" ||
      candidate.kind === "select2"
    ) {
      const selectOptions = getAmazonNativeSelectOptions(
        candidate.element as HTMLSelectElement,
      );
      elements.push({
        label: candidate.label,
        required: candidate.required,
        type: "search",
        ...(selectOptions.length > 0 ? { options: selectOptions } : {}),
      });
    }
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "amazon",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
