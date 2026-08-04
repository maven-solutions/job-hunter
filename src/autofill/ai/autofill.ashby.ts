import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import { AshbyCandidateField, collectAshbyCandidateFields } from "./scan.ashby";

export interface AshbyAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface AshbyAiFillResult {
  total: number;
  filled: number;
  failed: number;
  skipped: number;
}

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeLabel = (label: string): string =>
  fromatStirngInLowerCase(cleanLabelText(label)) ?? "";

export const normalizeAshbyAiAnswers = (response: unknown): AshbyAiAnswer[] => {
  if (!response) return [];

  let payload: any = response;
  if (payload?.data != null && typeof payload.data === "object") {
    payload = payload.data;
  }

  const toAnswer = (item: any): AshbyAiAnswer | null => {
    if (!item || typeof item !== "object") return null;
    const label = String(item.label ?? item.field ?? item.name ?? "").trim();
    const raw = item.answer ?? item.value ?? item.fill ?? item.text ?? "";
    const answer = Array.isArray(raw)
      ? raw.map((v) => String(v).trim()).filter(Boolean).join(", ")
      : String(raw).trim();
    if (!label || !answer) return null;
    return {
      label,
      answer,
      type: item.type ? String(item.type) : undefined,
    };
  };

  if (Array.isArray(payload)) {
    return payload.map(toAnswer).filter(Boolean) as AshbyAiAnswer[];
  }

  if (Array.isArray(payload?.elements)) {
    return payload.elements.map(toAnswer).filter(Boolean) as AshbyAiAnswer[];
  }

  if (Array.isArray(payload?.answers)) {
    return payload.answers.map(toAnswer).filter(Boolean) as AshbyAiAnswer[];
  }

  if (Array.isArray(payload?.fields)) {
    return payload.fields.map(toAnswer).filter(Boolean) as AshbyAiAnswer[];
  }

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
    const mapped: AshbyAiAnswer[] = [];
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

/** Split multi-select AI answers (comma / pipe / JSON array / newlines). */
const parseAnswerList = (answer: string): string[] => {
  const trimmed = answer.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      // fall through to delimiter split
    }
  }

  return trimmed
    .split(/\s*[,;|]\s*|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const getChoiceOptionLabel = (input: HTMLInputElement): string => {
  const id = input.id;
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel?.textContent) {
      return cleanLabelText(forLabel.textContent);
    }
  }

  const optionWrap = input.closest("[class*='_option_']");
  const wrapLabel = optionWrap?.querySelector("label");
  if (wrapLabel?.textContent) {
    return cleanLabelText(wrapLabel.textContent);
  }

  const aria = input.getAttribute("aria-label");
  if (aria) return cleanLabelText(aria);

  if (input.name && !input.name.includes("_systemfield") && input.name.length < 120) {
    return cleanLabelText(input.name);
  }

  if (input.value) return cleanLabelText(input.value);
  return "";
};

const isAshbyYesNoStateCheckbox = (checkbox: HTMLInputElement): boolean => {
  if (checkbox.closest("[class*='_yesno_']")) return true;
  if (!checkbox.id && !checkbox.closest("[class*='_option_']")) return true;
  return false;
};

const clickChoiceControl = async (control: HTMLElement): Promise<void> => {
  control.scrollIntoView({ block: "nearest", inline: "nearest" });
  if (control instanceof HTMLInputElement) {
    // Prefer label click for custom-styled Ashby radios/checkboxes
    if (control.id) {
      const label = document.querySelector<HTMLElement>(
        `label[for="${CSS.escape(control.id)}"]`,
      );
      if (label) {
        label.click();
        await handleValueChanges(control);
        return;
      }
    }
    control.checked = true;
    control.click();
    await handleValueChanges(control);
    return;
  }

  control.click();
  await delay(80);
};

const findAnswerForLabel = (
  label: string,
  answers: AshbyAiAnswer[],
): AshbyAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  return answers.find((item) => normalizeLabel(item.label) === normalized);
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

/** Location-style combobox: pick list option, or type free-text when options aren't listed. */
const fillAshbyCombobox = async (
  element: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(100);
  }

  element.focus();
  element.click();
  await delay(200);
  await waitForDomUpdate();

  // Type into combobox when it's an input (helps filter remote options)
  if (element instanceof HTMLInputElement) {
    element.value = answer;
    await handleValueChanges(element);
    await delay(250);
    await waitForDomUpdate();
  }

  let optionEls = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[role='listbox'] [role='option'], [role='option']",
    ),
  ).filter((opt) => {
    const style = window.getComputedStyle(opt);
    return style.display !== "none" && style.visibility !== "hidden";
  });

  if (optionEls.length === 0) {
    await delay(200);
    await waitForDomUpdate();
    optionEls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[role='listbox'] [role='option'], [role='option']",
      ),
    ).filter((opt) => {
      const style = window.getComputedStyle(opt);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }

  if (optionEls.length > 0) {
    const labels = optionEls.map((opt) => cleanLabelText(opt.textContent ?? ""));
    const matchedLabel = matchOption(answer, labels);
    if (matchedLabel) {
      const target = optionEls.find(
        (opt) => cleanLabelText(opt.textContent ?? "") === matchedLabel,
      );
      if (target) {
        clickOptionElement(target);
        await delay(200);
        if (element instanceof HTMLInputElement) {
          await handleValueChanges(element);
        }
        return true;
      }
    }
  }

  // Free-text fallback (e.g. "city and country" location)
  if (element instanceof HTMLInputElement) {
    element.focus();
    element.value = answer;
    await handleValueChanges(element);
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    element.dispatchEvent(
      new KeyboardEvent("keyup", { key: "Enter", bubbles: true }),
    );
    await delay(150);
    closeListbox();
    return true;
  }

  closeListbox();
  return false;
};

/** Multi-select survey checkboxes ("select all that apply"). */
const fillCheckboxGroup = async (
  entry: HTMLElement,
  answer: string,
): Promise<boolean> => {
  const checkboxes = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  ).filter((cb) => !isAshbyYesNoStateCheckbox(cb));

  if (checkboxes.length === 0) return false;

  const labeled = checkboxes.map((cb) => ({
    input: cb,
    label: getChoiceOptionLabel(cb),
  })).filter((item) => item.label);

  if (labeled.length === 0) return false;

  const optionLabels = labeled.map((item) => item.label);
  const parts = parseAnswerList(answer);
  // Prefer multi-parts; if none matched the full string as single option
  const candidates =
    parts.length > 1
      ? parts
      : matchOption(answer, optionLabels)
        ? [matchOption(answer, optionLabels) as string]
        : parts.length === 1
          ? parts
          : [answer];

  let filledAny = false;

  for (const part of candidates) {
    const matched = matchOption(part, optionLabels);
    if (!matched) continue;
    const target = labeled.find((item) => item.label === matched);
    if (!target) continue;
    if (!target.input.checked) {
      await clickChoiceControl(target.input);
    }
    filledAny = true;
  }

  return filledAny;
};

const fillOptionGroup = async (
  entry: HTMLElement,
  answer: string,
): Promise<boolean> => {
  // Multi-select checkboxes (ethnicity, communities, etc.)
  const labeledCheckboxes = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  ).filter((cb) => !isAshbyYesNoStateCheckbox(cb) && getChoiceOptionLabel(cb));

  if (labeledCheckboxes.length > 0) {
    return fillCheckboxGroup(entry, answer);
  }

  // Native radios (diversity age/gender, etc.)
  const radios = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length > 0) {
    const labels = radios.map((radio) => getChoiceOptionLabel(radio));
    const matched = matchOption(answer, labels);
    if (!matched) return false;
    const index = labels.indexOf(matched);
    const radio = radios[index];
    if (!radio) return false;
    await clickChoiceControl(radio);
    return true;
  }

  // Button / role-based choices (Ashby Yes/No toggles)
  const buttons = Array.from(
    entry.querySelectorAll<HTMLElement>(
      "button, [role='radio'], [role='option']",
    ),
  ).filter((btn) => {
    const text = cleanLabelText(btn.textContent ?? "");
    if (!text || text.length > 80) return false;
    return !/replace|delete|remove|submit|continue|upload/i.test(text);
  });

  if (buttons.length === 0) return false;

  const labels = buttons.map((btn) => cleanLabelText(btn.textContent ?? ""));
  const matched = matchOption(answer, labels);
  if (!matched) return false;

  const target = buttons.find(
    (btn) => cleanLabelText(btn.textContent ?? "") === matched,
  );
  if (!target) return false;

  await clickChoiceControl(target);
  return true;
};

const fillField = async (
  field: AshbyCandidateField,
  answer: string,
): Promise<boolean> => {
  if (field.kind === "option-group" || field.kind === "checkbox-group") {
    return fillOptionGroup(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
  }

  if (field.kind === "combobox") {
    return fillAshbyCombobox(field.element, answer);
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
 * Applies AI fill answers to the current Ashby job application form.
 */
export const autofillAshbyWithAi = async (
  response: unknown,
): Promise<AshbyAiFillResult> => {
  const answers = normalizeAshbyAiAnswers(response);

  if (answers.length === 0) {
    throw new Error("No fill answers found in API response");
  }

  const candidates = collectAshbyCandidateFields();

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
    } catch {
      failed += 1;
    }

    await delay(200);
  }

  return {
    total: answers.length,
    filled,
    failed,
    skipped,
  };
};
