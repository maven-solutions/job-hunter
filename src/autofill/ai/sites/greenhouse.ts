import { Applicant } from "../../data";
import { fileTypeDataFiller } from "../../FromFiller/fileTypeDataFiller";
import { autofillGreenhouseWithAi } from "../autofill.greenhouse";
import { initHtmlScanner } from "../cibtn.greenhouse";
import {
  scanHtmlToMakeApiPayload,
  ScanToMakeApiOptions,
  ScanToMakeApiPayload,
} from "../scan.greenhouse";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Greenhouse job board hosts where AI autofill is enabled.
 * Expand this list if Greenhouse adds new board domains.
 */
const GREENHOUSE_BOARD_HOST_SUFFIXES = [
  "boards.greenhouse.io",
  "job-boards.greenhouse.io",
] as const;

export const isGreenhouseBoardsUrl = (
  url: string = window.location.href,
): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return GREENHOUSE_BOARD_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return GREENHOUSE_BOARD_HOST_SUFFIXES.some((suffix) =>
      lower.includes(suffix),
    );
  }
};

const buildScanPayload = async (
  options: ScanToMakeApiOptions,
): Promise<ScanToMakeApiPayload> => {
  const payload = await scanHtmlToMakeApiPayload(options);
  // Ensure API source is stable even if detectSource is uncertain.
  return { ...payload, source: "greenhouse" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillGreenhouseWithAi(fillData);
  let filled = fillResult.filled;

  // Resume is not returned by the AI fill API — upload from local applicant data.
  if (applicantData?.pdf_url) {
    await fileTypeDataFiller(document.querySelector("body"), applicantData, false);
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
 * Greenhouse AI autofill site strategy.
 * DOM scanning, option extraction, fill, and resume upload are Greenhouse-specific.
 */
export const greenhouseAiHandler: AiSiteHandler = {
  id: "greenhouse",
  matches: isGreenhouseBoardsUrl,
  initFieldScanner: (applicantData) =>
    initHtmlScanner(applicantData as Record<string, unknown>),
  buildScanPayload,
  applyFill,
};
