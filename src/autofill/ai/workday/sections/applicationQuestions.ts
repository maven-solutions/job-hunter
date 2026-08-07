import { Applicant } from "../../../data";
import { delay } from "../../../helper";
import {
  isWorkdayApplicationQuestionsPage,
} from "../detect";
import {
  WorkdayApplySection,
  WorkdayScanElement,
  WorkdaySectionScanOptions,
} from "./types";

const LISTBOX_BUTTON_SELECTOR = 'button[aria-haspopup="listbox"]';

const cleanLabelText = (text: string): string =>
  text
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const isNodeVisible = (node: HTMLElement): boolean => {
  if (!node.isConnected) return false;
  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const getQuestionnaireRoots = (): HTMLElement[] => {
  const selectors = [
    '[data-automation-id="applyFlowPrimaryQuestionsPage"]',
    '[data-automation-id="applyFlowSecondaryQuestionsPage"]',
    '[data-automation-id="applyFlowQuestionnairePage"]',
    '[data-fkit-id*="primaryQuestionnaire"]',
    '[data-fkit-id*="secondaryQuestionnaire"]',
    '[aria-labelledby="primaryQuestionnaire-section"]',
    '[aria-labelledby="secondaryQuestionnaire-section"]',
  ];

  const roots = Array.from(
    document.querySelectorAll<HTMLElement>(selectors.join(", ")),
  );
  if (roots.length > 0) return roots;

  // Fallback: page content under apply flow when heading is Application Questions
  const page = document.querySelector<HTMLElement>(
    '[data-automation-id="applyFlowPage"] .css-1j489tx, [data-automation-id="applyFlowPage"]',
  );
  return page ? [page] : [document.body];
};

/**
 * Human-readable question text from Workday rich-text legends.
 * aria-label on the control is often just "Select One Required".
 */
export const getQuestionnaireQuestionLabel = (
  control: HTMLElement,
): string => {
  const fieldset = control.closest("fieldset");
  const formField = control.closest(
    '[data-automation-id^="formField-"]',
  ) as HTMLElement | null;

  const rich =
    fieldset?.querySelector('[data-automation-id="richText"]') ||
    formField?.querySelector('[data-automation-id="richText"]');

  if (rich?.textContent) {
    return cleanLabelText(rich.textContent);
  }

  const legend = fieldset?.querySelector("legend");
  if (legend?.textContent) {
    return cleanLabelText(legend.textContent);
  }

  const aria = control.getAttribute("aria-label");
  if (aria && !/select one/i.test(aria)) {
    return cleanLabelText(aria.replace(/\s+Required$/i, ""));
  }

  return (
    control.getAttribute("id") ||
    control.getAttribute("name") ||
    "Unknown question"
  );
};

export const isQuestionnaireRequired = (control: HTMLElement): boolean => {
  const fieldset = control.closest("fieldset");
  const formField = control.closest('[data-automation-id^="formField-"]');
  if (
    fieldset?.querySelector(
      'abbr.requiredAsterisk, abbr[title="required"], .requiredAsterisk',
    ) ||
    formField?.querySelector(
      'abbr.requiredAsterisk, abbr[title="required"], .requiredAsterisk',
    )
  ) {
    return true;
  }
  if (
    control.getAttribute("aria-required") === "true" ||
    /\brequired\b/i.test(control.getAttribute("aria-label") ?? "")
  ) {
    return true;
  }
  const text = fieldset?.textContent ?? formField?.textContent ?? "";
  return /required/i.test(text) && !!fieldset?.querySelector("abbr");
};

const scanOpenListboxOptions = (): string[] => {
  const results: string[] = [];
  const seen = new Set<string>();

  document
    .querySelectorAll<HTMLElement>(
      '[role="listbox"] [role="option"], [role="option"]',
    )
    .forEach((opt) => {
      if (!isNodeVisible(opt)) return;
      if (opt.closest('[data-automation-id="selectedItemList"]')) return;
      const label = cleanLabelText(
        opt.getAttribute("data-automation-label") ??
          opt.getAttribute("aria-label") ??
          opt.textContent ??
          "",
      )
        .replace(/,?\s*press delete.*$/i, "")
        .replace(/,?\s*press enter.*$/i, "")
        .trim();
      if (!label || seen.has(label) || /^select one$/i.test(label)) return;
      seen.add(label);
      results.push(label);
    });

  return results;
};

const openAndScanListboxOptions = async (
  element: HTMLElement,
): Promise<string[]> => {
  if (element.getAttribute("aria-expanded") === "true") {
    closeListbox();
    await delay(100);
  }

  element.focus();
  element.click();
  await delay(280);
  await waitForDomUpdate();

  let options = scanOpenListboxOptions();
  if (options.length === 0) {
    await delay(250);
    await waitForDomUpdate();
    options = scanOpenListboxOptions();
  }

  closeListbox();
  await delay(100);
  return options;
};

export interface ApplicationQuestionField {
  element: HTMLElement;
  label: string;
  required: boolean;
  kind: "listbox" | "text" | "textarea" | "radio-group" | "checkbox";
  options?: string[];
}

/**
 * Collect all autofillable Application Questions controls on the current page.
 */
export const collectApplicationQuestionFields =
  (): ApplicationQuestionField[] => {
    const results: ApplicationQuestionField[] = [];
    const seen = new Set<string>();
    const roots = getQuestionnaireRoots();

    for (const root of roots) {
      // Listbox / Select One questions (dominant on this page)
      root
        .querySelectorAll<HTMLButtonElement>(LISTBOX_BUTTON_SELECTOR)
        .forEach((button) => {
          const id =
            button.getAttribute("id") ||
            button.getAttribute("name") ||
            `q-${results.length}`;
          if (seen.has(id)) return;
          seen.add(id);

          const label = getQuestionnaireQuestionLabel(button);
          if (!label || label === "Unknown question") return;

          results.push({
            element: button,
            label,
            required: isQuestionnaireRequired(button),
            kind: "listbox",
          });
        });

      // Free-text answers if present (skip companion listbox store inputs)
      root
        .querySelectorAll<HTMLElement>("textarea, input[type='text']")
        .forEach((el) => {
          if (el.closest(LISTBOX_BUTTON_SELECTOR)) return;
          if (el.parentElement?.querySelector(LISTBOX_BUTTON_SELECTOR)) return;
          // Any listbox in the same form field → store/search companion, not a real answer
          if (
            el
              .closest('[data-automation-id^="formField-"]')
              ?.querySelector(LISTBOX_BUTTON_SELECTOR)
          ) {
            return;
          }
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") return;

          const id =
            el.getAttribute("id") ||
            el.getAttribute("name") ||
            `text-${results.length}`;
          if (seen.has(id)) return;
          seen.add(id);

          const label = getQuestionnaireQuestionLabel(el);
          results.push({
            element: el,
            label,
            required: isQuestionnaireRequired(el),
            kind: el instanceof HTMLTextAreaElement ? "textarea" : "text",
          });
        });
    }

    return results;
  };

/**
 * Build API payload elements for Application Questions.
 * type "search" + options[] so AI can pick Yes/No/etc.
 */
export const buildApplicationQuestionsScanElements = async (
  _options?: WorkdaySectionScanOptions,
): Promise<WorkdayScanElement[]> => {
  const fields = collectApplicationQuestionFields();
  const elements: WorkdayScanElement[] = [];

  for (const field of fields) {
    if (field.kind === "listbox") {
      const options = await openAndScanListboxOptions(field.element);
      elements.push({
        label: field.label,
        required: field.required,
        type: "search",
        ...(options.length > 0 ? { options } : {}),
      });
      continue;
    }

    elements.push({
      label: field.label,
      required: field.required,
      type: "text",
    });
  }

  return elements;
};

export const applicationQuestionsSection: WorkdayApplySection = {
  id: "applicationQuestions",
  matches: isWorkdayApplicationQuestionsPage,
  prepareBeforeScan: async (_applicantData: Applicant) => {
    // No pre-fill required for questionnaire listboxes
  },
  buildScanElements: buildApplicationQuestionsScanElements,
};
