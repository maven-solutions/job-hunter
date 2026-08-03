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

  if (optionEls.length === 0) {
    closeListbox();
    return false;
  }

  const labels = optionEls.map((opt) => cleanLabelText(opt.textContent ?? ""));
  const matchedLabel = matchOption(answer, labels);
  if (!matchedLabel) {
    closeListbox();
    return false;
  }

  const target = optionEls.find(
    (opt) => cleanLabelText(opt.textContent ?? "") === matchedLabel,
  );
  if (!target) {
    closeListbox();
    return false;
  }

  clickOptionElement(target);
  await delay(200);

  if (element instanceof HTMLInputElement) {
    await handleValueChanges(element);
  }

  return true;
};

const fillOptionGroup = async (
  entry: HTMLElement,
  answer: string,
): Promise<boolean> => {
  // Native radios
  const radios = Array.from(
    entry.querySelectorAll<HTMLInputElement>("input[type='radio']"),
  );
  if (radios.length > 0) {
    const labels = radios.map((radio) => {
      const id = radio.id;
      const radioLabel = id
        ? document.querySelector(`label[for="${CSS.escape(id)}"]`)
        : null;
      return cleanLabelText(
        radioLabel?.textContent ??
          radio.value ??
          radio.getAttribute("aria-label") ??
          "",
      );
    });
    const matched = matchOption(answer, labels);
    if (!matched) return false;
    const index = labels.indexOf(matched);
    const radio = radios[index];
    if (!radio) return false;
    radio.checked = true;
    radio.click();
    await handleValueChanges(radio);
    return true;
  }

  // Button / role-based choices (Ashby Yes/No etc.)
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

  target.click();
  await delay(100);
  return true;
};

const fillField = async (
  field: AshbyCandidateField,
  answer: string,
): Promise<boolean> => {
  if (field.kind === "option-group") {
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
