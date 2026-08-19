import { EXTENSION_ROOT_ID } from "../../utils/constant";
import { delay } from "../helper";

export type ApiElementType = "text" | "search";

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[];
}

export interface BambooHrScanToMakeApiPayload {
  elements: ApiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface BambooHrScanToMakeApiOptions {
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
  /^(–|-|—)?\s*(select|choose|please select|select one)?\s*(–|-|—)?$/i;

const FABRIC_SELECT_WRAPPER =
  '[data-fabric-component="SelectField InputWrapper"], [data-fabric-component="SelectField"]';
const FABRIC_SELECT = '[data-fabric-component="Select"], .fab-Select';
const RADIO_GROUP =
  'fieldset[data-fabric-component="RadioGroup"], fieldset.CandidateField';

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isInsideExtension = (element: Element): boolean =>
  !!element.closest(`#${EXTENSION_ROOT_ID}`);

export const getBambooHrFormRoot = (): HTMLElement => {
  const form =
    document.querySelector<HTMLElement>("form#job-application-form") ||
    document.querySelector<HTMLElement>("form[id*='job-application']") ||
    document.querySelector<HTMLElement>(
      "form[data-fabric-component], .CandidateForm, form.CandidateForm",
    );
  return form && !isInsideExtension(form) ? form : document.body;
};

const isPlaceholderOption = (label: string): boolean => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return true;
  return PLACEHOLDER_OPTION_RE.test(cleaned);
};

const isHoneypotField = (element: HTMLElement): boolean => {
  const name = (element.getAttribute("name") || "").toLowerCase();
  const id = (element.getAttribute("id") || "").toLowerCase();
  const autocomplete = (
    element.getAttribute("autocomplete") || ""
  ).toLowerCase();
  if (
    name.includes("nickname") ||
    id.includes("nickname") ||
    autocomplete.includes("nickname")
  ) {
    return true;
  }

  const label = getAssociatedLabelText(element).toLowerCase();
  if (label.includes("leave this field blank")) {
    return true;
  }

  return false;
};

const isRecaptchaField = (element: HTMLElement): boolean => {
  const name = (element.getAttribute("name") || "").toLowerCase();
  const id = (element.getAttribute("id") || "").toLowerCase();
  return (
    name.includes("recaptcha") ||
    id.includes("recaptcha") ||
    !!element.closest(".g-recaptcha, [title='reCAPTCHA']")
  );
};

const isVisibleElement = (element: HTMLElement): boolean => {
  if (element.closest(".visually-hidden, [hidden], [aria-hidden='true']")) {
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
  return true;
};

const getAssociatedLabelText = (element: HTMLElement): string => {
  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }
  return "";
};

const getWrapperLabel = (wrapper: HTMLElement): string => {
  const label =
    wrapper.querySelector("label.MuiInputLabel-root, label.MuiFormLabel-root") ||
    wrapper.querySelector("label");
  if (label?.textContent) {
    return cleanLabelText(label.textContent);
  }
  return "";
};

const getFieldLabel = (element: HTMLElement): string => {
  const fromFor = getAssociatedLabelText(element);
  if (fromFor) return fromFor;

  const wrapper = element.closest(
    '[data-fabric-component="TextField InputWrapper"], [data-fabric-component="TextArea InputWrapper"], [data-fabric-component="SelectField InputWrapper"], .CandidateField, .MuiFormControl-root',
  ) as HTMLElement | null;
  if (wrapper) {
    const fromWrapper = getWrapperLabel(wrapper);
    if (fromWrapper) return fromWrapper;
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    // Fabric toggle aria-label is "State –Select–" / "Country United States"
    const stripped = cleanLabelText(
      ariaLabel.replace(/\s*(–Select–|Select).*$/i, ""),
    );
    if (stripped) return stripped;
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  return (
    element.getAttribute("name") ||
    element.getAttribute("id") ||
    "Unknown field"
  );
};

const isRequiredField = (element: HTMLElement): boolean => {
  if (
    element.getAttribute("aria-required") === "true" ||
    element.hasAttribute("required")
  ) {
    return true;
  }

  const wrapper = element.closest(
    '[data-fabric-component="TextField InputWrapper"], [data-fabric-component="TextArea InputWrapper"], [data-fabric-component="SelectField InputWrapper"], .MuiFormControl-root, .CandidateField, fieldset',
  );
  if (wrapper) {
    const requiredSelect = wrapper.querySelector("select[required]");
    if (requiredSelect) return true;

    const label =
      wrapper.querySelector("label.Mui-required") ||
      wrapper.querySelector("label");
    if (label?.classList.contains("Mui-required")) return true;
    if (label?.textContent?.includes("*")) return true;
    if (wrapper.querySelector(".MuiFormLabel-asterisk, .required")) {
      return true;
    }
  }

  const id = element.getAttribute("id");
  const label =
    (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || null;
  if (label?.textContent?.includes("*")) return true;
  if (label?.classList.contains("Mui-required")) return true;

  return false;
};

const getNativeSelectOptions = (select: HTMLSelectElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  Array.from(select.options).forEach((opt) => {
    const label = cleanLabelText(opt.textContent ?? opt.value);
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

const getRadioOptionLabel = (input: HTMLInputElement): string => {
  const row = input.closest("label, .MuiFormControlLabel-root");
  const text = row?.querySelector(".MuiFormControlLabel-label")?.textContent;
  if (text) return cleanLabelText(text);

  if (input.id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (forLabel?.textContent) return cleanLabelText(forLabel.textContent);
  }

  const parentLabel = input.closest("label");
  if (parentLabel?.textContent) {
    return cleanLabelText(parentLabel.textContent);
  }

  return cleanLabelText(input.value || "");
};

const extractRadioGroupOptions = (fieldset: HTMLElement): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();
  const title = getRadioGroupLabel(fieldset);

  fieldset
    .querySelectorAll<HTMLInputElement>("input[type='radio']")
    .forEach((radio) => {
      const label = getRadioOptionLabel(radio);
      if (!label || seen.has(label) || label === title) return;
      seen.add(label);
      options.push(label);
    });

  return options;
};

const getRadioGroupLabel = (fieldset: HTMLElement): string => {
  const legendLabel =
    fieldset.querySelector("legend label") ||
    fieldset.querySelector("[data-fabric-component='Label'] label") ||
    fieldset.querySelector("legend");
  if (legendLabel?.textContent) {
    return cleanLabelText(legendLabel.textContent);
  }
  return getWrapperLabel(fieldset) || "Unknown field";
};

const isRadioGroupRequired = (fieldset: HTMLElement): boolean => {
  if (
    fieldset.getAttribute("aria-required") === "true" ||
    fieldset.hasAttribute("required")
  ) {
    return true;
  }
  const legend = fieldset.querySelector("legend, label");
  return !!legend?.textContent?.includes("*");
};

interface FabricSelectControls {
  outerButton: HTMLButtonElement | null;
  chevron: HTMLElement | null;
  menuId: string | null;
}

const getFabricSelectControls = (
  wrapper: HTMLElement,
): FabricSelectControls => {
  const outerButton =
    wrapper.querySelector<HTMLButtonElement>("button.fab-SelectToggle") ||
    wrapper.querySelector<HTMLButtonElement>("button[aria-haspopup='true']");
  const chevron = wrapper.querySelector<HTMLElement>(
    ".fab-SelectToggle__toggleButton",
  );
  const menuId =
    outerButton?.getAttribute("data-menu-id") ||
    wrapper.querySelector("[data-menu-id]")?.getAttribute("data-menu-id") ||
    null;
  return { outerButton, chevron, menuId };
};

const FABRIC_SELECT_SETTLE_MS = 3000;

const isFabricMenuVisible = (menu: HTMLElement): boolean => {
  const style = window.getComputedStyle(menu);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = menu.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/**
 * Fabric only opens when a real pointer/mouse sequence is dispatched on
 * `button.fab-SelectToggle` (native `.click()` is ignored).
 */
export const dispatchBambooHrSelectClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "center", inline: "nearest" });
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }

  const rect = element.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;
  const mouseInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    detail: 1,
    buttons: 1,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
  };
  const pointerInit: PointerEventInit = {
    ...mouseInit,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  };

  element.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
  element.dispatchEvent(new MouseEvent("mousedown", mouseInit));
  element.dispatchEvent(new PointerEvent("pointerup", pointerInit));
  element.dispatchEvent(new MouseEvent("mouseup", mouseInit));
  element.dispatchEvent(new MouseEvent("click", mouseInit));
};

const findOpenFabricMenu = (menuId?: string | null): HTMLElement | null => {
  if (menuId) {
    const scoped = document.querySelector<HTMLElement>(
      `[data-fabric-component="Select Menu"][data-helium-id="${CSS.escape(menuId)}"]`,
    );
    if (scoped && isFabricMenuVisible(scoped)) return scoped;

    const byHelium = document.querySelector<HTMLElement>(
      `[data-helium-id="${CSS.escape(menuId)}"]`,
    );
    if (byHelium && isFabricMenuVisible(byHelium)) {
      return (
        byHelium.closest<HTMLElement>("[data-fabric-component='Select Menu']") ||
        byHelium
      );
    }
  }

  const menus = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-fabric-component="Select Menu"]',
    ),
  ).filter(isFabricMenuVisible);
  return menus[0] ?? null;
};

export const scrapeBambooHrFabricMenuItems = (
  menuId?: string | null,
): HTMLElement[] => {
  const menu = findOpenFabricMenu(menuId);
  const root: ParentNode = menu ?? document;
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      '.fab-MenuOption[role="menuitem"], .fab-MenuOption, [role="menuitem"]',
    ),
  ).filter((item) => !item.closest(".fab-MenuSearch"));
};

export const scrapeBambooHrFabricMenuOptions = (
  menuId?: string | null,
): string[] => {
  const options: string[] = [];
  const seen = new Set<string>();

  scrapeBambooHrFabricMenuItems(menuId).forEach((item) => {
    const label = cleanLabelText(
      item.querySelector(".fab-MenuOption__row")?.textContent ??
        item.textContent ??
        "",
    );
    if (!label || seen.has(label) || isPlaceholderOption(label)) return;
    if (/^clear selection$/i.test(label)) return;
    if (/^search/i.test(label)) return;
    seen.add(label);
    options.push(label);
  });

  return options;
};

export const closeBambooHrFabricMenu = async (): Promise<void> => {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    }),
  );
  await delay(400);
};

const isSelectExpanded = (button: HTMLElement | null): boolean =>
  button?.getAttribute("aria-expanded") === "true";

/**
 * Dispatch click on `button.fab-SelectToggle`, wait 3s for the portal menu.
 * Leaves the menu open so fill can click an option.
 */
export const openBambooHrFabricSelectMenu = async (
  wrapper: HTMLElement,
): Promise<HTMLElement[]> => {
  const { outerButton, chevron, menuId } = getFabricSelectControls(wrapper);
  if (!outerButton) return [];

  if (isSelectExpanded(outerButton)) {
    const existing = scrapeBambooHrFabricMenuItems(menuId);
    if (existing.length > 0) return existing;
    await closeBambooHrFabricMenu();
  } else {
    await closeBambooHrFabricMenu();
  }

  dispatchBambooHrSelectClick(outerButton);
  await delay(FABRIC_SELECT_SETTLE_MS);

  if (!isSelectExpanded(outerButton) && chevron) {
    dispatchBambooHrSelectClick(chevron);
    await delay(FABRIC_SELECT_SETTLE_MS);
  }

  let items = scrapeBambooHrFabricMenuItems(menuId);
  if (items.length === 0) {
    await delay(1000);
    items = scrapeBambooHrFabricMenuItems(menuId);
  }

  return items;
};

/**
 * Click `button.fab-SelectToggle`, wait for the portal menu, then read options.
 */
const openAndScanFabricSelectOptions = async (
  wrapper: HTMLElement,
): Promise<string[]> => {
  const { menuId } = getFabricSelectControls(wrapper);
  await openBambooHrFabricSelectMenu(wrapper);
  const options = scrapeBambooHrFabricMenuOptions(menuId);
  await closeBambooHrFabricMenu();
  return options;
};

export type BambooHrFieldKind =
  | "text"
  | "date"
  | "select"
  | "fabric-select"
  | "radio-group";

export interface BambooHrCandidateField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: BambooHrFieldKind;
  options?: string[];
}

const isDateField = (element: HTMLElement): boolean => {
  if (element.closest("[data-fabric-component='DatePicker']")) return true;
  if (element.getAttribute("name") === "dateAvailable") return true;
  const placeholder = (element.getAttribute("placeholder") || "").toLowerCase();
  if (placeholder.includes("mm/dd") || placeholder.includes("yyyy")) {
    return true;
  }
  const label = getFieldLabel(element).toLowerCase();
  return /^date\b/.test(label) || label.includes("date available");
};

const alreadyCoveredBySelect = (
  element: HTMLElement,
  selectWrappers: HTMLElement[],
): boolean => selectWrappers.some((wrapper) => wrapper.contains(element));

/**
 * Collect autofillable BambooHR application form fields from the host page.
 * Covers Fabric (current) and older CandidateField markup.
 */
export const collectBambooHrCandidateFields = (): BambooHrCandidateField[] => {
  const formRoot = getBambooHrFormRoot();
  const results: BambooHrCandidateField[] = [];
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();

  const selectWrappers = Array.from(
    formRoot.querySelectorAll<HTMLElement>(
      `${FABRIC_SELECT_WRAPPER}, ${FABRIC_SELECT}`,
    ),
  ).filter((wrapper) => {
    if (isInsideExtension(wrapper)) return false;
    // Prefer outer SelectField wrapper over inner .fab-Select
    const isInnerSelect =
      wrapper.matches(FABRIC_SELECT) &&
      wrapper.closest(FABRIC_SELECT_WRAPPER) &&
      wrapper.closest(FABRIC_SELECT_WRAPPER) !== wrapper;
    return !isInnerSelect;
  });

  const markSeen = (id: string, label: string): boolean => {
    const labelKey = label.toLowerCase();
    if (seenIds.has(id) || seenLabels.has(labelKey)) return false;
    seenIds.add(id);
    seenLabels.add(labelKey);
    return true;
  };

  selectWrappers.forEach((wrapper, index) => {
    const controls = getFabricSelectControls(wrapper);
    if (!controls.outerButton) return;

    const hiddenSelect = wrapper.querySelector("select");
    const label =
      getWrapperLabel(wrapper) ||
      (controls.outerButton ? getFieldLabel(controls.outerButton) : "");
    if (!label) return;

    const id =
      hiddenSelect?.getAttribute("id") ||
      hiddenSelect?.getAttribute("name") ||
      controls.menuId ||
      `fabric-select-${index}`;
    if (!markSeen(id, label)) return;

    results.push({
      element: wrapper,
      label,
      required:
        isRequiredField(wrapper) ||
        isRequiredField(controls.outerButton ?? wrapper),
      kind: "fabric-select",
      options: hiddenSelect ? getNativeSelectOptions(hiddenSelect) : [],
    });
  });

  formRoot
    .querySelectorAll<HTMLElement>("input, textarea, select")
    .forEach((element) => {
      if (isInsideExtension(element) || !isVisibleElement(element)) return;
      if (isHoneypotField(element) || isRecaptchaField(element)) return;
      if (alreadyCoveredBySelect(element, selectWrappers)) return;

      if (element instanceof HTMLInputElement) {
        const type = (element.type || "text").toLowerCase();
        if (SKIP_INPUT_TYPES.has(type)) return;
        // Honeypot / off-screen Fabric decoy inputs
        if (element.tabIndex === -1 && type === "text") return;
      }

      // Hidden auto-resize twin of Fabric textarea
      if (
        element instanceof HTMLTextAreaElement &&
        (element.readOnly || element.tabIndex === -1)
      ) {
        return;
      }

      const id =
        element.getAttribute("id") ||
        element.getAttribute("name") ||
        `${results.length}`;
      const label = getFieldLabel(element);
      if (!label || label.toLowerCase() === "unknown field") return;
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
        kind: isDateField(element) ? "date" : "text",
      });
    });

  formRoot.querySelectorAll<HTMLElement>(RADIO_GROUP).forEach((fieldset, index) => {
    if (isInsideExtension(fieldset)) return;
    const radios = fieldset.querySelectorAll("input[type='radio']");
    if (radios.length === 0) return;

    const label = getRadioGroupLabel(fieldset);
    if (!label) return;
    const id = fieldset.getAttribute("id") || `radio-group-${index}`;
    if (!markSeen(id, label)) return;

    results.push({
      element: fieldset,
      label,
      required: isRadioGroupRequired(fieldset),
      kind: "radio-group",
      options: extractRadioGroupOptions(fieldset),
    });
  });

  results.sort((a, b) => {
    const pos = a.element.compareDocumentPosition(b.element);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  return results;
};

/**
 * Scans the BambooHR application form and builds an API payload
 * with field labels, required flags, types, and select options.
 */
export const scanBambooHrHtmlToMakeApiPayload = async (
  options: BambooHrScanToMakeApiOptions = {},
): Promise<BambooHrScanToMakeApiPayload> => {
  const url = window.location.href;
  const candidates = collectBambooHrCandidateFields();
  const elements: ApiFormElement[] = [];

  for (const candidate of candidates) {
    if (candidate.kind === "text" || candidate.kind === "date") {
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

    // Fabric custom dropdown — click toggle, wait, then read portal menu
    const fabricOptions = await openAndScanFabricSelectOptions(candidate.element);
    const optionsList =
      fabricOptions.length > 0 ? fabricOptions : candidate.options ?? [];
    elements.push({
      label: candidate.label,
      required: candidate.required,
      type: "search",
      options: optionsList,
    });
  }

  return {
    elements,
    token: options.token ?? "",
    url,
    parser: options.parser ?? "internal",
    source: "bamboohr",
    fromAgent: options.fromAgent ?? false,
    resumeId: options.resumeId ?? "",
    userId: options.userId ?? "",
  };
};
