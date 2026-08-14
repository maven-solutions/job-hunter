import { Applicant } from "../../data";
import { fileTypeDataFiller } from "../../FromFiller/fileTypeDataFiller";
import { autofillAshbyWithAi } from "../autofill.ashby";
import { initAshbyHtmlScanner } from "../cibtn.ashby";
import {
  scanAshbyHtmlToMakeApiPayload,
  AshbyScanToMakeApiOptions,
  AshbyScanToMakeApiPayload,
} from "../scan.ashby";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Ashby job board hosts where AI autofill is enabled.
 * Matches jobs.ashbyhq.com and subdomains (e.g. embed.jobs.ashbyhq.com).
 */
const ASHBY_HOST_SUFFIXES = ["jobs.ashbyhq.com"] as const;

export const isAshbyUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ASHBY_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return ASHBY_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const buildScanPayload = async (
  options: AshbyScanToMakeApiOptions,
): Promise<AshbyScanToMakeApiPayload> => {
  const payload = await scanAshbyHtmlToMakeApiPayload(options);
  return { ...payload, source: "ashby" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillAshbyWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume: it is not one of the scanned form
  // fields, and inflating filled masks empty API answers (e.g. LinkedIn "").
  const resumeInput = document.querySelector<HTMLInputElement>(
    "input#systemfield_resume, input#_systemfield_resume, input[type='file'][id*='resume'], input[type='file'][name*='resume'], .ashby-application-form-container input[type='file']",
  );

  if (applicantData?.pdf_url && resumeInput) {
    await fileTypeDataFiller(
      document.querySelector("body"),
      applicantData,
      false,
    );
  }

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Ashby AI autofill site strategy.
 * DOM scanning, option extraction, fill, and resume upload are Ashby-specific.
 */
export const ashbyAiHandler: AiSiteHandler = {
  id: "ashby",
  matches: isAshbyUrl,
  initFieldScanner: (applicantData, options) =>
    initAshbyHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
