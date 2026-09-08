import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { delay } from "../../helper";
import { autofillWorkableWithAi } from "../autofill.workable";
import { initWorkableHtmlScanner } from "../cibtn.workable";
import {
  scanWorkableHtmlToMakeApiPayload,
  WorkableScanToMakeApiOptions,
  WorkableScanToMakeApiPayload,
} from "../scan.workable";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Workable apply hosts where AI autofill is enabled.
 * Matches apply.workable.com and subdomains.
 */
const WORKABLE_HOST_SUFFIXES = ["apply.workable.com"] as const;

/** Extra settle after Workable finishes parsing the resume into the form. */
const RESUME_PARSED_SETTLE_MS = 800;

/** Max time to wait for Workable resume parse after upload. */
const RESUME_PARSE_TIMEOUT_MS = 90000;

const AUTOFILL_COMPLETED_RE = /autofill completed/i;

export const isWorkableUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return WORKABLE_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return WORKABLE_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const isDisplayVisible = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

/**
 * True when Workable has finished parsing the resume:
 * success alert "Autofill completed! Please review the information we have filled in below."
 */
export const isWorkableResumeParsed = (): boolean => {
  const closeBtn = document.querySelector<HTMLElement>(
    "[data-ui='close-success-alert']",
  );
  if (closeBtn && isDisplayVisible(closeBtn)) return true;

  const alerts = Array.from(
    document.querySelectorAll<HTMLElement>("[role='alert'], section"),
  );
  return alerts.some((el) => AUTOFILL_COMPLETED_RE.test(el.textContent ?? ""));
};

const getImportResumeButton = (): HTMLButtonElement | null => {
  const wrap = document.querySelector("[data-ui='autofill-button']");
  const inWrap = wrap?.querySelector<HTMLButtonElement>(
    "button[aria-haspopup='true'], button",
  );
  if (inWrap) return inWrap;

  const buttons = Array.from(document.querySelectorAll("button"));
  return (
    buttons.find((btn) =>
      /import resume from/i.test(btn.textContent ?? ""),
    ) ?? null
  );
};

/**
 * "My computer" file input lives in the Evergreen dropdown <dialog>,
 * not inside [data-ui='autofill-button'].
 */
const COMPUTER_FILE_INPUT_SELECTORS = [
  "input#file-upload",
  "input[data-ui='autofill-computer'][type='file']",
  "[data-ui='autofill-computer'] input[type='file']",
  "li[value='autofill-computer'] input[type='file']",
  "[id$='_autofill-computer'] input[type='file']",
  "dialog[data-evergreen-dialog][open] input[type='file']",
  "dialog[open] input[type='file']",
] as const;

const findWorkableResumeFileInput = (): HTMLInputElement | null => {
  for (const selector of COMPUTER_FILE_INPUT_SELECTORS) {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (el && el.type === "file") return el;
  }
  return null;
};

const isImportDropdownOpen = (): boolean =>
  findWorkableResumeFileInput() != null ||
  document.querySelector("dialog[data-evergreen-dialog][open]") != null ||
  document.querySelector("[data-ui='autofill-computer']") != null;

/** Single click — extra mousedown+click toggles Evergreen popovers closed. */
const clickImportButton = (element: HTMLElement): void => {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  element.focus();
  element.click();
};

const waitUntil = async (
  predicate: () => boolean,
  maxWaitMs: number,
  observeRoot: Element = document.body,
): Promise<boolean> => {
  const start = Date.now();

  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      observer.disconnect();
      window.clearInterval(poll);
      resolve(ok);
    };

    const check = (): boolean => {
      if (predicate()) {
        finish(true);
        return true;
      }
      if (Date.now() - start >= maxWaitMs) {
        finish(false);
        return true;
      }
      return false;
    };

    const observer = new MutationObserver(() => {
      check();
    });
    observer.observe(observeRoot, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    const poll = window.setInterval(() => {
      check();
    }, 250);

    if (check()) return;
  });
};

const waitUntilWorkableResumeParsed = async (
  maxWaitMs = RESUME_PARSE_TIMEOUT_MS,
): Promise<boolean> => {
  const ok = await waitUntil(isWorkableResumeParsed, maxWaitMs, document.body);
  if (!ok) {
    console.warn("[CareerAI Workable] Timed out waiting for resume parse");
  }
  return ok;
};

const openImportResumeDropdown = async (): Promise<boolean> => {
  if (isImportDropdownOpen()) return true;

  const importBtn = getImportResumeButton();
  if (!importBtn) {
    console.warn("[CareerAI Workable] Import resume button not found");
    return false;
  }

  clickImportButton(importBtn);
  await delay(200);

  const opened = await waitUntil(isImportDropdownOpen, 5000, document.body);
  if (opened) return true;

  clickImportButton(importBtn);
  return waitUntil(isImportDropdownOpen, 4000, document.body);
};

/**
 * Open "Import resume from" and grab the hidden "My computer" file input.
 * Do not click the label — that opens the native OS picker.
 */
const revealWorkableResumeFileInput = async (): Promise<HTMLInputElement | null> => {
  const existing = findWorkableResumeFileInput();
  if (existing) return existing;

  const opened = await openImportResumeDropdown();
  if (!opened) {
    console.warn("[CareerAI Workable] Import resume dropdown did not open");
    return null;
  }

  await waitUntil(() => findWorkableResumeFileInput() != null, 4000, document.body);
  return findWorkableResumeFileInput();
};

const assignFileToInput = (fileInput: HTMLInputElement, file: File): void => {
  const dt = new DataTransfer();
  dt.items.add(file);
  fileInput.files = dt.files;
  fileInput.setAttribute("ci-aria-file-uploaded", "true");

  fileInput.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
  fileInput.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
};

const uploadWorkableResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  const fileInput = await revealWorkableResumeFileInput();
  if (!fileInput) {
    console.warn("[CareerAI Workable] Resume file input not found");
    return false;
  }

  try {
    const designFile = await createFile(
      applicantData.pdf_url,
      applicantData.resume_title || "resume",
    );
    await delay(100);
    assignFileToInput(fileInput, designFile);

    if (!fileInput.files?.length) {
      console.warn("[CareerAI Workable] File was not attached to input");
      return false;
    }

    return true;
  } catch (error) {
    console.error("[CareerAI Workable] Resume upload failed:", error);
    return false;
  }
};

/**
 * Wait until Workable's parser has had a chance to populate profile fields
 * (firstname/email) after the success alert appears.
 */
const waitForWorkableAutofillSettle = async (): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < 8000) {
    const firstname = document.getElementById(
      "firstname",
    ) as HTMLInputElement | null;
    const email = document.getElementById("email") as HTMLInputElement | null;
    if (firstname?.value?.trim() || email?.value?.trim()) {
      await delay(RESUME_PARSED_SETTLE_MS);
      return;
    }
    await delay(200);
  }
  await delay(RESUME_PARSED_SETTLE_MS);
};

/**
 * Workable-specific prep:
 * 1. Upload resume from applicantData.pdf_url via Import resume
 * 2. Wait until Workable's built-in parser finishes ("Autofill completed!")
 * 3. Leave parsed values in place — scan only remaining empty fields
 */
export const prepareWorkableBeforeScan = async (
  applicantData: Applicant,
): Promise<void> => {
  if (isWorkableResumeParsed()) {
    await waitForWorkableAutofillSettle();
    return;
  }

  if (!applicantData?.pdf_url) {
    return;
  }

  const uploaded = await uploadWorkableResume(applicantData);
  if (!uploaded) {
    return;
  }

  const parsed = await waitUntilWorkableResumeParsed();
  if (parsed) {
    await waitForWorkableAutofillSettle();
  }
};

const buildScanPayload = async (
  options: WorkableScanToMakeApiOptions,
): Promise<WorkableScanToMakeApiPayload> => {
  const payload = await scanWorkableHtmlToMakeApiPayload(options);
  return { ...payload, source: "workable" };
};

const applyFill = async (
  fillData: unknown,
  _applicantData: Applicant,
): Promise<AiFillResult> => {
  // Resume already uploaded + parsed in prepareBeforeScan
  const fillResult = await autofillWorkableWithAi(fillData);

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Workable AI autofill site strategy.
 * Flow: resume upload + site parse → scan empty leftover fields → AI API → fill.
 */
export const workableAiHandler: AiSiteHandler = {
  id: "workable",
  matches: isWorkableUrl,
  prepareBeforeScan: prepareWorkableBeforeScan,
  initFieldScanner: (applicantData, options) =>
    initWorkableHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
