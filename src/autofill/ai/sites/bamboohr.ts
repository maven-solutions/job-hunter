import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { autofillBambooHrWithAi } from "../autofill.bamboohr";
import { initBambooHrHtmlScanner } from "../cibtn.bamboohr";
import {
  BambooHrScanToMakeApiOptions,
  BambooHrScanToMakeApiPayload,
  getBambooHrFormRoot,
  scanBambooHrHtmlToMakeApiPayload,
} from "../scan.bamboohr";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * BambooHR career hosts where AI autofill is enabled.
 * Matches company.bamboohr.com (e.g. mealsonwheelsabq.bamboohr.com).
 */
const BAMBOOHR_HOST_SUFFIXES = ["bamboohr.com"] as const;

export const isBambooHrUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BAMBOOHR_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return BAMBOOHR_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const getFileUploadRoot = (element: HTMLElement): HTMLElement =>
  (element.closest("[data-fabric-component='FileUpload']") as HTMLElement) ||
  element;

const getFileUploadLabel = (element: HTMLElement): string => {
  const root = getFileUploadRoot(element);
  const flex =
    (root.closest("[data-fabric-component='Flex']") as HTMLElement | null) ||
    (root.parentElement as HTMLElement | null);
  const text =
    flex?.querySelector("[data-fabric-component='BodyText']")?.textContent ||
    "";
  return text.replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
};

const isCoverLetterUpload = (element: HTMLElement): boolean => {
  const root = getFileUploadRoot(element);
  if (
    root.querySelector(
      "input[name='coverLetterFileId'], input[name*='coverLetter' i], input[name*='cover_letter' i]",
    )
  ) {
    return true;
  }
  const label = getFileUploadLabel(element);
  return label.includes("cover letter") || label.includes("coverletter");
};

const isResumeUpload = (element: HTMLElement): boolean => {
  if (isCoverLetterUpload(element)) return false;
  const root = getFileUploadRoot(element);
  if (
    root.querySelector(
      "input[name='resumeFileId'], input[name*='resume' i]",
    )
  ) {
    return true;
  }
  const label = getFileUploadLabel(element);
  return label === "resume" || label.startsWith("resume");
};

/**
 * BambooHR often has Cover Letter + Resume file inputs that share
 * `aria-label="file-input"`. Cover Letter comes first in the DOM — never
 * treat that as the resume field.
 */
const findBambooHrResumeFileInput = (): HTMLInputElement | null => {
  const form = getBambooHrFormRoot();

  const resumeHidden = form.querySelector<HTMLInputElement>(
    "input[name='resumeFileId']",
  );
  if (resumeHidden) {
    const upload = getFileUploadRoot(resumeHidden);
    const fileInput = upload.querySelector<HTMLInputElement>(
      "input[type='file'][aria-label='file-input'], input[type='file']",
    );
    if (fileInput && !isCoverLetterUpload(fileInput)) return fileInput;
  }

  const uploads = Array.from(
    form.querySelectorAll<HTMLElement>("[data-fabric-component='FileUpload']"),
  );
  for (const upload of uploads) {
    if (!isResumeUpload(upload)) continue;
    const fileInput = upload.querySelector<HTMLInputElement>(
      "input[type='file']",
    );
    if (fileInput) return fileInput;
  }

  const fileInputs = Array.from(
    form.querySelectorAll<HTMLInputElement>(
      "input[type='file'][aria-label='file-input'], input[type='file']",
    ),
  ).filter((input) => !isCoverLetterUpload(input));

  return fileInputs.find((input) => isResumeUpload(input)) ?? null;
};

const uploadBambooHrResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  const fileInput = findBambooHrResumeFileInput();
  if (!fileInput) {
    console.warn("[CareerAI BambooHR] Resume file input not found");
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
    console.error("[CareerAI BambooHR] Resume upload failed:", error);
    return false;
  }
};

const buildScanPayload = async (
  options: BambooHrScanToMakeApiOptions,
): Promise<BambooHrScanToMakeApiPayload> => {
  const payload = await scanBambooHrHtmlToMakeApiPayload(options);
  return { ...payload, source: "bamboohr" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillBambooHrWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume: it is not one of the scanned form fields.
  if (applicantData?.pdf_url) {
    await uploadBambooHrResume(applicantData);
  }

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * BambooHR AI autofill site strategy.
 * DOM scanning, Fabric select option extraction, fill, and resume upload are site-specific.
 */
export const bamboohrAiHandler: AiSiteHandler = {
  id: "bamboohr",
  matches: isBambooHrUrl,
  initFieldScanner: (applicantData, options) =>
    initBambooHrHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
