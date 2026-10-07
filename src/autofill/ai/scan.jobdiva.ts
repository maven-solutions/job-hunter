import { delay } from "../helper";
import { Applicant } from "../data";
import { EXTENSION_ROOT_ID } from "../../utils/constant";

export type ApiElementType =
  | "text"
  | "search"
  | "checkbox"
  | "education"
  | "employment";

/** One field inside an Education group, matching the Workday nested schema. */
export interface JobdivaNestedField {
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}

export interface ApiFormElement {
  label: string;
  required: boolean;
  type: ApiElementType;
  options?: string[] | JobdivaNestedField[];
  /** How many education entries the applicant has. */
  count?: number;
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
  applicantData?: Applicant | null;
}

/** Text inputs, passwords, selects, Bootstrap dropdowns, and consent checkboxes. */
export type JobdivaFieldKind =
  | "text"
  | "password"
  | "select"
  | "combobox"
  | "checkbox";

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
const EDUCATION_CARD_SELECTOR = ".jd-reg-card.id-reg-education";
const WORK_CARD_SELECTOR = ".jd-reg-card.id-reg-workexperience";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

/** Bootstrap dropdown that owns this toggle (`jd-form-select`, country `dropright`, etc.). */
export const getJobdivaDropdownRoot = (element: HTMLElement): HTMLElement =>
  (element.closest(
    ".jd-form-select, .dropright, .dropup, .dropdown",
  ) as HTMLElement) ?? element;

const isPhoneTypeMenu = (element: HTMLElement): boolean => {
  const names = readJobdivaMenuOptions(getJobdivaDropdownRoot(element)).map(
    (option) => option.label.toLowerCase(),
  );
  return (
    names.includes("mobile") && (names.includes("work") || names.includes("home"))
  );
};

const isPhoneCountryDropdown = (element: HTMLElement): boolean =>
  element instanceof HTMLButtonElement && !!element.closest(".jd-form-phone");

const getCheckboxLabel = (input: HTMLInputElement): string => {
  const wrap = input.closest(".jd-checkbox");
  if (input.id && wrap) {
    const inner = wrap.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (inner?.textContent) return cleanLabelText(inner.textContent);
  }
  if (wrap) {
    const clone = wrap.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, svg").forEach((node) => node.remove());
    const text = cleanLabelText(clone.textContent ?? "");
    if (text) return text;
  }
  return getJobdivaFieldLabel(input);
};

const isCheckboxVisible = (input: HTMLInputElement): boolean => {
  const wrap = input.closest(".jd-checkbox");
  if (wrap instanceof HTMLElement) return isVisibleElement(wrap);
  return isVisibleElement(input);
};

const collectLayoutControls = (layout: HTMLElement): HTMLElement[] => {
  const controls: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();
  const push = (element: HTMLElement): void => {
    if (seen.has(element) || isInsideExtension(element)) return;
    seen.add(element);
    controls.push(element);
  };

  layout
    .querySelectorAll<HTMLButtonElement>(
      ".jd-form-select button[data-bs-toggle='dropdown'], .jd-form-phone .dropright > button, .jd-form-phone .dropdown > button[data-bs-toggle='dropdown']",
    )
    .forEach((button) => {
      if (isVisibleElement(button)) push(button);
    });

  layout.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    if (isEligibleControl(select)) push(select);
  });
  layout.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((textarea) => {
    if (isEligibleControl(textarea)) push(textarea);
  });
  layout.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    const type = (input.type || "text").toLowerCase();
    if (type === "checkbox" || type === "radio") return;
    if (isEligibleControl(input)) push(input);
  });

  return controls;
};

const readOptionLabel = (optionEl: HTMLElement): string => {
  const textSpan = Array.from(optionEl.children).find(
    (child) =>
      child.tagName === "SPAN" &&
      !child.querySelector("svg") &&
      cleanLabelText(child.textContent ?? ""),
  );
  if (textSpan) return cleanLabelText(textSpan.textContent ?? "");

  const clone = optionEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("svg").forEach((node) => node.remove());
  return cleanLabelText(clone.textContent ?? "");
};

const pushUniqueOptions = (
  results: JobdivaOptionNode[],
  seen: Set<string>,
  optionEl: HTMLElement,
): void => {
  if (isInsideExtension(optionEl)) return;
  const label = readOptionLabel(optionEl);
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

  const scoped = readJobdivaMenuOptions(
    getJobdivaDropdownRoot(element),
    false,
  ).map((option) => option.label);
  if (scoped.length > 0) return scoped;

  const layout = element.closest(LAYOUT_SELECTOR);
  if (!layout) return [];
  return readJobdivaMenuOptions(layout, false).map((option) => option.label);
};

const educationEntryTitle = (card: HTMLElement): string => {
  const span = Array.from(card.querySelectorAll("span")).find((el) => {
    if (!isVisibleElement(el)) return false;
    return /^education\s*\d+$/i.test(cleanLabelText(el.textContent ?? ""));
  });
  return span ? cleanLabelText(span.textContent ?? "") : "";
};

/**
 * "Add a Education" is the opener, not an entry. A hidden template inside that
 * card must not count as Education 1, or the plus is never clicked.
 */
const isEducationEntryCard = (card: HTMLElement): boolean => {
  const visible = cleanLabelText(card.innerText || "");
  if (
    /add\s+(an?\s+)?education/i.test(visible) &&
    !/education\s+\d+/i.test(visible) &&
    !/add\s+another/i.test(visible)
  ) {
    return false;
  }
  if (educationEntryTitle(card)) return true;
  return Array.from(card.querySelectorAll<HTMLElement>(LAYOUT_SELECTOR)).some(
    (layout) => isVisibleElement(layout),
  );
};

const listEducationEntryCards = (): HTMLElement[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>(EDUCATION_CARD_SELECTOR),
  ).filter(isEducationEntryCard);

export const countJobdivaEducationCards = (): number =>
  listEducationEntryCards().length;

const educationCardTitle = (card: HTMLElement): string => {
  const title = educationEntryTitle(card);
  if (title) return title;
  const cards = listEducationEntryCards();
  const index = Math.max(0, cards.indexOf(card));
  return `Education ${index + 1}`;
};

/** "Education 1 - School" so repeated cards do not share one label. */
const prefixEducationLabel = (element: HTMLElement, label: string): string => {
  const card = element.closest(EDUCATION_CARD_SELECTOR);
  if (!(card instanceof HTMLElement) || !isEducationEntryCard(card)) return label;
  const title = educationCardTitle(card);
  if (label.toLowerCase().startsWith(title.toLowerCase())) return label;
  return `${title} - ${label}`;
};

const isInsideEducationCard = (element: HTMLElement): boolean => {
  const card = element.closest(EDUCATION_CARD_SELECTOR);
  return card instanceof HTMLElement && isEducationEntryCard(card);
};

const isAddEducationLauncher = (card: HTMLElement): boolean => {
  if (isEducationEntryCard(card)) return false;
  if (card.closest(`#${EXTENSION_ROOT_ID}`)) return false;
  const text = cleanLabelText(card.innerText || card.textContent || "");
  return /add\s+(an?\s+)?education/i.test(text) && !/add\s+another/i.test(text);
};

/** Plus icon, its clickable span, then the card. React ignores a bare .click(). */
const initialAddEntryTargets = (card: HTMLElement): Element[] => {
  const targets: Element[] = [];
  const pointer = Array.from(card.querySelectorAll<HTMLElement>("span")).find(
    (el) => {
      const style = el.getAttribute("style") ?? "";
      if (/cursor:\s*pointer/i.test(style)) return true;
      return window.getComputedStyle(el).cursor === "pointer" && !!el.querySelector("svg");
    },
  );
  const svg =
    pointer?.querySelector("svg") ??
    Array.from(card.querySelectorAll("svg")).find(
      (node) => !/add\s+an?\s+education/i.test(cleanLabelText(node.parentElement?.textContent ?? "")),
    );
  if (svg) targets.push(svg);
  if (pointer) targets.push(pointer);
  const plusSpan = Array.from(card.querySelectorAll<HTMLElement>("span"))
    .reverse()
    .find((el) => el.querySelector(":scope > svg"));
  if (plusSpan) targets.push(plusSpan);
  targets.push(card);
  return targets.filter((el, index) => targets.indexOf(el) === index);
};

/** Plus icon on the empty "Add a Education" card. Path is unique to that button. */
const EDUCATION_PLUS_PATH = "M10 2.5c4.125";

const findEducationPlusButton = (): HTMLElement | null => {
  const cards = document.querySelectorAll<HTMLElement>(EDUCATION_CARD_SELECTOR);
  for (const card of cards) {
    if (card.closest(`#${EXTENSION_ROOT_ID}`)) continue;
    const text = cleanLabelText(card.innerText || card.textContent || "");
    if (!/add\s+a\s+education/i.test(text)) continue;
    const svg = Array.from(card.querySelectorAll("svg")).find((node) =>
      (node.querySelector("path")?.getAttribute("d") ?? "").startsWith(
        EDUCATION_PLUS_PATH,
      ),
    );
    const host = svg?.parentElement;
    if (host instanceof HTMLElement) return host;
  }
  return null;
};

/**
 * The plus is an SVG inside a span. Work experience's add control is a text
 * span and accepts a normal click. This plus only runs its React onClick, so
 * call that handler in the page as well as dispatching the click.
 */
const clickEducationPlusButton = (button: HTMLElement): void => {
  pressJobdivaControl(button);
  const svg = button.querySelector("svg");
  if (svg) pressJobdivaControl(svg);
  button.setAttribute("data-ci-edu-plus", "1");
  const script = document.createElement("script");
  script.textContent = `(function(){
    var el = document.querySelector('[data-ci-edu-plus="1"]');
    if (!el) return;
    el.removeAttribute('data-ci-edu-plus');
    var node = el.querySelector("svg") || el;
    for (var depth = 0; node && depth < 5; depth++, node = node.parentElement) {
      var keys = Object.keys(node);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf("__reactProps") === 0) {
          var props = node[key];
          if (props && typeof props.onClick === "function") {
            props.onClick({
              preventDefault: function(){},
              stopPropagation: function(){},
              target: el,
              currentTarget: node,
              nativeEvent: { target: el },
              type: "click",
              button: 0,
              bubbles: true,
              persist: function(){}
            });
            return;
          }
        }
        if (key.indexOf("__reactFiber") === 0 || key.indexOf("__reactInternalInstance") === 0) {
          var fiber = node[key];
          while (fiber) {
            var memo = fiber.memoizedProps || fiber.pendingProps;
            if (memo && typeof memo.onClick === "function") {
              memo.onClick({
                preventDefault: function(){},
                stopPropagation: function(){},
                target: el,
                currentTarget: fiber.stateNode || node,
                nativeEvent: { target: el },
                type: "click",
                button: 0,
                bubbles: true,
                persist: function(){}
              });
              return;
            }
            fiber = fiber.return;
          }
        }
      }
    }
  })();`;
  document.documentElement.appendChild(script);
  script.remove();
};

/**
 * "+ Add another education entry". Remove Entry uses the same class and is skipped.
 */
const findAddAnotherEducationControl = (): HTMLElement | null => {
  const nodes = document.querySelectorAll<HTMLElement>(".jd-reg-entrybtn");
  for (const el of nodes) {
    if (el.closest(`#${EXTENSION_ROOT_ID}`)) continue;
    const text = cleanLabelText(el.textContent ?? "").replace(/^\+\s*/, "");
    if (/remove/i.test(text)) continue;
    if (/add\s+another\s+education/i.test(text)) return el;
  }
  return null;
};

/**
 * Pointer sequence plus click. JobDiva's add control is a span, and a single
 * element.click() does not run its React handler.
 */
const pressJobdivaControl = (element: Element): void => {
  if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) return;
  element.scrollIntoView({ block: "center", inline: "nearest" });
  const rect = element.getBoundingClientRect();
  const clientX = rect.left + Math.max(rect.width, 1) / 2;
  const clientY = rect.top + Math.max(rect.height, 1) / 2;
  const base = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX,
    clientY,
    button: 0,
  };
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      ...base,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      buttons: 1,
    }),
  );
  element.dispatchEvent(new MouseEvent("mousedown", { ...base, buttons: 1 }));
  element.dispatchEvent(
    new PointerEvent("pointerup", {
      ...base,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      buttons: 0,
    }),
  );
  element.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
  element.dispatchEvent(new MouseEvent("click", { ...base, buttons: 0 }));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  if (typeof (element as HTMLElement).click === "function") {
    (element as HTMLElement).click();
  }
};

const waitForMoreEducationCards = async (previous: number): Promise<number> => {
  const started = Date.now();
  let current = countJobdivaEducationCards();
  while (current <= previous && Date.now() - started < 1600) {
    await delay(200);
    current = countJobdivaEducationCards();
  }
  return current;
};

/**
 * Open one card per education record, the same way Workday clicks Add.
 * No cards yet: press the plus on "Add a Education".
 * Each further record: press "+ Add another education entry".
 */
export const ensureJobdivaEducationCards = async (
  needed: number,
): Promise<void> => {
  if (!needed || needed < 1) return;
  if (
    !document.querySelector(EDUCATION_CARD_SELECTOR) &&
    !findAddAnotherEducationControl()
  ) {
    return;
  }

  let guard = 0;
  while (countJobdivaEducationCards() < needed && guard < 12) {
    const before = countJobdivaEducationCards();
    let opened = false;

    if (before === 0) {
      const plus = findEducationPlusButton();
      if (plus) {
        clickEducationPlusButton(plus);
        const next = await waitForMoreEducationCards(before);
        opened = next > before;
      }
    } else {
      const add = findAddAnotherEducationControl();
      if (add) {
        pressJobdivaControl(add);
        const next = await waitForMoreEducationCards(before);
        opened = next > before;
      }
    }

    if (!opened) break;
    guard += 1;
  }
};

const workEntryTitle = (card: HTMLElement): string => {
  const span = Array.from(card.querySelectorAll("span")).find((el) =>
    /^work\s*experience\s*\d+$/i.test(cleanLabelText(el.textContent ?? "")),
  );
  return span ? cleanLabelText(span.textContent ?? "") : "";
};

/** The empty "Add a Work Experience" card is not an entry. */
const isWorkEntryCard = (card: HTMLElement): boolean => {
  if (workEntryTitle(card)) return true;
  const text = cleanLabelText(card.textContent ?? "");
  if (
    /add\s+(an?\s+)?work\s*experience/i.test(text) &&
    !/add\s+another/i.test(text) &&
    !card.querySelector(LAYOUT_SELECTOR)
  ) {
    return false;
  }
  return !!card.querySelector(LAYOUT_SELECTOR);
};

const listWorkEntryCards = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>(WORK_CARD_SELECTOR)).filter(
    isWorkEntryCard,
  );

export const countJobdivaWorkExperienceCards = (): number =>
  listWorkEntryCards().length;

const workCardTitle = (card: HTMLElement): string => {
  const title = workEntryTitle(card);
  if (title) return title;
  const cards = listWorkEntryCards();
  const index = Math.max(0, cards.indexOf(card));
  return `Work Experience ${index + 1}`;
};

const prefixWorkExperienceLabel = (element: HTMLElement, label: string): string => {
  const card = element.closest(WORK_CARD_SELECTOR);
  if (!(card instanceof HTMLElement) || !isWorkEntryCard(card)) return label;
  const title = workCardTitle(card);
  if (label.toLowerCase().startsWith(title.toLowerCase())) return label;
  return `${title} - ${label}`;
};

const isInsideWorkCard = (element: HTMLElement): boolean => {
  const card = element.closest(WORK_CARD_SELECTOR);
  return card instanceof HTMLElement && isWorkEntryCard(card);
};

const isAddWorkLauncher = (card: HTMLElement): boolean => {
  if (isWorkEntryCard(card)) return false;
  if (card.closest(`#${EXTENSION_ROOT_ID}`)) return false;
  const text = cleanLabelText(card.textContent ?? "");
  return (
    /add\s+(an?\s+)?work\s*experience/i.test(text) && !/add\s+another/i.test(text)
  );
};

const findAddAnotherWorkControl = (): HTMLElement | null => {
  const nodes = document.querySelectorAll<HTMLElement>(".jd-reg-entrybtn");
  for (const el of nodes) {
    if (el.closest(`#${EXTENSION_ROOT_ID}`)) continue;
    const text = cleanLabelText(el.textContent ?? "").replace(/^\+\s*/, "");
    if (/remove/i.test(text)) continue;
    if (/add\s+another\s+work\s*experience/i.test(text)) return el;
  }
  return null;
};

const waitForMoreWorkCards = async (previous: number): Promise<number> => {
  const started = Date.now();
  let current = countJobdivaWorkExperienceCards();
  while (current <= previous && Date.now() - started < 1600) {
    await delay(200);
    current = countJobdivaWorkExperienceCards();
  }
  return current;
};

/**
 * Open one card per job, the same way education cards are opened.
 * No cards yet: press the plus on "Add a Work Experience".
 * Each further job: press "+ Add another work experience entry".
 */
export const ensureJobdivaWorkExperienceCards = async (
  needed: number,
): Promise<void> => {
  if (!needed || needed < 1) return;
  if (!document.querySelector(WORK_CARD_SELECTOR) && !findAddAnotherWorkControl()) {
    return;
  }

  let guard = 0;
  while (countJobdivaWorkExperienceCards() < needed && guard < 12) {
    const before = countJobdivaWorkExperienceCards();
    let opened = false;

    if (before === 0) {
      const launchers = Array.from(
        document.querySelectorAll<HTMLElement>(WORK_CARD_SELECTOR),
      ).filter(isAddWorkLauncher);
      for (const card of launchers) {
        for (const target of initialAddEntryTargets(card)) {
          pressJobdivaControl(target);
          const next = await waitForMoreWorkCards(before);
          if (next > before) {
            opened = true;
            break;
          }
        }
        if (opened) break;
      }
    } else {
      const add = findAddAnotherWorkControl();
      if (add) {
        pressJobdivaControl(add);
        const next = await waitForMoreWorkCards(before);
        opened = next > before;
      }
    }

    if (!opened) break;
    guard += 1;
  }
};

const menuPartKind = (element: HTMLElement): "month" | "year" | "other" => {
  const labels = collectStaticComboboxLabels(element).map((label) =>
    label.toLowerCase(),
  );
  const shown = cleanLabelText(
    element.querySelector(".text-truncate")?.textContent ?? "",
  ).toLowerCase();
  const values = shown ? [...labels, shown] : labels;
  if (values.some((value) => MONTH_NAMES.some((month) => month.toLowerCase() === value))) {
    return "month";
  }
  if (values.some((value) => /^(19|20)\d{2}$/.test(value))) return "year";
  return "other";
};

/** From and To each contain a month menu and a year menu. */
const withDatePartLabel = (element: HTMLElement, label: string): string => {
  if (!/^(from|to)$/i.test(label)) return label;
  const kind = menuPartKind(element);
  if (kind === "month") return `${label} Month`;
  if (kind === "year") return `${label} Year`;
  const layout = element.closest(LAYOUT_SELECTOR);
  if (!(layout instanceof HTMLElement)) return label;
  const menus = collectLayoutControls(layout).filter(
    (control): control is HTMLButtonElement =>
      control instanceof HTMLButtonElement,
  );
  const index = menus.findIndex((control) => control === element);
  if (index === 0) return `${label} Month`;
  if (index === 1) return `${label} Year`;
  return label;
};

const buildJobdivaEducationGroup = (
  applicantData?: Applicant | null,
): ApiFormElement | null => {
  const cards = listEducationEntryCards();
  if (cards.length === 0) return null;

  const profileCount = Array.isArray(applicantData?.education)
    ? applicantData.education.length
    : 0;
  const count = Math.max(cards.length, profileCount, 1);
  const nested: JobdivaNestedField[] = [];
  const seen = new Set<string>();

  cards[0].querySelectorAll<HTMLElement>(LAYOUT_SELECTOR).forEach((layout) => {
    const label = cleanLabelText(
      layout.querySelector(".jd-label")?.textContent ?? "",
    );
    if (!label || seen.has(label)) return;
    seen.add(label);

    const control = collectLayoutControls(layout)[0];
    const required = !!layout.querySelector(".jd-text-red");
    const isMenu =
      !!control &&
      (control instanceof HTMLSelectElement ||
        control instanceof HTMLButtonElement ||
        control.getAttribute("role") === "combobox" ||
        !!control.closest(".jd-form-select, .dropdown"));

    if (isMenu && control) {
      const options = collectStaticComboboxLabels(control);
      nested.push({
        type: "search",
        label,
        required,
        ...(options.length > 0 ? { options } : {}),
      });
      return;
    }

    nested.push({ type: "text", label, required });
  });

  if (nested.length === 0) return null;

  return {
    label: "Education",
    required: nested.some((field) => field.required),
    type: "education",
    count,
    options: nested,
  };
};

const employmentProfileCount = (applicantData?: Applicant | null): number => {
  const history = applicantData?.employment_history as unknown;
  return Array.isArray(history) ? history.length : 0;
};

const buildJobdivaWorkExperienceGroup = (
  applicantData?: Applicant | null,
): ApiFormElement | null => {
  const cards = listWorkEntryCards();
  if (cards.length === 0) return null;

  const count = Math.max(cards.length, employmentProfileCount(applicantData), 1);
  const nested: JobdivaNestedField[] = [];
  const seen = new Set<string>();

  cards[0].querySelectorAll<HTMLElement>(LAYOUT_SELECTOR).forEach((layout) => {
    const base = cleanLabelText(
      layout.querySelector(".jd-label")?.textContent ?? "",
    );
    if (!base) return;
    const controls = collectLayoutControls(layout);
    const required = !!layout.querySelector(".jd-text-red");
    const targets = controls.length > 0 ? controls : [];

    targets.forEach((control) => {
      const label = withDatePartLabel(control, base);
      if (!label || seen.has(label)) return;
      seen.add(label);
      const isMenu =
        control instanceof HTMLSelectElement ||
        control instanceof HTMLButtonElement ||
        control.getAttribute("role") === "combobox" ||
        !!control.closest(".jd-form-select, .dropdown");
      if (isMenu) {
        const options = collectStaticComboboxLabels(control);
        nested.push({
          type: "search",
          label,
          required,
          ...(options.length > 0 ? { options } : {}),
        });
        return;
      }
      nested.push({ type: "text", label, required });
    });
  });

  if (nested.length === 0) return null;

  return {
    label: "Work Experience",
    required: nested.some((field) => field.required),
    type: "employment",
    count,
    options: nested,
  };
};

/**
 * Visible JobDiva application fields on the current wizard step.
 * Password inputs are included because this registration step requires them.
 * A phone row can contain a type menu, a country menu, and the number.
 * Consent checkboxes live in `.jd-checkbox`, outside `.jd-form-layout`.
 * Education cards are labeled "Education N - School" so each entry stays distinct.
 * Work cards are labeled "Work Experience N - Company", and From/To split into Month and Year.
 * Hidden, file, and radio inputs are skipped.
 */
export const collectJobdivaCandidateFields = (): JobdivaCandidateField[] => {
  const results: JobdivaCandidateField[] = [];
  const seen = new Set<HTMLElement>();
  let phoneCountryAdded = false;

  const add = (element: HTMLElement): void => {
    if (seen.has(element) || !isEligibleControl(element)) return;
    seen.add(element);

    let label = getJobdivaFieldLabel(element);

    if (element instanceof HTMLButtonElement && isPhoneTypeMenu(element)) {
      label = "Phone Type";
    } else if (isPhoneCountryDropdown(element)) {
      if (phoneCountryAdded) return;
      phoneCountryAdded = true;
      label = "Phone Country Code";
    } else if (isPhoneCountryField(element, label)) {
      if (phoneCountryAdded) return;
      phoneCountryAdded = true;
      label = "Phone Country Code";
    }

    if (!label || label === "Unknown field") return;
    label = withDatePartLabel(element, label);
    label = prefixEducationLabel(element, label);
    label = prefixWorkExperienceLabel(element, label);

    results.push({
      element,
      label,
      required: isRequiredField(element),
      kind: classifyControl(element),
    });
  };

  document.querySelectorAll<HTMLElement>(LAYOUT_SELECTOR).forEach((layout) => {
    if (isInsideExtension(layout) || !isVisibleElement(layout)) return;
    collectLayoutControls(layout).forEach(add);
  });

  document
    .querySelectorAll<HTMLInputElement>(".jd-checkbox input[type='checkbox']")
    .forEach((input) => {
      if (seen.has(input) || isInsideExtension(input) || !isCheckboxVisible(input)) {
        return;
      }
      const label = getCheckboxLabel(input);
      if (!label || label === "Unknown field") return;
      seen.add(input);
      results.push({
        element: input,
        label,
        required: isRequiredField(input),
        kind: "checkbox",
      });
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

  if (field.kind === "checkbox") {
    return {
      label: field.label,
      required: field.required,
      type: "checkbox",
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
  let hasEducation = false;
  let hasWork = false;

  for (const field of fields) {
    if (isInsideEducationCard(field.element)) {
      hasEducation = true;
      continue;
    }
    if (isInsideWorkCard(field.element)) {
      hasWork = true;
      continue;
    }
    elements.push(await toApiElement(field));
  }

  if (hasEducation) {
    const education = buildJobdivaEducationGroup(options.applicantData);
    if (education) elements.push(education);
  }
  if (hasWork) {
    const work = buildJobdivaWorkExperienceGroup(options.applicantData);
    if (work) elements.push(work);
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
