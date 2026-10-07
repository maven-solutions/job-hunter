import { Applicant } from "../../data";
import { BASE_URL } from "../../../config/urlconfig";
import axiosInstance from "../../../config/axiosInstance";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import {
  autofillSearchCareersWithAi,
  prepareSearchCareersBeforeScan,
} from "../autofill.searchcareers";
import { initSearchCareersHtmlScanner } from "../cibtn.searchcareers";
import {
  collectSearchCareersCandidateFields,
  getSearchCareersFieldKey,
  getSearchCareersFormRoot,
  scanSearchCareersCandidateElements,
  scanSearchCareersHtmlToMakeApiPayload,
  SearchCareersScanToMakeApiOptions,
  SearchCareersScanToMakeApiPayload,
  waitForSearchCareersFieldsToSettle,
} from "../scan.searchcareers";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * SearchCareers hosts where AI autofill is enabled.
 * Matches searchcareers.caci.com and other searchcareers.* career sites.
 */
const isSearchCareersHost = (host: string): boolean =>
  host === "searchcareers.com" ||
  host.startsWith("searchcareers.") ||
  host.endsWith(".searchcareers.com") ||
  host.includes(".searchcareers.");

export const isSearchCareersUrl = (url: string = window.location.href): boolean => {
  try {
    return isSearchCareersHost(new URL(url).hostname.toLowerCase());
  } catch {
    return url.toLowerCase().includes("searchcareers.");
  }
};

const findSearchCareersResumeFileInput = (): HTMLInputElement | null => {
  const root = getSearchCareersFormRoot();
  const scoped =
    root.querySelector<HTMLInputElement>(
      ".upload-resume-dropzone input[type='file']",
    ) ||
    root.querySelector<HTMLInputElement>(
      "[class*='upload-resume'] input[type='file'], [class*='upload-module'] input[type='file']",
    );
  if (scoped) return scoped;

  const files = Array.from(
    root.querySelectorAll<HTMLInputElement>("input[type='file']"),
  );
  return (
    files.find((input) => /pdf|doc|docx/i.test(input.accept || "")) ??
    files[0] ??
    null
  );
};

/**
 * Resume is not returned by the AI fill API — attach applicantData.pdf_url
 * to the SearchCareers dropzone file input.
 */
const uploadSearchCareersResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  const fileInput = findSearchCareersResumeFileInput();
  if (!fileInput) {
    console.warn("[CareerAI SearchCareers] Resume file input not found");
    return false;
  }
  if (fileInput.files?.length) return true;

  try {
    const designFile = await createFile(
      applicantData.pdf_url,
      applicantData.resume_title || "resume",
    );
    const transfer = new DataTransfer();
    transfer.items.add(designFile);
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event("input", { bubbles: true }));
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    return !!fileInput.files?.length;
  } catch (error) {
    console.error("[CareerAI SearchCareers] Resume upload failed:", error);
    return false;
  }
};

let scanContext: SearchCareersScanToMakeApiOptions = {};

const buildScanPayload = async (
  options: SearchCareersScanToMakeApiOptions,
): Promise<SearchCareersScanToMakeApiPayload> => {
  scanContext = options;
  const payload = await scanSearchCareersHtmlToMakeApiPayload(options);
  return { ...payload, source: "searchcareers" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const knownBeforeFill = new Set(
    collectSearchCareersCandidateFields().map((field) =>
      getSearchCareersFieldKey(field),
    ),
  );
  const fillResult = await autofillSearchCareersWithAi(fillData);

  let filled = fillResult.filled;
  let failed = fillResult.failed ?? 0;
  let skipped = fillResult.skipped ?? 0;
  let total = fillResult.total ?? knownBeforeFill.size;

  await waitForSearchCareersFieldsToSettle();
  const added = collectSearchCareersCandidateFields().filter(
    (field) => !knownBeforeFill.has(getSearchCareersFieldKey(field)),
  );
  if (added.length > 0 && scanContext.token) {
    try {
      const elements = await scanSearchCareersCandidateElements(added);
      const response = await axiosInstance.post(
        `${BASE_URL}/job-application-fill?type=individual`,
        {
          elements,
          token: scanContext.token ?? "",
          url: window.location.href,
          parser: scanContext.parser ?? "internal",
          source: "searchcareers",
          fromAgent: scanContext.fromAgent ?? false,
          resumeId: scanContext.resumeId ?? "",
          userId: scanContext.userId ?? "",
        },
      );
      const body = response?.data;
      const extra = await autofillSearchCareersWithAi(
        body?.data?.fill_data_list ?? body?.fill_data_list ?? body?.data ?? body,
      );
      total += added.length;
      filled += extra.filled;
      failed += extra.failed ?? 0;
      skipped += extra.skipped ?? 0;
    } catch (error) {
      console.error("[CareerAI SearchCareers] Follow-up fill failed:", error);
      failed += added.length;
    }
  }

  if (applicantData?.pdf_url) {
    await uploadSearchCareersResume(applicantData);
  }

  return { total, filled, failed, skipped };
};

/**
 * SearchCareers AI autofill site strategy.
 * Text inputs, Octuple dropdowns, consent checkboxes, and resume upload.
 */
export const searchcareersAiHandler: AiSiteHandler = {
  id: "searchcareers",
  matches: isSearchCareersUrl,
  prepareBeforeScan: prepareSearchCareersBeforeScan,
  initFieldScanner: (applicantData, options) =>
    initSearchCareersHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
