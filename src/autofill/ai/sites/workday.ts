import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import {
  autofillWorkdayWithAi,
  prepareWorkdayCountryBeforeScan,
} from "../autofill.workday";
import { initWorkdayHtmlScanner } from "../cibtn.workday";
import {
  scanWorkdayHtmlToMakeApiPayload,
  WorkdayScanToMakeApiOptions,
  WorkdayScanToMakeApiPayload,
} from "../scan.workday";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Workday job board hosts where AI autofill is enabled.
 * Matches *.myworkdayjobs.com (e.g. leidos.wd1.myworkdayjobs.com).
 */
const WORKDAY_HOST_SUFFIXES = ["myworkdayjobs.com"] as const;

export const isWorkdayUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return WORKDAY_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return WORKDAY_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const buildScanPayload = async (
  options: WorkdayScanToMakeApiOptions,
): Promise<WorkdayScanToMakeApiPayload> => {
  const payload = await scanWorkdayHtmlToMakeApiPayload(options);
  return { ...payload, source: "workday" };
};

/**
 * Workday-specific resume upload.
 * Shared fileTypeDataFiller intentionally no-ops on myworkdayjobs.com.
 */
const uploadWorkdayResume = async (
  applicantData: Applicant,
): Promise<void> => {
  if (!applicantData?.pdf_url) return;

  const fileInput = document.querySelector<HTMLInputElement>(
    'input[type="file"]',
  );
  if (!fileInput) return;

  try {
    fileInput.setAttribute("ci-aria-file-uploaded", "true");
    const designFile = await createFile(
      applicantData.pdf_url,
      applicantData.resume_title,
    );
    const dt = new DataTransfer();
    dt.items.add(designFile);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(
      new Event("change", { bubbles: true, cancelable: false }),
    );
  } catch (error) {
    console.error("[CareerAI Workday] Resume upload failed:", error);
  }
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillWorkdayWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume.
  await uploadWorkdayResume(applicantData);

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Workday AI autofill site strategy.
 * Multi-page apply flows: scan/fill only the current page; re-run after Next.
 *
 * My Information: set applicant Country first, wait for layout, then AI scan/fill
 * (Country + Country Phone Code are never AI-filled).
 */
export const workdayAiHandler: AiSiteHandler = {
  id: "workday",
  matches: isWorkdayUrl,
  prepareBeforeScan: prepareWorkdayCountryBeforeScan,
  initFieldScanner: (applicantData, options) =>
    initWorkdayHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
