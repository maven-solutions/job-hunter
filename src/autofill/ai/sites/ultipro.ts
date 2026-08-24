import { Applicant } from "../../data";
import { fileTypeDataFiller } from "../../FromFiller/fileTypeDataFiller";
import { autofillUltiproWithAi } from "../autofill.ultipro";
import { initUltiproHtmlScanner } from "../cibtn.ultipro";
import {
  UltiproScanToMakeApiOptions,
  UltiproScanToMakeApiPayload,
  getUltiproFormRoot,
  scanUltiproHtmlToMakeApiPayload,
} from "../scan.ultipro";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * UKG / Ultipro career hosts where AI autofill is enabled.
 * Matches recruiting.ultipro.com and tenant subdomains.
 */
const ULTIPRO_HOST_SUFFIXES = ["ultipro.com"] as const;

const isAuthPath = (url: string): boolean => {
  const lower = url.toLowerCase();
  return lower.includes("signin") || lower.includes("register");
};

export const isUltiproUrl = (url: string = window.location.href): boolean => {
  if (isAuthPath(url)) return false;

  try {
    const host = new URL(url).hostname.toLowerCase();
    return ULTIPRO_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return ULTIPRO_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const buildScanPayload = async (
  options: UltiproScanToMakeApiOptions,
): Promise<UltiproScanToMakeApiPayload> => {
  const payload = await scanUltiproHtmlToMakeApiPayload(options);
  return { ...payload, source: "ultipro" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillUltiproWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Contact Information has no file input; later sections / pages may.
  const formRoot = getUltiproFormRoot();
  const hasResumeInput = !!formRoot.querySelector('input[type="file"]');
  if (applicantData?.pdf_url && hasResumeInput) {
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
 * UKG / Ultipro AI autofill site strategy.
 * Contact Information uses native Knockout inputs/selects; later sections
 * reuse the same scan/fill path when they share that DOM.
 */
export const ultiproAiHandler: AiSiteHandler = {
  id: "ultipro",
  matches: isUltiproUrl,
  initFieldScanner: (applicantData, options) =>
    initUltiproHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
