import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { delay } from "../../helper";
import { autofillMetacareersWithAi } from "../autofill.metacareers";
import { initMetacareersHtmlScanner } from "../cibtn.metacareers";
import {
  getMetacareersFormRoot,
  scanMetacareersHtmlToMakeApiPayload,
  MetacareersScanToMakeApiOptions,
  MetacareersScanToMakeApiPayload,
} from "../scan.metacareers";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Meta Careers hosts where AI autofill is enabled.
 * Matches metacareers.com and www.metacareers.com.
 */
const METACAREERS_HOST_SUFFIXES = ["metacareers.com"] as const;

export const isMetacareersUrl = (
  url: string = window.location.href,
): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return METACAREERS_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return METACAREERS_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const findMetacareersResumeFileInput = (): HTMLInputElement | null => {
  const formRoot = getMetacareersFormRoot();
  const scoped = Array.from(
    formRoot.querySelectorAll<HTMLInputElement>("input[type='file']"),
  );
  if (scoped[0]) return scoped[0];

  const acceptPdf = document.querySelector<HTMLInputElement>(
    "input[type='file'][accept*='pdf'], input[type='file'][accept*='docx']",
  );
  if (acceptPdf) return acceptPdf;

  return document.querySelector<HTMLInputElement>("input[type='file']");
};

const clickResumeUploadTrigger = (): void => {
  const heading = Array.from(document.querySelectorAll("h2")).find((h) =>
    /resume upload/i.test(h.textContent ?? ""),
  );
  const section = heading?.parentElement?.parentElement ?? heading?.parentElement;
  if (!section) return;

  const trigger =
    section.querySelector<HTMLElement>("input[type='file']") ??
    section.querySelector<HTMLElement>("button, [role='button']");
  if (
    trigger &&
    !/remove/i.test(trigger.getAttribute("aria-label") ?? "") &&
    trigger.getAttribute("type") !== "submit"
  ) {
    trigger.click();
  }
};

const assignResumeFile = async (
  fileInput: HTMLInputElement,
  applicantData: Applicant,
): Promise<boolean> => {
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
    console.error("[CareerAI Metacareers] Resume upload failed:", error);
    return false;
  }
};

const uploadMetacareersResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  let fileInput = findMetacareersResumeFileInput();
  if (!fileInput) {
    clickResumeUploadTrigger();
    await delay(200);
    fileInput = findMetacareersResumeFileInput();
  }

  if (!fileInput) {
    console.warn("[CareerAI Metacareers] Resume file input not found");
    return false;
  }

  return assignResumeFile(fileInput, applicantData);
};

const buildScanPayload = async (
  options: MetacareersScanToMakeApiOptions,
): Promise<MetacareersScanToMakeApiPayload> => {
  const payload = await scanMetacareersHtmlToMakeApiPayload(options);
  return { ...payload, source: "metacareers" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillMetacareersWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume: it is not one of the scanned form fields.
  if (applicantData?.pdf_url) {
    await uploadMetacareersResume(applicantData);
  }

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Meta Careers AI autofill site strategy.
 * DOM scanning, option extraction, fill, and resume upload are site-specific.
 */
export const metacareersAiHandler: AiSiteHandler = {
  id: "metacareers",
  matches: isMetacareersUrl,
  initFieldScanner: (applicantData, options) =>
    initMetacareersHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
