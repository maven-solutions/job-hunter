import { Applicant } from "../../data";
import { fileTypeDataFiller } from "../../FromFiller/fileTypeDataFiller";
import { autofillAmazonWithAi } from "../autofill.amazon";
import { initAmazonHtmlScanner } from "../cibtn.amazon";
import {
  AmazonScanToMakeApiOptions,
  AmazonScanToMakeApiPayload,
  scanAmazonHtmlToMakeApiPayload,
} from "../scan.amazon";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Amazon Jobs hosts where AI autofill is enabled.
 * Matches amazon.jobs and subdomains (e.g. www.amazon.jobs).
 */
const AMAZON_HOST_SUFFIXES = ["amazon.jobs"] as const;

export const isAmazonUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return AMAZON_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return AMAZON_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const buildScanPayload = async (
  options: AmazonScanToMakeApiOptions,
): Promise<AmazonScanToMakeApiPayload> => {
  const payload = await scanAmazonHtmlToMakeApiPayload(options);
  return { ...payload, source: "amazon" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillAmazonWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data
  // when a file input exists (later application sections).
  const resumeInput = document.querySelector<HTMLInputElement>(
    "input[type='file'][id*='resume' i], input[type='file'][name*='resume' i], input[type='file']",
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
 * Amazon Jobs AI autofill site strategy.
 * Contact information is supported first; additional sections can reuse
 * the same scan/fill pipeline as their HTML is added.
 */
export const amazonAiHandler: AiSiteHandler = {
  id: "amazon",
  matches: isAmazonUrl,
  initFieldScanner: (applicantData, options) =>
    initAmazonHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
