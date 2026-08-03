import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { collectCandidateFields } from "./scan.greenhouse";

export interface GreenhouseAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface GreenhouseAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

type FieldKind = "text" | "combobox" | "select" | "phone-country";

interface DomField {
  element: HTMLElement;
  label: string;
  kind: FieldKind;
}

const cleanLabelText = (text: string): string =>
  text.replace(/\*/g, "").replace(/\s+/g, " ").trim();

const normalizeLabel = (label: string): string =>
  fromatStirngInLowerCase(cleanLabelText(label)) ?? "";

/**
 * Accepts common API response shapes and returns label/answer pairs.
 * Supported:
 * - { elements: [{ label, answer }] }
 * - { answers: [{ label, answer }] }
 * - { data: { elements|answers|... } }
 * - [{ label, answer }]
 * - { "First Name": "John", ... }  (label→value map)
 */
export const normalizeGreenhouseAiAnswers = (
  response: unknown,
): GreenhouseAiAnswer[] => {
  if (!response) return [];

  let payload: any = response;
  if (payload?.data != null && typeof payload.data === "object") {
    payload = payload.data;
  }

  const toAnswer = (item: any): GreenhouseAiAnswer | null => {
    if (!item || typeof item !== "object") return null;
    const label = String(item.label ?? item.field ?? item.name ?? "").trim();
    const answer = String(
      item.answer ?? item.value ?? item.fill ?? item.text ?? "",
    ).trim();
    if (!label || !answer) return null;
    return {
      label,
      answer,
      type: item.type ? String(item.type) : undefined,
    };
  };

  if (Array.isArray(payload)) {
    return payload.map(toAnswer).filter(Boolean) as GreenhouseAiAnswer[];
  }

  if (Array.isArray(payload?.elements)) {
    return payload.elements
      .map(toAnswer)
      .filter(Boolean) as GreenhouseAiAnswer[];
  }

  if (Array.isArray(payload?.answers)) {
    return payload.answers
      .map(toAnswer)
      .filter(Boolean) as GreenhouseAiAnswer[];
  }

  if (Array.isArray(payload?.fields)) {
    return payload.fields.map(toAnswer).filter(Boolean) as GreenhouseAiAnswer[];
  }

  // Flat map: { "First Name": "John", "Email": "a@b.com" }
  if (typeof payload === "object") {
    const reserved = new Set([
      "elements",
      "answers",
      "fields",
      "resumeId",
      "userId",
      "parser",
      "source",
      "url",
      "token",
      "fromAgent",
      "message",
      "success",
      "status",
      "error",
    ]);
    const mapped: GreenhouseAiAnswer[] = [];
    for (const [label, value] of Object.entries(payload)) {
      if (reserved.has(label)) continue;
      if (typeof value !== "string" && typeof value !== "number") continue;
      const answer = String(value).trim();
      if (!answer) continue;
      mapped.push({ label, answer });
    }
    return mapped;
  }

  return [];
};

const matchOption = (answer: string, options: string[]): string | null => {
  const normalizedAnswer = fromatStirngInLowerCase(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (fromatStirngInLowerCase(option) === normalizedAnswer) {
      return option;
    }
  }

  for (const option of options) {
    const normalizedOption = fromatStirngInLowerCase(option);
    if (
      normalizedOption?.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedOption ?? "")
    ) {
      return option;
    }
  }

  return null;
};

const findAnswerForLabel = (
  label: string,
  answers: GreenhouseAiAnswer[],
): GreenhouseAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  return answers.find((item) => normalizeLabel(item.label) === normalized);
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

const clickOptionElement = (optionEl: HTMLElement): void => {
  optionEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  optionEl.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  optionEl.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, cancelable: true }),
  );
  optionEl.click();
};

interface ScannedSelectOption {
  label: string;
  element: HTMLElement;
}

const scanSelectOptionsFromDom = (
  element: HTMLInputElement,
): ScannedSelectOption[] => {
  const results: ScannedSelectOption[] = [];
  const seen = new Set<string>();

  const addOption = (optionEl: HTMLElement) => {
    const label = cleanLabelText(optionEl.textContent ?? "");
    if (!label || seen.has(label)) return;
    seen.add(label);
    results.push({ label, element: optionEl });
  };

  if (element.id) {
    const listbox = document.getElementById(
      `react-select-${element.id}-listbox`,
    );
    listbox
      ?.querySelectorAll<HTMLElement>(
        ".select__option[role='option'], [role='option']",
      )
      .forEach(addOption);
  }

  document.querySelectorAll<HTMLElement>(".select__menu").forEach((menu) => {
    if (element.id) {
      const linkedListbox = menu.querySelector(
        `#react-select-${element.id}-listbox`,
      );
      if (linkedListbox) {
        linkedListbox
          .querySelectorAll<HTMLElement>(
            ".select__option[role='option'], [role='option']",
          )
          .forEach(addOption);
        return;
      }
    }

    if (isNodeVisible(menu)) {
      menu
        .querySelectorAll<HTMLElement>(
          ".select__option[role='option'], [role='option']",
        )
        .forEach(addOption);
    }
  });

  if (results.length === 0) {
    document
      .querySelectorAll<HTMLElement>(
        `[id="react-select-${element.id}-listbox"] .select__option, .select__menu-list [role="option"], [role="listbox"] [role="option"]`,
      )
      .forEach(addOption);
  }

  return results;
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  element.focus();
  element.value = answer;
  await handleValueChanges(element);
  return true;
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  const options = Array.from(select.options).map((opt) =>
    cleanLabelText(opt.textContent ?? opt.value),
  );
  const matched = matchOption(answer, options);
  if (!matched) return false;

  for (const option of select.options) {
    const optionText = cleanLabelText(option.textContent ?? option.value);
    if (optionText === matched) {
      select.value = option.value;
      option.selected = true;
      await handleValueChanges(select);
      return true;
    }
  }

  return false;
};

const fillGreenhouseCombobox = async (
  element: HTMLInputElement,
  answer: string,
): Promise<boolean> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeCombobox();
    await delay(150);
  }

  const toggleBtn = getComboboxToggleButton(element);
  if (!toggleBtn) {
    return false;
  }

  clickToggleFlyout(toggleBtn);
  await delay(300);
  await waitForDomUpdate();

  let scanned = scanSelectOptionsFromDom(element);
  if (scanned.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    scanned = scanSelectOptionsFromDom(element);
  }

  if (scanned.length === 0) {
    closeCombobox();
    return false;
  }

  const matchedLabel = matchOption(
    answer,
    scanned.map((opt) => opt.label),
  );
  if (!matchedLabel) {
    closeCombobox();
    return false;
  }

  const target = scanned.find((opt) => opt.label === matchedLabel);
  if (!target) {
    closeCombobox();
    return false;
  }

  clickOptionElement(target.element);
  await delay(300);
  await handleValueChanges(element);

  const selectedValue = element
    .closest(".select-shell, .select")
    ?.querySelector(".select__single-value");

  return (
    element.getAttribute("aria-expanded") === "false" ||
    !!selectedValue?.textContent?.trim()
  );
};

const openItiCountryDropdown = async (): Promise<boolean> => {
  const selectedFlag =
    document.querySelector<HTMLElement>(".iti__selected-flag") ||
    document.querySelector<HTMLElement>(".iti__selected-country");
  if (!selectedFlag) return false;

  selectedFlag.click();
  await delay(250);
  return true;
};

const fillPhoneCountryCode = async (answer: string): Promise<boolean> => {
  // Prefer Greenhouse react-select country combobox inside phone input
  const greenhouseCountry = document.querySelector<HTMLInputElement>(
    ".phone-input__country input[role='combobox'], .phone-input__country .select__input, #country",
  );
  if (greenhouseCountry) {
    return fillGreenhouseCombobox(greenhouseCountry, answer);
  }

  const opened = await openItiCountryDropdown();
  if (!opened) {
    return false;
  }

  const countries = Array.from(
    document.querySelectorAll<HTMLElement>(".iti__country-list .iti__country"),
  );

  const labels = countries.map((item) => {
    const name = cleanLabelText(
      item.querySelector(".iti__country-name")?.textContent ?? "",
    );
    const dial = cleanLabelText(
      item.querySelector(".iti__dial-code")?.textContent ?? "",
    );
    return `${name} ${dial}`.trim();
  });

  const matched = matchOption(answer, labels);
  if (!matched) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    return false;
  }

  const index = labels.indexOf(matched);
  const target = countries[index];
  if (!target) return false;

  target.scrollIntoView({ block: "nearest" });
  target.click();
  await delay(200);
  return true;
};

const fillField = async (field: DomField, answer: string): Promise<boolean> => {
  if (field.kind === "phone-country") {
    return fillPhoneCountryCode(answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox" && field.element instanceof HTMLInputElement) {
    return fillGreenhouseCombobox(field.element, answer);
  }

  if (
    field.element instanceof HTMLInputElement ||
    field.element instanceof HTMLTextAreaElement
  ) {
    return fillTextLikeField(field.element, answer);
  }

  return false;
};

/**
 * Applies AI fill answers to the current Greenhouse job application form.
 */
export const autofillGreenhouseWithAi = async (
  response: unknown,
): Promise<GreenhouseAiFillResult> => {
  const answers = normalizeGreenhouseAiAnswers(response);

  if (answers.length === 0) {
    throw new Error("No fill answers found in API response");
  }

  const candidates = collectCandidateFields().map(
    (candidate): DomField => ({
      element: candidate.element,
      label: candidate.label,
      kind: candidate.kind,
    }),
  );

  let filled = 0;
  let failed = 0;
  let skipped = 0;

  for (const field of candidates) {
    const match = findAnswerForLabel(field.label, answers);
    if (!match?.answer) {
      skipped += 1;
      continue;
    }

    try {
      field.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      await delay(150);

      const ok = await fillField(field, match.answer);
      if (ok) {
        filled += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
    }

    await delay(200);
  }

  const result: GreenhouseAiFillResult = {
    total: answers.length,
    filled,
    failed,
    skipped,
  };
  return result;
};
