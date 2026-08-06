import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  WorkdayCandidateField,
  collectWorkdayCandidateFields,
  isWorkdayPrefillExcludedLabel,
} from "./scan.workday";

export interface WorkdayAiAnswer {
  label: string;
  answer: string;
  type?: string;
}

export interface WorkdayAiFillResult {
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

const EMPTY_ANSWER_TOKENS = new Set([
  "",
  "null",
  "undefined",
  "nil",
  "-",
  "--",
  "[]",
  "{}",
  "empty",
  "not provided",
  "not available",
  "no data",
  "no answer",
]);

export const isUsableWorkdayAnswer = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((v) => isUsableWorkdayAnswer(v));
  }

  if (typeof value === "object") {
    const nested =
      (value as any).answer ??
      (value as any).value ??
      (value as any).fill ??
      (value as any).text ??
      (value as any).data;
    if (nested === undefined && Object.keys(value as object).length === 0) {
      return false;
    }
    if (nested === undefined) return false;
    return isUsableWorkdayAnswer(nested);
  }

  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !EMPTY_ANSWER_TOKENS.has(trimmed.toLowerCase());
};

const coerceAnswerString = (raw: unknown): string => {
  if (!isUsableWorkdayAnswer(raw)) return "";

  if (Array.isArray(raw)) {
    return raw
      .map((v) => String(v).trim())
      .filter((v) => isUsableWorkdayAnswer(v))
      .join(", ");
  }

  if (typeof raw === "object" && raw != null) {
    const nested =
      (raw as any).answer ??
      (raw as any).value ??
      (raw as any).fill ??
      (raw as any).text ??
      (raw as any).data;
    return coerceAnswerString(nested);
  }

  return String(raw).trim();
};

const extractRawAnswer = (item: any): unknown => {
  if (item == null || typeof item !== "object") return undefined;
  if ("answer" in item) return item.answer;
  if ("value" in item) return item.value;
  if ("fill" in item) return item.fill;
  if ("text" in item) return item.text;
  if ("data" in item) return item.data;
  return undefined;
};

const isEmptyApiAnswer = (raw: unknown): boolean =>
  !isUsableWorkdayAnswer(raw);

const addLabelKey = (set: Set<string>, label: string): void => {
  const cleaned = cleanLabelText(label);
  if (!cleaned) return;
  const n = normalizeLabel(cleaned);
  if (n) set.add(n);
  const compact = cleaned
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  if (compact) set.add(compact);
};

const isFieldMarkedEmpty = (
  label: string,
  emptyLabelKeys: Set<string>,
): boolean => {
  if (emptyLabelKeys.size === 0) return false;
  const n = normalizeLabel(label);
  if (n && emptyLabelKeys.has(n)) return true;
  const compact = cleanLabelText(label)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  if (compact && emptyLabelKeys.has(compact)) return true;

  if (n && n.length >= 8) {
    for (const key of emptyLabelKeys) {
      if (key.length < 8) continue;
      if (n === key || n.includes(key) || key.includes(n)) return true;
    }
  }
  return false;
};

export interface WorkdayParsedFillResponse {
  answers: WorkdayAiAnswer[];
  emptyLabelKeys: Set<string>;
  emptyCount: number;
}

export const parseWorkdayAiFillResponse = (
  response: unknown,
): WorkdayParsedFillResponse => {
  const answers: WorkdayAiAnswer[] = [];
  const emptyLabelKeys = new Set<string>();
  let emptyCount = 0;

  if (!response) {
    return { answers, emptyLabelKeys, emptyCount };
  }

  let payload: any = response;
  if (payload?.data != null && typeof payload.data === "object") {
    payload = payload.data;
  }
  if (
    payload?.fill_data_list != null &&
    typeof payload.fill_data_list === "object"
  ) {
    payload = payload.fill_data_list;
  }

  const markEmpty = (label: string): void => {
    addLabelKey(emptyLabelKeys, label);
    emptyCount += 1;
  };

  const processItem = (item: any): void => {
    if (!item || typeof item !== "object") return;
    const label = String(item.label ?? item.field ?? item.name ?? "").trim();
    if (!label) return;

    const raw = extractRawAnswer(item);

    if (isEmptyApiAnswer(raw)) {
      markEmpty(label);
      return;
    }

    const answer = coerceAnswerString(raw);
    if (!answer) {
      markEmpty(label);
      return;
    }

    answers.push({
      label,
      answer,
      type: item.type ? String(item.type) : undefined,
    });
  };

  if (Array.isArray(payload)) {
    payload.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (Array.isArray(payload?.elements)) {
    payload.elements.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (Array.isArray(payload?.answers)) {
    payload.answers.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (Array.isArray(payload?.fields)) {
    payload.fields.forEach(processItem);
    return { answers, emptyLabelKeys, emptyCount };
  }

  if (typeof payload === "object") {
    const reserved = new Set([
      "elements",
      "answers",
      "fields",
      "fill_data_list",
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
    for (const [label, value] of Object.entries(payload)) {
      if (reserved.has(label)) continue;
      if (isEmptyApiAnswer(value)) {
        markEmpty(label);
        continue;
      }
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        !Array.isArray(value)
      ) {
        continue;
      }
      const answer = coerceAnswerString(value);
      if (!answer) {
        markEmpty(label);
        continue;
      }
      answers.push({ label, answer });
    }
  }

  return { answers, emptyLabelKeys, emptyCount };
};

export const normalizeWorkdayAiAnswers = (
  response: unknown,
): WorkdayAiAnswer[] => parseWorkdayAiFillResponse(response).answers;

/** Keep digits (phone codes like +91 need them). */
const normalizeForMatch = (text: string): string =>
  cleanLabelText(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9+]+/g, "");

const YES_ANSWERS = new Set(["yes", "y", "true", "1"]);
const NO_ANSWERS = new Set(["no", "n", "false", "0"]);

const matchOption = (answer: string, options: string[]): string | null => {
  if (!answer?.trim() || options.length === 0) return null;

  const cleanAnswer = cleanLabelText(answer);
  const normalizedAnswer = normalizeForMatch(answer);
  if (!normalizedAnswer) return null;

  for (const option of options) {
    if (cleanLabelText(option) === cleanAnswer) return option;
  }

  for (const option of options) {
    if (normalizeForMatch(option) === normalizedAnswer) return option;
  }

  const legacyAnswer = fromatStirngInLowerCase(cleanAnswer);
  if (legacyAnswer) {
    for (const option of options) {
      if (fromatStirngInLowerCase(option) === legacyAnswer) return option;
    }
  }

  if (YES_ANSWERS.has(normalizedAnswer) || YES_ANSWERS.has(legacyAnswer ?? "")) {
    const hit = options.find((o) => YES_ANSWERS.has(normalizeForMatch(o)));
    if (hit) return hit;
  }
  if (NO_ANSWERS.has(normalizedAnswer) || NO_ANSWERS.has(legacyAnswer ?? "")) {
    const hit = options.find((o) => normalizeForMatch(o) === "no");
    if (hit) return hit;
  }

  // Dial-code match: "+91" ⊂ "India (+91)"
  const dialMatch = cleanAnswer.match(/\+?\d{1,4}/);
  if (dialMatch) {
    const digit = dialMatch[0].replace(/\D/g, "");
    const hit = options.find((o) => o.replace(/\D/g, "").includes(digit));
    if (hit && digit.length >= 1) return hit;
  }

  if (normalizedAnswer.length >= 3) {
    let best: { option: string; score: number } | null = null;
    for (const option of options) {
      const n = normalizeForMatch(option);
      if (!n) continue;
      let score = 0;
      if (n === normalizedAnswer) score = 100;
      else if (n.includes(normalizedAnswer))
        score = 50 + normalizedAnswer.length;
      else if (normalizedAnswer.includes(n) && n.length >= 3)
        score = 40 + n.length;
      if (score > 0 && (!best || score > best.score)) {
        best = { option, score };
      }
    }
    if (best) return best.option;
  }

  return null;
};

const findAnswerForLabel = (
  label: string,
  answers: WorkdayAiAnswer[],
): WorkdayAiAnswer | undefined => {
  const exact = answers.find((item) => item.label === label);
  if (exact) return exact;

  const normalized = normalizeLabel(label);
  const byNorm = answers.find(
    (item) => normalizeLabel(item.label) === normalized,
  );
  if (byNorm) return byNorm;

  // Phone label aliases
  if (/country phone code|phone country code/i.test(label)) {
    const phone = answers.find((item) =>
      /country phone code|phone country code|phone code/i.test(item.label),
    );
    if (phone) return phone;
  }

  if (normalized.length >= 12) {
    const soft = answers.find((item) => {
      const n = normalizeLabel(item.label);
      if (!n || n.length < 8) return false;
      return n.includes(normalized) || normalized.includes(n);
    });
    if (soft) return soft;
  }

  return undefined;
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

const fullClick = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  const opts = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent("pointerdown", opts));
  element.dispatchEvent(new MouseEvent("mousedown", opts));
  element.dispatchEvent(new PointerEvent("pointerup", opts));
  element.dispatchEvent(new MouseEvent("mouseup", opts));
  element.dispatchEvent(new MouseEvent("click", opts));
  try {
    element.click();
  } catch {
    /* ignore */
  }
};

const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
};

const setNativeChecked = (input: HTMLInputElement, checked: boolean): void => {
  const descriptor =
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "checked",
    ) || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
  if (descriptor?.set) {
    descriptor.set.call(input, checked);
  } else {
    input.checked = checked;
  }
};

const isNodeVisible = (node: HTMLElement): boolean => {
  if (!node.isConnected) return false;
  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const getOpenOptionElements = (): HTMLElement[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="listbox"] [role="option"], [role="option"], [data-automation-id="promptOption"]',
    ),
  ).filter((opt) => {
    if (!isNodeVisible(opt)) return false;
    if (opt.closest('[data-automation-id="selectedItemList"]')) return false;
    return true;
  });

const optionLabel = (opt: HTMLElement): string => {
  const raw = cleanLabelText(
    opt.getAttribute("data-automation-label") ??
      opt.getAttribute("aria-label") ??
      opt.textContent ??
      "",
  );
  return raw
    .replace(/,?\s*press delete.*$/i, "")
    .replace(/,?\s*press enter.*$/i, "")
    .trim();
};

const fillTextLikeField = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  element.focus();
  setNativeValue(element, answer);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await handleValueChanges(element);
  return isUsableWorkdayAnswer(element.value);
};

const fillNativeSelect = async (
  select: HTMLSelectElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;
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

const fillWorkdayListbox = async (
  element: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(100);
  }

  fullClick(element);
  await delay(250);
  await waitForDomUpdate();

  // Workday country lists are long — type into any open search/filter input.
  const filterInput = document.querySelector<HTMLInputElement>(
    '[role="listbox"] input, input[placeholder*="Search" i]:not([data-uxi-multiselect-id]), [data-automation-id*="search"] input',
  );
  if (filterInput && isNodeVisible(filterInput)) {
    filterInput.focus();
    setNativeValue(filterInput, answer);
    filterInput.dispatchEvent(new Event("input", { bubbles: true }));
    await handleValueChanges(filterInput);
    await delay(350);
    await waitForDomUpdate();
  }

  let optionEls = getOpenOptionElements();
  if (optionEls.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    optionEls = getOpenOptionElements();
  }

  if (optionEls.length === 0) {
    closeListbox();
    return false;
  }

  const labels = optionEls.map(optionLabel);
  const matchedLabel = matchOption(answer, labels);
  if (!matchedLabel) {
    closeListbox();
    return false;
  }

  const target = optionEls.find((opt) => optionLabel(opt) === matchedLabel);
  if (!target) {
    closeListbox();
    return false;
  }

  fullClick(target);
  await delay(200);
  return true;
};

/**
 * Before scanning a Workday page: set Country from applicant profile, then wait
 * for the form layout to re-render (State options, local name fields, phone code).
 * Country Phone Code is auto-filled by Workday after Country changes — not set here.
 */
export const prepareWorkdayCountryBeforeScan = async (
  applicantData: { country?: string | null } | null | undefined,
): Promise<void> => {
  const country = String(applicantData?.country ?? "").trim();
  if (!country) {
    console.warn(
      "[CareerAI Workday] No applicant country — skipping country pre-fill",
    );
    return;
  }

  const countryButton =
    document.querySelector<HTMLElement>(
      'button[aria-haspopup="listbox"][name="country"], button#country--country, [data-automation-id="formField-country"] button[aria-haspopup="listbox"]',
    ) ??
    Array.from(
      document.querySelectorAll<HTMLElement>(
        'button[aria-haspopup="listbox"]',
      ),
    ).find((btn) => {
      const label = cleanLabelText(
        btn
          .closest('[data-automation-id^="formField-"]')
          ?.querySelector("label")?.textContent ??
          btn.getAttribute("aria-label") ??
          "",
      );
      return /^country$/i.test(label) || /^country\b/i.test(label);
    });

  if (!countryButton) {
    // Not on My Information (or country control missing) — nothing to prep
    return;
  }

  const currentText = cleanLabelText(
    countryButton.textContent ?? countryButton.getAttribute("aria-label") ?? "",
  ).replace(/\s+Required$/i, "");

  // Already matches applicant country — no layout change expected
  if (matchOption(country, [currentText]) || matchOption(currentText, [country])) {
    return;
  }

  const filled = await fillWorkdayListbox(countryButton, country);
  if (!filled) {
    console.warn(
      "[CareerAI Workday] Could not set Country to:",
      country,
      "(current:",
      currentText,
      ")",
    );
    return;
  }

  // Workday rewrites fields/options after country change
  await delay(3000);
};

/**
 * Workday Country Phone Code (and similar prompt multiselects).
 * Clears prior selection when needed, types to filter, then picks option.
 */
const fillWorkdayMultiselect = async (
  container: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  // If already has matching selection, accept it
  const selectedLabels = Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-automation-id="selectedItem"]',
    ),
  )
    .map(optionLabel)
    .filter(Boolean);

  if (selectedLabels.length > 0) {
    const already = matchOption(answer, selectedLabels);
    if (already) return true;

    // Clear existing pill if answer differs
    const deleteBtn = container.querySelector<HTMLElement>(
      '[data-automation-id="DELETE_charm"]',
    );
    if (deleteBtn) {
      fullClick(deleteBtn);
      await delay(150);
    }
  }

  const input =
    container.querySelector<HTMLInputElement>(
      'input[data-uxi-widget-type="selectinput"], input[id]',
    ) ?? null;
  const promptIcon = container.querySelector<HTMLElement>(
    '[data-automation-id="promptIcon"]',
  );

  if (promptIcon) {
    fullClick(promptIcon);
  } else if (input) {
    fullClick(input);
  } else {
    fullClick(container);
  }
  await delay(250);
  await waitForDomUpdate();

  // Type to filter long country lists
  if (input) {
    input.focus();
    setNativeValue(input, answer);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await handleValueChanges(input);
    await delay(300);
    await waitForDomUpdate();
  }

  let optionEls = getOpenOptionElements();
  if (optionEls.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    optionEls = getOpenOptionElements();
  }

  if (optionEls.length === 0) {
    closeListbox();
    return false;
  }

  const labels = optionEls.map(optionLabel);
  const matchedLabel = matchOption(answer, labels);
  if (!matchedLabel) {
    closeListbox();
    return false;
  }

  const target = optionEls.find((opt) => optionLabel(opt) === matchedLabel);
  if (!target) {
    closeListbox();
    return false;
  }

  fullClick(target);
  await delay(250);

  // Confirm selection via selected pill / instruction text
  const afterSelected = Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-automation-id="selectedItem"], [data-automation-id="promptOption"]',
    ),
  ).map(optionLabel);

  if (afterSelected.some((s) => matchOption(answer, [s]))) {
    return true;
  }

  // Prompt instruction sometimes holds "India (+91)"
  const instruction = container.querySelector(
    '[data-automation-id="promptAriaInstruction"]',
  )?.textContent;
  if (instruction && matchOption(answer, [cleanLabelText(instruction)])) {
    return true;
  }

  return afterSelected.length > 0 || !!matchedLabel;
};

const fillRadioGroup = async (
  container: HTMLElement,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  const radios = Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  );
  if (radios.length === 0) return false;

  const labeled = radios.map((radio) => {
    let label = "";
    if (radio.id) {
      const forLabel = document.querySelector(
        `label[for="${CSS.escape(radio.id)}"]`,
      );
      if (forLabel?.textContent) {
        label = cleanLabelText(forLabel.textContent);
      }
    }
    if (!label) {
      const sibling = radio.closest("div")?.querySelector("label");
      label = cleanLabelText(sibling?.textContent ?? "");
    }
    if (!label && radio.value === "true") label = "Yes";
    if (!label && radio.value === "false") label = "No";
    return { input: radio, label };
  });

  const labels = labeled.map((item) => item.label).filter(Boolean);
  const matched = matchOption(answer, labels);
  if (!matched) return false;

  const target = labeled.find((item) => item.label === matched);
  if (!target) return false;

  const labelEl = target.input.id
    ? document.querySelector<HTMLElement>(
        `label[for="${CSS.escape(target.input.id)}"]`,
      )
    : null;

  if (labelEl) {
    fullClick(labelEl);
  } else {
    fullClick(target.input);
  }

  if (!target.input.checked) {
    setNativeChecked(target.input, true);
    target.input.dispatchEvent(new Event("input", { bubbles: true }));
    target.input.dispatchEvent(new Event("change", { bubbles: true }));
    fullClick(target.input);
  }

  await delay(80);
  return target.input.checked || target.input.getAttribute("aria-checked") === "true";
};

const fillField = async (
  field: WorkdayCandidateField,
  answer: string,
): Promise<boolean> => {
  if (!isUsableWorkdayAnswer(answer)) return false;

  if (field.kind === "radio-group") {
    return fillRadioGroup(field.element, answer);
  }

  if (field.kind === "listbox") {
    return fillWorkdayListbox(field.element, answer);
  }

  if (field.kind === "multiselect") {
    return fillWorkdayMultiselect(field.element, answer);
  }

  if (field.kind === "select" && field.element instanceof HTMLSelectElement) {
    return fillNativeSelect(field.element, answer);
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
 * Applies AI fill answers to the current Workday job application page.
 * Re-run after "Save and Continue" for subsequent multi-step pages.
 */
export const autofillWorkdayWithAi = async (
  response: unknown,
): Promise<WorkdayAiFillResult> => {
  const { answers, emptyLabelKeys, emptyCount } =
    parseWorkdayAiFillResponse(response);
  const candidates = collectWorkdayCandidateFields();

  let filled = 0;
  let failed = 0;
  let skipped = 0;

  if (answers.length === 0 && emptyCount === 0) {
    return {
      total: 0,
      filled: 0,
      failed: 0,
      skipped: candidates.length,
    };
  }

  for (const field of candidates) {
    // Country / Country Phone Code are pre-filled or auto-filled by Workday
    if (isWorkdayPrefillExcludedLabel(field.label)) {
      skipped += 1;
      continue;
    }

    if (isFieldMarkedEmpty(field.label, emptyLabelKeys)) {
      skipped += 1;
      continue;
    }

    const match = findAnswerForLabel(field.label, answers);
    const answer = match?.answer;

    if (!isUsableWorkdayAnswer(answer)) {
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

      const ok = await fillField(field, answer as string);
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
    total: answers.length + emptyCount,
    filled,
    failed,
    skipped,
  };
};
