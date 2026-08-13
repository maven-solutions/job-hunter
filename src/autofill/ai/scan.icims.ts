import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface IcimsScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface IcimsScanToMakeApiOptions {
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

const PLACEHOLDER_OPTION_RE =
  /^(—?\s*)?(make a selection|please select|type to search|no results|no states available|please select a (country|source)|not applicable|select\b.*|choose\b.*)?\s*$/i;

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*required\.?\s*$/i, "")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

const isPlaceholderOption = (label: string): boolean => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return true;
  return PLACEHOLDER_OPTION_RE.test(cleaned);
};

export interface IcimsFormContext {
  /** Document that contains the candidate form (iframe contentDocument or top). */
  doc: Document;
  /** Window for that document (iframe contentWindow or top). */
  win: Window;
  iframe: HTMLIFrameElement | null;
}

const tryReadIframeDocument = (
  iframe: HTMLIFrameElement,
): Document | null => {
  try {
    return iframe.contentDocument || iframe.contentWindow?.document || null;
  } catch {
    // Cross-origin — cannot access
    return null;
  }
};

const looksLikeIcimsFormDocument = (doc: Document | null): boolean => {
  if (!doc?.body) return false;
  return !!doc.querySelector(
    "#profileForm, .iCIMS_MainWrapper, .iCIMS_ProfileFormTable, .iCIMS_CenteredPageContent, .iCIMS_CandidatePage",
  );
};

/**
 * Resolve the document that holds the iCIMS application form.
 * CareerAI injects into the top frame; the form lives in `#icims_content_iframe`.
 */
export const getIcimsFormContext = (): IcimsFormContext => {
  const named = document.getElementById(
    "icims_content_iframe",
  ) as HTMLIFrameElement | null;
  if (named) {
    const iframeDoc = tryReadIframeDocument(named);
    if (iframeDoc) {
      return {
        doc: iframeDoc,
        win: named.contentWindow || window,
        iframe: named,
      };
    }
  }

  const iframes = Array.from(
    document.querySelectorAll<HTMLIFrameElement>("iframe"),
  );
  for (const iframe of iframes) {
    const src = (iframe.getAttribute("src") || iframe.src || "").toLowerCase();
    if (src && !src.includes("icims")) continue;
    const iframeDoc = tryReadIframeDocument(iframe);
    if (looksLikeIcimsFormDocument(iframeDoc)) {
      return {
        doc: iframeDoc!,
        win: iframe.contentWindow || window,
        iframe,
      };
    }
  }

  // Already inside the iframe document, or form rendered top-level
  return { doc: document, win: window, iframe: null };
};

export const getIcimsFormDocument = (): Document => getIcimsFormContext().doc;

export const getIcimsFormWindow = (): Window => getIcimsFormContext().win;

export const getIcimsFormUrl = (): string => {
  const { win, iframe } = getIcimsFormContext();
  try {
    const href = win.location?.href;
    if (href && href !== "about:blank") return href;
  } catch {
    /* cross-origin location access */
  }
  if (iframe?.src) return iframe.src;
  return window.location.href;
};

const ownerDoc = (element: Element): Document =>
  element.ownerDocument || getIcimsFormDocument();

/** Cross-realm safe: iframe elements fail `instanceof HTMLInputElement` from the parent. */
export const isHtmlInput = (el: Element): el is HTMLInputElement =>
  el.tagName === "INPUT";

export const isHtmlTextArea = (el: Element): el is HTMLTextAreaElement =>
  el.tagName === "TEXTAREA";

export const isHtmlSelect = (el: Element): el is HTMLSelectElement =>
  el.tagName === "SELECT";

/** iCIMS custom dropdown trigger next to a hidden native <select>. */
export const getIcimsDropdownTrigger = (
  select: HTMLSelectElement,
): HTMLElement | null => {
  const doc = ownerDoc(select);
  const id = select.id;
  if (id) {
    const byId = doc.getElementById(
      `${id}_icimsDropdown`,
    ) as HTMLElement | null;
    if (byId) return byId;
  }
  return (
    select.parentElement?.querySelector<HTMLElement>("a.dropdown-select") ??
    null
  );
};

export const getIcimsDropdownContainer = (
  select: HTMLSelectElement,
): HTMLElement | null => {
  const doc = ownerDoc(select);
  const id = select.id;
  if (id) {
    const byId = doc.getElementById(
      `${id}_icimsDropdown_ctnr`,
    ) as HTMLElement | null;
    if (byId) return byId;
  }
  return (
    select.parentElement?.querySelector<HTMLElement>(".dropdown-container") ??
    null
  );
};

export const isIcimsCustomDropdown = (select: HTMLSelectElement): boolean =>
  select.getAttribute("icimsdropdown-enabled") === "1" ||
  select.classList.contains("dropdown-hide") ||
  !!getIcimsDropdownTrigger(select);

const isVisibleElement = (element: HTMLElement): boolean => {
  if (element.closest(".visually-hidden, .iCIMS_NoDisplay, .NoDisplay")) {
    return false;
  }
  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }

  // Hidden native select that backs a visible iCIMS custom dropdown
  if (isHtmlSelect(element) && isIcimsCustomDropdown(element)) {
    const trigger = getIcimsDropdownTrigger(element);
    if (trigger) {
      const view = ownerDoc(element).defaultView || window;
      const triggerStyle = view.getComputedStyle(trigger);
      return (
        triggerStyle.display !== "none" && triggerStyle.visibility !== "hidden"
      );
    }
  }

  const view = ownerDoc(element).defaultView || window;
  const style = view.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  // dropdown-search inputs are only for filtering open menus
  if (element.classList.contains("dropdown-search")) {
    return false;
  }

  return true;
};

const getCollectionGroupLabel = (element: HTMLElement): string => {
  const fieldset = element.closest("fieldset.iCIMS_CollectionGroup");
  if (!fieldset) return "";
  const legend =
    fieldset.querySelector("legend .iCIMS_LabelText, legend")?.textContent ??
    "";
  // "Phones (1)" → "Phones"
  return cleanLabelText(legend).replace(/\s*\(\d+\)\s*$/, "");
};

export const getIcimsFieldLabel = (element: HTMLElement): string => {
  const doc = ownerDoc(element);
  const id = element.getAttribute("id");
  if (id) {
    const label = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
    const labelText = label?.querySelector(".iCIMS_LabelText")?.textContent
      ? cleanLabelText(
          label.querySelector(".iCIMS_LabelText")!.textContent ?? "",
        )
      : cleanLabelText(label?.textContent ?? "");
    if (labelText) {
      const group = getCollectionGroupLabel(element);
      if (group && !labelText.toLowerCase().startsWith(group.toLowerCase())) {
        return `${group} ${labelText}`;
      }
      return labelText;
    }
  }

  const dataLabel = element.getAttribute("data-label");
  if (dataLabel) {
    const cleaned = cleanLabelText(dataLabel);
    const group = getCollectionGroupLabel(element);
    if (group && !cleaned.toLowerCase().startsWith(group.toLowerCase())) {
      return `${group} ${cleaned}`;
    }
    return cleaned;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return cleanLabelText(ariaLabel);
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = doc.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  const rowLabel = element
    .closest(".iCIMS_TableRow, .iCIMS_FieldRow")
    ?.querySelector(".iCIMS_InfoField label, .iCIMS_InfoField .iCIMS_LabelText");
  if (rowLabel?.textContent) {
    const cleaned = cleanLabelText(rowLabel.textContent);
    const group = getCollectionGroupLabel(element);
    if (group && !cleaned.toLowerCase().startsWith(group.toLowerCase())) {
      return `${group} ${cleaned}`;
    }
    return cleaned;
  }

  return id ?? element.getAttribute("name") ?? "Unknown field";
};

export const isIcimsRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.getAttribute("i_required") === "true" ||
    element.hasAttribute("required") ||
    element.classList.contains("iCIMS_Forms_RequiredField")
  ) {
    return true;
  }

  const doc = ownerDoc(element);
  const row = element.closest(".iCIMS_TableRow, .iCIMS_FieldRow, fieldset");
  if (row?.querySelector(".Field_RequiredStar, .Field_Required")) {
    return true;
  }

  const id = element.getAttribute("id");
  const label =
    (id && doc.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
    row?.querySelector("label");
  if (label?.textContent?.includes("*")) {
    return true;
  }

  return false;
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.title ?? opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    // Skip empty-value placeholders
    if (!opt.value && !opt.getAttribute("title")) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const scanDropdownOptionsFromContainer = (
  container: HTMLElement | null,
): string[] => {
  if (!container) return [];
  const options: string[] = [];
  const seen = new Set<string>();

  container
    .querySelectorAll<HTMLElement>(
      "li.result-selectable[role='option'], li.dropdown-result.result-selectable",
    )
    .forEach((li) => {
      if (li.classList.contains("result-unselectable")) return;
      const label = cleanLabelText(
        li.getAttribute("aria-label") ||
          li.getAttribute("title") ||
          li.textContent ||
          "",
      );
      if (!label || seen.has(label) || isPlaceholderOption(label)) return;
      seen.add(label);
      options.push(label);
    });

  return options;
};

const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const closeIcimsDropdown = (doc: Document = getIcimsFormDocument()): void => {
  doc.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
};

/**
 * Open iCIMS custom dropdown if needed and collect option labels.
 * Prefers already-rendered listbox options; falls back to open + settle.
 */
export const openAndScanIcimsDropdownOptions = async (
  select: HTMLSelectElement,
): Promise<string[]> => {
  // Prefer options already present on the native select (non-ajax lists)
  const nativeOpts = getNativeSelectOptions(select);
  if (nativeOpts.length > 0 && select.getAttribute("icimsdropdown-ajax") !== "1") {
    return nativeOpts;
  }

  const container = getIcimsDropdownContainer(select);
  let options = scanDropdownOptionsFromContainer(container);
  if (options.length > 0) {
    return options;
  }

  // Native select may already have ajax-populated options
  if (nativeOpts.length > 0) {
    return nativeOpts;
  }

  const trigger = getIcimsDropdownTrigger(select);
  if (!trigger) {
    return nativeOpts;
  }

  trigger.click();
  await delay(200);
  await waitForDomUpdate();

  options = scanDropdownOptionsFromContainer(
    getIcimsDropdownContainer(select),
  );
  if (options.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    options = scanDropdownOptionsFromContainer(
      getIcimsDropdownContainer(select),
    );
  }

  // Searchable dropdown: type a letter to encourage ajax load when empty
  if (options.length === 0) {
    const search = getIcimsDropdownContainer(select)?.querySelector<HTMLInputElement>(
      "input.dropdown-search",
    );
    if (search && !search.classList.contains("dropdown-invisible")) {
      search.focus();
      search.value = "a";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      await delay(300);
      await waitForDomUpdate();
      options = scanDropdownOptionsFromContainer(
        getIcimsDropdownContainer(select),
      );
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  closeIcimsDropdown(ownerDoc(select));
  await delay(100);

  return options.length > 0 ? options : nativeOpts;
};

export type IcimsFieldKind = "text" | "select" | "icims-dropdown";

export interface IcimsCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: IcimsFieldKind;
}

/**
 * Collect autofillable fields on the current iCIMS candidate page
 * (Candidate Profile and later steps share the same field markup).
 * Reads from `#icims_content_iframe` when the form is framed.
 */
export const collectIcimsCandidateFields = (): IcimsCandidateField[] => {
  const { doc } = getIcimsFormContext();
  const root =
    doc.querySelector<HTMLElement>(
      "#profileForm, .iCIMS_MainWrapper, .iCIMS_CenteredPageContent, form",
    ) ?? doc.body;

  if (!root) {
    return [];
  }

  const candidates = root.querySelectorAll<HTMLElement>(
    "input, textarea, select",
  );
  const results: IcimsCandidateField[] = [];
  const seenIds = new Set<string>();

  candidates.forEach((element) => {
    if (isInsideExtension(element) || !isVisibleElement(element)) {
      return;
    }

    if (isHtmlInput(element)) {
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) {
        return;
      }
      if (element.classList.contains("dropdown-search")) {
        return;
      }
      // captcha / honeypot
      if (
        element.id?.toLowerCase().includes("captcha") ||
        element.name?.toLowerCase().includes("captcha")
      ) {
        return;
      }
    }

    if (isHtmlTextArea(element)) {
      if (
        element.id?.toLowerCase().includes("captcha") ||
        element.name?.toLowerCase().includes("captcha") ||
        element.classList.contains("h-captcha")
      ) {
        return;
      }
    }

    const id =
      element.getAttribute("id") ||
      element.getAttribute("name") ||
      `${results.length}`;
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);

    if (isHtmlSelect(element)) {
      if (isIcimsCustomDropdown(element)) {
        results.push({
          element,
          label: getIcimsFieldLabel(element),
          required: isIcimsRequiredField(element),
          kind: "icims-dropdown",
        });
        return;
      }

      results.push({
        element,
        label: getIcimsFieldLabel(element),
        required: isIcimsRequiredField(element),
        kind: "select",
      });
      return;
    }

    results.push({
      element,
      label: getIcimsFieldLabel(element),
      required: isIcimsRequiredField(element),
      kind: "text",
    });
  });

  return results;
};

/**
 * Scans the iCIMS application form and builds an API payload
 * with field labels, required flags, types, and select options.
 */
export const scanIcimsHtmlToMakeApiPayload = async (
  options: IcimsScanToMakeApiOptions = {},
): Promise<IcimsScanToMakeApiPayload> => {
  const url = getIcimsFormUrl();
  const candidates = collectIcimsCandidateFields();
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

    // iCIMS custom / ajax dropdown
    const dropdownOptions = await openAndScanIcimsDropdownOptions(
      candidate.element as HTMLSelectElement,
    );
    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      ...(dropdownOptions.length > 0 ? { options: dropdownOptions } : {}),
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "icims",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
