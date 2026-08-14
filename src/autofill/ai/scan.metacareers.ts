import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface MetacareersScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface MetacareersScanToMakeApiOptions {
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

const REQUIRED_FORM_IDS = new Set([
  "JobApplicationForm_firstName",
  "JobApplicationForm_lastName",
  "JobApplicationForm_email",
  "JobApplicationForm_phoneNumber",
  "JobApplicationForm_locationCity",
]);

const ACCOUNT_SECTION_RE =
  /create a career profile|already have an account|use a password|use a one-time code/i;

export type MetacareersFieldKind =
  | "text"
  | "combobox"
  | "select"
  | "phone-country"
  | "option-group"
  | "checkbox-group";

export interface MetacareersCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: MetacareersFieldKind;
  options?: string[];
}

export const cleanMetacareersLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

const isDisplayVisible = (element: HTMLElement): boolean => {
  if (!element.isConnected) return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const isVisibleElement = (element: HTMLElement): boolean => {
  if (element.closest("[aria-hidden='true']")) {
    return false;
  }
  if (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

/**
 * Common ancestor of JobApplicationForm_* markers (resume + profile + self-ID).
 */
export const getMetacareersFormRoot = (): HTMLElement => {
  const markers = Array.from(
    document.querySelectorAll<HTMLElement>('[id^="JobApplicationForm_"]'),
  ).filter((el) => !isInsideExtension(el));

  if (markers.length === 0) {
    const heading = Array.from(document.querySelectorAll("h1, h2")).find((h) =>
      /resume upload/i.test(h.textContent ?? ""),
    );
    return (heading?.parentElement as HTMLElement) ?? document.body;
  }

  let root: HTMLElement = markers[0];
  for (const marker of markers) {
    while (root && !root.contains(marker) && root !== document.body) {
      root = root.parentElement as HTMLElement;
    }
  }
  return root ?? document.body;
};

const getNearbyFormId = (element: HTMLElement): string | null => {
  const label = element.closest("label");
  const scope = label?.parentElement ?? element.parentElement;
  const marker = scope?.querySelector<HTMLElement>('[id^="JobApplicationForm_"]');
  if (marker?.id?.startsWith("JobApplicationForm_")) return marker.id;

  const previous = (label ?? element).previousElementSibling as HTMLElement | null;
  if (previous?.id?.startsWith("JobApplicationForm_")) return previous.id;

  return null;
};

const getFieldLabel = (element: HTMLElement): string => {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    const cleaned = cleanMetacareersLabelText(ariaLabel);
    if (/^(code|phone country code)$/i.test(cleaned)) {
      return "Phone Country Code";
    }
    return cleaned;
  }

  const id = element.getAttribute("id");
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel?.textContent) {
      return cleanMetacareersLabelText(forLabel.textContent);
    }
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanMetacareersLabelText(labelEl.textContent);
    }
  }

  const wrappingLabel = element.closest("label");
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll("input, textarea, select, button, svg")
      .forEach((el) => el.remove());
    const text = cleanMetacareersLabelText(clone.textContent ?? "");
    if (text) return text;
  }

  const formId = getNearbyFormId(element);
  if (formId) {
    const key = formId.replace("JobApplicationForm_", "");
    if (key === "firstName") return "First name";
    if (key === "lastName") return "Last name";
    if (key === "email") return "Email";
    if (key === "phoneNumber") return "Phone number";
    if (key === "website") return "Website (Examples: Linkedin, Github, portfolio)";
    if (key === "locationCity") return "Current location";
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

  const group = element.closest("[aria-required], [required], [role='radiogroup']");
  if (
    group?.getAttribute("aria-required") === "true" ||
    group?.hasAttribute("required")
  ) {
    return true;
  }

  const formId = getNearbyFormId(element);
  if (formId && REQUIRED_FORM_IDS.has(formId)) {
    return true;
  }

  const label =
    (element.id &&
      document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) ||
    element.closest("label");
  if (label?.textContent?.includes("*")) {
    return true;
  }

  return false;
};

const isComboboxControl = (element: HTMLElement): boolean =>
  element.getAttribute("role") === "combobox";

const isPhoneCountryCombobox = (element: HTMLElement): boolean => {
  const label = getFieldLabel(element).toLowerCase();
  if (label === "phone country code" || label === "code") return true;
  const aria = (element.getAttribute("aria-label") ?? "").toLowerCase();
  return aria === "code" || aria === "phone country code";
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanMetacareersLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label)) return;
    if (!opt.value && /select|choose|---/i.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

export const getMetacareersChoiceOptionLabel = (
  input: HTMLInputElement,
): string => {
  const wrappingLabel = input.closest("label");
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll("input, textarea, select, button, svg")
      .forEach((el) => el.remove());
    const text = cleanMetacareersLabelText(clone.textContent ?? "");
    if (text) return text;
  }

  const aria = input.getAttribute("aria-label");
  if (aria) return cleanMetacareersLabelText(aria);

  if (input.value && !/^(true|false)$/i.test(input.value)) {
    return cleanMetacareersLabelText(input.value);
  }

  return "";
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

const collectVisibleOptions = (root: ParentNode = document): string[] => {
  const results: string[] = [];
  const seen = new Set<string>();

  root
    .querySelectorAll<HTMLElement>("[role='option'], [role='listbox'] [role='option']")
    .forEach((opt) => {
      if (!isDisplayVisible(opt)) return;
      const label = cleanMetacareersLabelText(opt.textContent ?? "");
      if (!label || seen.has(label)) return;
      seen.add(label);
      results.push(label);
    });

  return results;
};

const waitForComboboxOptions = (timeoutMs = 700): Promise<string[]> =>
  new Promise((resolve) => {
    const existing = collectVisibleOptions();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const opts = collectVisibleOptions();
      if (opts.length > 0) {
        observer.disconnect();
        window.clearTimeout(timer);
        resolve(opts);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(collectVisibleOptions());
    }, timeoutMs);
  });

const openAndScanComboboxOptions = async (
  element: HTMLElement,
): Promise<string[]> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(80);
  }

  element.focus();
  element.click();
  await waitForDomUpdate();

  let options = await waitForComboboxOptions(700);
  if (options.length === 0) {
    await delay(150);
    await waitForDomUpdate();
    options = collectVisibleOptions();
  }

  closeListbox();
  await delay(80);
  return options;
};

const isInsideAccountSection = (element: Element): boolean => {
  const heading = Array.from(document.querySelectorAll("h2")).find(
    (h) =>
      !isInsideExtension(h) &&
      ACCOUNT_SECTION_RE.test(h.textContent ?? ""),
  );
  const section = heading?.parentElement;
  return !!section && section.contains(element);
};

const getRadiogroupLabel = (group: HTMLElement): string => {
  const labelledBy = group.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanMetacareersLabelText(labelEl.textContent);
    }
  }

  const heading = group.querySelector("span, legend, [id]");
  if (heading?.textContent) {
    return cleanMetacareersLabelText(heading.textContent);
  }

  return "Unknown field";
};

const collectRadiogroupOptions = (group: HTMLElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  group.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach((radio) => {
    const label = getMetacareersChoiceOptionLabel(radio);
    if (!label || seen.has(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const findLocationCheckboxGroup = (
  formRoot: HTMLElement,
): { element: HTMLElement; label: string; options: string[] } | null => {
  const lists = Array.from(
    formRoot.querySelectorAll<HTMLElement>('[role="list"]'),
  ).filter((list) => !isInsideExtension(list));

  for (const list of lists) {
    const checkboxes = Array.from(
      list.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
    );
    if (checkboxes.length < 2) continue;

    const options: string[] = [];
    const seen = new Set<string>();
    checkboxes.forEach((cb) => {
      const label = getMetacareersChoiceOptionLabel(cb);
      if (!label || seen.has(label)) return;
      seen.add(label);
      options.push(label);
    });
    if (options.length === 0) continue;

    let label = "Please select one or more locations where you'd like to apply.";
    const labelledBy = list.getAttribute("aria-labelledby");
    if (labelledBy) {
      const heading = document.getElementById(labelledBy.split(/\s+/)[0]);
      const headingText = cleanMetacareersLabelText(heading?.textContent ?? "");
      if (headingText) label = headingText;
    }

    if (
      !labelledBy ||
      label === "Please select one or more locations where you'd like to apply."
    ) {
      let scope: HTMLElement | null = list.parentElement;
      for (let i = 0; i < 4 && scope; i += 1) {
        const instruction = Array.from(scope.children)
          .map((el) => cleanMetacareersLabelText(el.textContent ?? ""))
          .find(
            (text) =>
              /location/i.test(text) &&
              text.length < 180 &&
              !options.includes(text),
          );
        if (instruction) {
          label = instruction;
          break;
        }
        scope = scope.parentElement;
      }
    }

    return { element: list, label, options };
  }

  return null;
};

/**
 * Collect autofillable Meta Careers application fields from the host page.
 */
export const collectMetacareersCandidateFields = (): MetacareersCandidateField[] => {
  const formRoot = getMetacareersFormRoot();
  const results: MetacareersCandidateField[] = [];
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();
  let phoneCountryAdded = false;

  const addResult = (field: MetacareersCandidateField): void => {
    const key = field.label.toLowerCase();
    if (!field.label || seenLabels.has(key)) return;
    seenLabels.add(key);
    results.push(field);
  };

  const locationGroup =
    findLocationCheckboxGroup(formRoot) ??
    (formRoot !== document.body
      ? findLocationCheckboxGroup(document.body)
      : null);
  if (locationGroup) {
    addResult({
      element: locationGroup.element,
      label: locationGroup.label,
      required: true,
      kind: "checkbox-group",
      options: locationGroup.options,
    });
  }

  const candidates = formRoot.querySelectorAll<HTMLElement>(
    "input, textarea, select, [role='combobox']",
  );

  candidates.forEach((element) => {
    if (isInsideExtension(element)) return;

    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (SKIP_INPUT_TYPES.has(type)) return;
    }

    if (isInsideAccountSection(element)) return;

    if (!isComboboxControl(element) && !isVisibleElement(element)) {
      return;
    }

    if (isComboboxControl(element) && !isDisplayVisible(element)) {
      return;
    }

    const id =
      element.getAttribute("id") ||
      getNearbyFormId(element) ||
      element.getAttribute("name") ||
      `${results.length}`;
    if (seenIds.has(id)) return;
    seenIds.add(id);

    if (isPhoneCountryCombobox(element)) {
      if (phoneCountryAdded) return;
      phoneCountryAdded = true;
      addResult({
        element,
        label: "Phone Country Code",
        required: true,
        kind: "phone-country",
      });
      return;
    }

    if (element instanceof HTMLSelectElement) {
      addResult({
        element,
        label: getFieldLabel(element),
        required: isRequiredField(element),
        kind: "select",
        options: getNativeSelectOptions(element),
      });
      return;
    }

    if (isComboboxControl(element)) {
      addResult({
        element,
        label: getFieldLabel(element),
        required: isRequiredField(element),
        kind: "combobox",
      });
      return;
    }

    addResult({
      element,
      label: getFieldLabel(element),
      required: isRequiredField(element),
      kind: "text",
    });
  });

  formRoot
    .querySelectorAll<HTMLElement>('[role="radiogroup"]')
    .forEach((group) => {
      if (isInsideExtension(group) || isInsideAccountSection(group)) return;

      const nativeRadios = Array.from(
        group.querySelectorAll<HTMLInputElement>("input[type='radio']"),
      );
      if (nativeRadios.length === 0) return;

      const label = getRadiogroupLabel(group);
      if (!label) return;

      const options = collectRadiogroupOptions(group);
      if (options.length === 0) return;

      addResult({
        element: group,
        label,
        required: isRequiredField(group),
        kind: "option-group",
        options,
      });
    });

  return results;
};

/**
 * Scans the Meta Careers application form and builds an API payload
 * with field labels, required flags, types, and select options.
 */
export const scanMetacareersHtmlToMakeApiPayload = async (
  options: MetacareersScanToMakeApiOptions = {},
): Promise<MetacareersScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectMetacareersCandidateFields();
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
    source: "metacareers",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
