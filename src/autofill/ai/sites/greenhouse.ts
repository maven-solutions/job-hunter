import { Applicant } from "../../data";
import { fileTypeDataFiller } from "../../FromFiller/fileTypeDataFiller";
import { autofillGreenhouseWithAi } from "../autofill.greenhouse";
import { initGreenhouseHtmlScanner } from "../cibtn.greenhouse";
import {
  scanGreenhouseHtmlToMakeApiPayload,
  GreenhouseScanToMakeApiOptions,
  GreenhouseScanToMakeApiPayload,
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
  options: GreenhouseScanToMakeApiOptions,
): Promise<GreenhouseScanToMakeApiPayload> => {
  const payload = await scanGreenhouseHtmlToMakeApiPayload(options);
  // Ensure API source is stable even if detectSource is uncertain.
  return { ...payload, source: "greenhouse" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillGreenhouseWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume: it is not one of the scanned form
  // fields, and inflating filled masks empty API answers (e.g. LinkedIn "").
  if (applicantData?.pdf_url) {
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
 * Greenhouse AI autofill site strategy.
 * DOM scanning, option extraction, fill, and resume upload are Greenhouse-specific.
 */
export const greenhouseAiHandler: AiSiteHandler = {
  id: "greenhouse",
  matches: isGreenhouseBoardsUrl,
  initFieldScanner: (applicantData, options) =>
    initGreenhouseHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
