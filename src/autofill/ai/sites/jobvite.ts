import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { delay } from "../../helper";
import { autofillJobviteWithAi } from "../autofill.jobvite";
import { initJobviteHtmlScanner } from "../cibtn.jobvite";
import {
  getJobviteFormRoot,
  scanJobviteHtmlToMakeApiPayload,
  JobviteScanToMakeApiOptions,
  JobviteScanToMakeApiPayload,
} from "../scan.jobvite";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Jobvite apply hosts where AI autofill is enabled.
 * Matches jobs.jobvite.com and regional jobs.jobvite.* hosts.
 */
const JOBVITE_HOST_SUFFIXES = ["jobs.jobvite.com"] as const;

export const isJobviteUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (
      JOBVITE_HOST_SUFFIXES.some(
        (suffix) => host === suffix || host.endsWith(`.${suffix}`),
      )
    ) {
      return true;
    }
    return host.startsWith("jobs.") && host.includes("jobvite");
  } catch {
    const lower = url.toLowerCase();
    return (
      lower.includes("jobs.jobvite.") || /jobs\.[a-z0-9.-]*jobvite/i.test(lower)
    );
  }
};

const isCoverLetterFileInput = (input: HTMLInputElement): boolean => {
  if (input.closest(".jv-additional-files")) return true;
  const label = (
    input.getAttribute("aria-label") ||
    input.closest("[attachment-label]")?.getAttribute("attachment-label") ||
    ""
  ).toLowerCase();
  return label.includes("cover letter") || label.includes("coverletter");
};

const findJobviteResumeFileInput = (): HTMLInputElement | null => {
  const form = getJobviteFormRoot();
  const scoped =
    form.querySelector<HTMLInputElement>(
      "#attachResume input[type='file'], .jv-apply-with input[type='file']",
    ) ||
    document.querySelector<HTMLInputElement>(
      "#attachResume input[type='file'], .jv-apply-with input[type='file']",
    );
  if (scoped && !isCoverLetterFileInput(scoped)) return scoped;

  const inputs = Array.from(
    form.querySelectorAll<HTMLInputElement>("input[type='file']"),
  ).filter((input) => !isCoverLetterFileInput(input));

  return inputs[0] ?? null;
};

const clickJobviteResumeSelect = (): void => {
  const button =
    document.querySelector<HTMLButtonElement>(
      "#attachResume button[jv-add-attachment], .jv-apply-with button[jv-add-attachment]",
    ) ||
    document.querySelector<HTMLButtonElement>(
      "#attachResume button.jv-button, .jv-apply-with button.jv-button",
    );
  button?.click();
};

const waitForJobviteResumeFileInput = (
  timeoutMs = 1500,
): Promise<HTMLInputElement | null> =>
  new Promise((resolve) => {
    const existing = findJobviteResumeFileInput();
    if (existing) {
      resolve(existing);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(findJobviteResumeFileInput());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const input = findJobviteResumeFileInput();
      if (input) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(input);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

const clickDeviceMenuItem = (): boolean => {
  const items = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".jv-add-attachment a, .jv-add-attachment button, .jv-add-attachment li, [jv-add-attachment] ~ * a, [jv-add-attachment] ~ * button",
    ),
  );
  const match = items.find((el) =>
    /device|computer|upload|from file|my computer/i.test(
      el.textContent ?? "",
    ),
  );
  if (!match) return false;
  match.click();
  return true;
};

const assignFileAndNotify = async (
  fileInput: HTMLInputElement,
  applicantData: Applicant,
): Promise<boolean> => {
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

  const angular = (window as any).angular;
  if (angular?.element) {
    try {
      angular.element(fileInput).triggerHandler("change");
    } catch {
      // ignore
    }
  }

  return true;
};

/**
 * Jobvite resume uses `jv-add-attachment` (often no file input until Select
 * is opened). Best-effort: reveal the picker, then set files on the input.
 */
const uploadJobviteResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  let fileInput = findJobviteResumeFileInput();
  if (!fileInput) {
    clickJobviteResumeSelect();
    await delay(200);
    clickDeviceMenuItem();
    fileInput = await waitForJobviteResumeFileInput();
  }

  if (!fileInput) {
    console.warn("[CareerAI Jobvite] Resume file input not found");
    return false;
  }

  try {
    return await assignFileAndNotify(fileInput, applicantData);
  } catch (error) {
    console.error("[CareerAI Jobvite] Resume upload failed:", error);
    return false;
  }
};

const buildScanPayload = async (
  options: JobviteScanToMakeApiOptions,
): Promise<JobviteScanToMakeApiPayload> => {
  const payload = await scanJobviteHtmlToMakeApiPayload(options);
  return { ...payload, source: "jobvite" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillJobviteWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume: it is not one of the scanned form fields.
  if (applicantData?.pdf_url) {
    await uploadJobviteResume(applicantData);
  }

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Jobvite AI autofill site strategy.
 * DOM scanning, native select/currency fill, Angular sync, and resume upload.
 */
export const jobviteAiHandler: AiSiteHandler = {
  id: "jobvite",
  matches: isJobviteUrl,
  initFieldScanner: (applicantData, options) =>
    initJobviteHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
