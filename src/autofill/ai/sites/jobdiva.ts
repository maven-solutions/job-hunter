import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { autofillJobdivaWithAi } from "../autofill.jobdiva";
import { initJobdivaHtmlScanner } from "../cibtn.jobdiva";
import {
  scanJobdivaHtmlToMakeApiPayload,
  JobdivaScanToMakeApiOptions,
  JobdivaScanToMakeApiPayload,
} from "../scan.jobdiva";
import { AiFillResult, AiSiteHandler } from "../types";
import { EXTENSION_ROOT_ID } from "../../../utils/constant";

/**
 * JobDiva candidate portal hosts.
 * Covers www1.jobdiva.com, www2.jobdiva.com, and other *.jobdiva.com boards.
 */
const JOBDIVA_HOST_SUFFIXES = ["jobdiva.com"] as const;

export const isJobdivaUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return JOBDIVA_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return JOBDIVA_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const fieldHint = (input: HTMLInputElement): string => {
  const layout = input.closest(".jd-form-layout");
  const label = layout?.querySelector(".jd-label")?.textContent ?? "";
  return `${label} ${input.name} ${input.id} ${input.getAttribute("aria-label") ?? ""} ${input.accept}`.toLowerCase();
};

const isCoverLetterInput = (input: HTMLInputElement): boolean =>
  /cover\s*letter/.test(fieldHint(input));

const isResumeInput = (input: HTMLInputElement): boolean => {
  if (isCoverLetterInput(input)) return false;
  return /resume|curriculum|\bcv\b/.test(fieldHint(input));
};

const findJobdivaResumeFileInput = (): HTMLInputElement | null => {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      ".jd-form-layout input[type='file'], form input[type='file']",
    ),
  ).filter((input) => !input.closest(`#${EXTENSION_ROOT_ID}`));

  const labeled = inputs.find((input) => isResumeInput(input));
  if (labeled) return labeled;

  const inLayout = inputs.filter(
    (input) =>
      input.closest(".jd-form-layout") && !isCoverLetterInput(input),
  );
  if (inLayout.length === 1) return inLayout[0];
  return null;
};

const uploadJobdivaResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  const fileInput = findJobdivaResumeFileInput();
  if (!fileInput) return false;

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
    console.error("[CareerAI Jobdiva] Resume upload failed:", error);
    return false;
  }
};

const buildScanPayload = async (
  options: JobdivaScanToMakeApiOptions,
): Promise<JobdivaScanToMakeApiPayload> => {
  const payload = await scanJobdivaHtmlToMakeApiPayload(options);
  return { ...payload, source: "jobdiva" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillJobdivaWithAi(fillData, {
    password: applicantData?.password,
  });

  if (applicantData?.pdf_url) {
    await uploadJobdivaResume(applicantData);
  }

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * JobDiva AI autofill site strategy.
 * Scans the visible wizard step (`.jd-form-layout`), fills it, then uploads
 * a resume when that step has a resume file input.
 */
export const jobdivaAiHandler: AiSiteHandler = {
  id: "jobdiva",
  matches: isJobdivaUrl,
  initFieldScanner: (applicantData, options) =>
    initJobdivaHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
