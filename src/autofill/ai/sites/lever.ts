import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { delay, handleValueChanges } from "../../helper";
import { autofillLeverWithAi } from "../autofill.lever";
import { initLeverHtmlScanner } from "../cibtn.lever";
import {
  getLeverFormRoot,
  scanLeverHtmlToMakeApiPayload,
  LeverScanToMakeApiOptions,
  LeverScanToMakeApiPayload,
} from "../scan.lever";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Lever job board hosts where AI autofill is enabled.
 * Matches jobs.lever.co and regional hosts (e.g. jobs.eu.lever.co).
 */
const LEVER_HOST_SUFFIXES = ["jobs.lever.co"] as const;

/** Extra settle after Lever finishes parsing the resume (pre-fills profile fields). */
const RESUME_PARSED_SETTLE_MS = 500;

/** Max time to wait for Lever resume parse after upload. */
const RESUME_PARSE_TIMEOUT_MS = 90000;

export const isLeverUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (
      LEVER_HOST_SUFFIXES.some(
        (suffix) => host === suffix || host.endsWith(`.${suffix}`),
      )
    ) {
      return true;
    }
    return host.endsWith(".lever.co") && host.startsWith("jobs.");
  } catch {
    const lower = url.toLowerCase();
    return (
      lower.includes("jobs.lever.co") || /jobs\.[a-z0-9-]+\.lever\.co/i.test(lower)
    );
  }
};

const findLeverResumeFileInput = (): HTMLInputElement | null => {
  const byId = document.getElementById(
    "resume-upload-input",
  ) as HTMLInputElement | null;
  if (byId?.type === "file") return byId;

  const selectors = [
    "input[data-qa='input-resume']",
    "input[name='resume'][type='file']",
    ".application-question.resume input[type='file']",
    "#application-form input[type='file']",
  ];

  for (const selector of selectors) {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (el) return el;
  }

  return null;
};

const isDisplayVisible = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

/**
 * True when Lever has finished parsing the resume:
 * - `.resume-upload-success` is visible ("Success!")
 * - upload control has `.has-file` / a filename
 * - working spinner is not visible
 */
export const isLeverResumeParsed = (): boolean => {
  const working = document.querySelector<HTMLElement>(".resume-upload-working");
  if (isDisplayVisible(working)) return false;

  const success = document.querySelector<HTMLElement>(".resume-upload-success");
  if (isDisplayVisible(success)) return true;

  const uploadLink = document.querySelector(".visible-resume-upload");
  if (uploadLink?.classList.contains("has-file")) return true;

  const filename = document.querySelector(
    ".visible-resume-upload .filename",
  )?.textContent;
  return !!filename?.trim();
};

const isLeverResumeParseFailed = (): boolean =>
  isDisplayVisible(
    document.querySelector<HTMLElement>(".resume-upload-failure"),
  );

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

/**
 * Lever auto-fills name/email/phone/location/etc. after resume parse.
 * Clear those values so the AI scan sees empty fields.
 */
const clearLeverResumeAutofilledFields = async (): Promise<void> => {
  const form = getLeverFormRoot();
  const fields = form.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >(
    "input[type='text'], input[type='email'], input[type='tel'], input[type='url'], input:not([type]), textarea",
  );

  for (const field of Array.from(fields)) {
    if (
      field instanceof HTMLInputElement &&
      (field.type === "hidden" || field.type === "file")
    ) {
      continue;
    }
    if (!field.value) continue;

    field.focus();
    setNativeValue(field, "");
    await handleValueChanges(field);
  }

  const selectedLocation = document.getElementById(
    "selected-location",
  ) as HTMLInputElement | null;
  if (selectedLocation) {
    selectedLocation.value = "";
  }
};

const waitUntilLeverResumeParsed = async (
  maxWaitMs = RESUME_PARSE_TIMEOUT_MS,
): Promise<boolean> => {
  const start = Date.now();
  const resumeQuestion =
    document.querySelector(".application-question.resume") ||
    document.getElementById("application-form") ||
    document.body;

  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      observer.disconnect();
      window.clearInterval(poll);
      resolve(ok);
    };

    const check = (): boolean => {
      if (isLeverResumeParsed()) {
        finish(true);
        return true;
      }
      if (isLeverResumeParseFailed()) {
        console.warn("[CareerAI Lever] Resume parse failed");
        finish(false);
        return true;
      }
      if (Date.now() - start >= maxWaitMs) {
        console.warn("[CareerAI Lever] Timed out waiting for resume parse");
        finish(false);
        return true;
      }
      return false;
    };

    const observer = new MutationObserver(() => {
      check();
    });
    observer.observe(resumeQuestion, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    const poll = window.setInterval(() => {
      check();
    }, 300);

    if (check()) return;
  });
};

const uploadLeverResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  const fileInput = findLeverResumeFileInput();
  if (!fileInput) {
    console.warn("[CareerAI Lever] Resume file input not found");
    return false;
  }

  try {
    const designFile = await createFile(
      applicantData.pdf_url,
      applicantData.resume_title || "resume",
    );
    const dt = new DataTransfer();
    dt.items.add(designFile);

    fileInput.setAttribute("ci-aria-file-uploaded", "true");
    fileInput.files = dt.files;
    fileInput.dispatchEvent(
      new Event("change", { bubbles: true, cancelable: false }),
    );
    fileInput.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: false }),
    );
    return true;
  } catch (error) {
    console.error("[CareerAI Lever] Resume upload failed:", error);
    return false;
  }
};

/**
 * Lever-specific prep:
 * 1. Upload resume from applicantData.pdf_url
 * 2. Wait until Lever finishes parsing (Success! / has-file)
 * 3. Clear auto-filled inputs so the scan payload is empty
 */
export const prepareLeverBeforeScan = async (
  applicantData: Applicant,
): Promise<void> => {
  if (isLeverResumeParsed()) {
    await delay(RESUME_PARSED_SETTLE_MS);
    await clearLeverResumeAutofilledFields();
    return;
  }

  if (!applicantData?.pdf_url) {
    return;
  }

  const uploaded = await uploadLeverResume(applicantData);
  if (!uploaded) {
    return;
  }

  const parsed = await waitUntilLeverResumeParsed();
  if (parsed) {
    await delay(RESUME_PARSED_SETTLE_MS);
  }

  await clearLeverResumeAutofilledFields();
};

const buildScanPayload = async (
  options: LeverScanToMakeApiOptions,
): Promise<LeverScanToMakeApiPayload> => {
  const payload = await scanLeverHtmlToMakeApiPayload(options);
  return { ...payload, source: "lever" };
};

const applyFill = async (
  fillData: unknown,
  _applicantData: Applicant,
): Promise<AiFillResult> => {
  // Resume already uploaded + parsed in prepareBeforeScan
  const fillResult = await autofillLeverWithAi(fillData);

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Lever AI autofill site strategy.
 * Flow: resume upload+parse → clear parsed fields → scan → AI API → fill.
 */
export const leverAiHandler: AiSiteHandler = {
  id: "lever",
  matches: isLeverUrl,
  prepareBeforeScan: prepareLeverBeforeScan,
  initFieldScanner: (applicantData, options) =>
    initLeverHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
