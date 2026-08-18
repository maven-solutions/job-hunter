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

const findBambooHrResumeFileInput = (): HTMLInputElement | null => {
  const form = getBambooHrFormRoot();
  const selectors = [
    "[data-fabric-component='FileUpload'] input[type='file']",
    "input[aria-label='file-input']",
    "input[type='file'][name*='resume' i]",
    "input[type='file'][id*='resume' i]",
    "form#job-application-form input[type='file']",
  ];

  for (const selector of selectors) {
    const scoped = (
      selector.startsWith("form#") ? document : form
    ).querySelector<HTMLInputElement>(selector);
    if (scoped?.type === "file") return scoped;
  }

  return form.querySelector<HTMLInputElement>("input[type='file']");
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
