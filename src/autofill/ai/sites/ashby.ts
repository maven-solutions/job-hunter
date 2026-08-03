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
  let filled = fillResult.filled;

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // fileTypeDataFiller already has Ashby-specific file input selection.
  const resumeInput = document.querySelector<HTMLInputElement>(
    "input#systemfield_resume, input#_systemfield_resume, input[type='file'][id*='resume'], input[type='file'][name*='resume'], .ashby-application-form-container input[type='file']",
  );

  if (applicantData?.pdf_url && resumeInput) {
    await fileTypeDataFiller(
      document.querySelector("body"),
      applicantData,
      false,
    );
    filled += 1;
  }

  return {
    total: fillResult.total,
    filled,
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
  initFieldScanner: (applicantData) =>
    initAshbyHtmlScanner(applicantData as Record<string, unknown>),
  buildScanPayload,
  applyFill,
};
