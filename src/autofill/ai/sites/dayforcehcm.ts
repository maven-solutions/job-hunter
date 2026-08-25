import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { delay } from "../../helper";
import { autofillDayforceHcmWithAi } from "../autofill.dayforcehcm";
import { initDayforceHcmHtmlScanner } from "../cibtn.dayforcehcm";
import {
  DayforceHcmScanToMakeApiOptions,
  DayforceHcmScanToMakeApiPayload,
  prepareDayforceHcmEducationRecords,
  scanDayforceHcmHtmlToMakeApiPayload,
} from "../scan.dayforcehcm";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Dayforce HCM career hosts where AI autofill is enabled.
 * Matches *.dayforcehcm.com (candidate portal / jobs).
 */
const DAYFORCEHCM_HOST_SUFFIXES = ["dayforcehcm.com"] as const;

/** Minimum wait after upload before treating parse as in progress. */
const RESUME_PARSED_MIN_WAIT_MS = 1500;

/** DOM must stay quiet this long after parse before we scan. */
const RESUME_PARSE_IDLE_MS = 2000;

/** Max extra wait for the form to stop updating after parse signals. */
const RESUME_PARSE_IDLE_TIMEOUT_MS = 25000;

/** Max time to wait for Dayforce to parse the resume into personal info. */
const RESUME_PARSE_TIMEOUT_MS = 60000;

export const isDayforceHcmUrl = (
  url: string = window.location.href,
): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return DAYFORCEHCM_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return DAYFORCEHCM_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const findDayforceHcmResumeFileInput = (): HTMLInputElement | null => {
  const byId = document.querySelector<HTMLInputElement>(
    "#jobPostingApplication_files_resume",
  );
  if (byId) return byId;

  const bySection = document.querySelector<HTMLInputElement>(
    '[test-id="import-resume-section"] input[type="file"]',
  );
  if (bySection) return bySection;

  return document.querySelector<HTMLInputElement>(
    'input[type="file"][id*="resume" i], input[type="file"][accept*="pdf"]',
  );
};

const getResumeUploadWrapper = (
  fileInput: HTMLInputElement | null,
): HTMLElement | null =>
  (fileInput?.closest(".ant-upload-wrapper") as HTMLElement | null) ??
  document.querySelector<HTMLElement>('[test-id="import-resume-section"]');

const getUploadListItem = (): HTMLElement | null => {
  const wrapper = getResumeUploadWrapper(findDayforceHcmResumeFileInput());
  return (
    wrapper?.querySelector<HTMLElement>(
      ".ant-upload-list-item-done, .ant-upload-list-item:not(.ant-upload-list-item-uploading)",
    ) ??
    wrapper?.querySelector<HTMLElement>(".ant-upload-list-item") ??
    null
  );
};

const isUploadInProgress = (): boolean => {
  const wrapper = getResumeUploadWrapper(findDayforceHcmResumeFileInput());
  if (!wrapper) return false;
  return !!(
    wrapper.querySelector(".ant-upload-list-item-uploading") ||
    wrapper.querySelector(".ant-spin-spinning") ||
    document.querySelector(
      '[test-id="import-resume-section"] .ant-spin-spinning',
    )
  );
};

const isResumeAlreadyAttached = (): boolean => {
  const fileInput = findDayforceHcmResumeFileInput();
  if (fileInput?.files && fileInput.files.length > 0) return true;
  const item = getUploadListItem();
  if (!item) return false;
  return !item.classList.contains("ant-upload-list-item-uploading");
};

const getPersonalInfoParseSnapshot = (): string => {
  const ids = [
    "jobPostingApplication_personalInfo_email",
    "jobPostingApplication_personalInfo_firstName",
    "jobPostingApplication_personalInfo_lastName",
  ];
  return ids
    .map((id) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      return (el?.value ?? "").trim();
    })
    .join("|");
};

const hasPersonalInfoParsedValues = (): boolean => {
  const snapshot = getPersonalInfoParseSnapshot();
  return snapshot.replace(/\|/g, "").length > 0;
};

const notifyFileChange = (fileInput: HTMLInputElement): void => {
  fileInput.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: false }),
  );
  fileInput.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false }),
  );
};

/**
 * Dayforce rejects filenames with more than one dot
 * (e.g. "Angela G. Dillingham.pdf" → extra "." in the middle initial).
 * Strip all dots from the title; createFile appends a single ".pdf".
 */
const sanitizeDayforceHcmResumeTitle = (title: string): string => {
  const cleaned = title
    .replace(/\.+$/, "")
    .replace(/\.pdf$/i, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "resume";
};

const uploadDayforceHcmResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  const fileInput = findDayforceHcmResumeFileInput();
  if (!fileInput) {
    console.warn("[CareerAI DayforceHcm] Resume file input not found");
    return false;
  }

  try {
    const designFile = await createFile(
      applicantData.pdf_url,
      sanitizeDayforceHcmResumeTitle(applicantData.resume_title || "resume"),
    );
    const dt = new DataTransfer();
    dt.items.add(designFile);

    fileInput.setAttribute("ci-aria-file-uploaded", "true");
    try {
      fileInput.files = dt.files;
    } catch {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: dt.files,
      });
    }
    notifyFileChange(fileInput);
    return true;
  } catch (error) {
    console.error("[CareerAI DayforceHcm] Resume upload failed:", error);
    return false;
  }
};

const waitUntilDayforceHcmResumeParsed = async (
  previousSnapshot: string,
  maxWaitMs = RESUME_PARSE_TIMEOUT_MS,
): Promise<boolean> => {
  const start = Date.now();
  const root =
    document.querySelector('[test-id="personal-information"]') ||
    document.querySelector('[test-id="import-resume-section"]') ||
    document.body;

  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      observer.disconnect();
      window.clearInterval(poll);
      resolve(ok);
    };

    const check = (): boolean => {
      if (isUploadInProgress()) return false;

      const parsedValues = hasPersonalInfoParsedValues();
      const snapshotChanged =
        getPersonalInfoParseSnapshot() !== previousSnapshot && parsedValues;
      const listReady = !!getUploadListItem() && parsedValues;

      if (snapshotChanged || listReady) {
        finish(true);
        return true;
      }
      if (Date.now() - start >= maxWaitMs) {
        console.warn(
          "[CareerAI DayforceHcm] Timed out waiting for resume parse",
        );
        finish(!!getUploadListItem() || parsedValues);
        return true;
      }
      return false;
    };

    const observer = new MutationObserver(() => {
      check();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "value"],
    });

    const poll = window.setInterval(() => {
      check();
    }, 400);

    if (check()) return;
  });
};

/** Wait until Dayforce stops mutating the apply form (resume parse finished filling). */
const waitForDayforceHcmParseIdle = (
  idleMs = RESUME_PARSE_IDLE_MS,
  maxWaitMs = RESUME_PARSE_IDLE_TIMEOUT_MS,
): Promise<void> =>
  new Promise((resolve) => {
    const start = Date.now();
    let lastChange = Date.now();

    const root =
      document.querySelector('[test-id="personal-information"]') ||
      document.body;

    const observer = new MutationObserver(() => {
      lastChange = Date.now();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    const poll = window.setInterval(() => {
      const now = Date.now();
      if (now - lastChange >= idleMs || now - start >= maxWaitMs) {
        observer.disconnect();
        window.clearInterval(poll);
        resolve();
      }
    }, 250);
  });

/**
 * Dayforce-specific prep:
 * 1. Upload resume from applicantData.pdf_url
 * 2. Wait until Dayforce parses it and autofills personal info
 * 3. Wait until the form stops updating so parse is fully applied before scan
 * 4. Expand Education History records from applicantData.education
 */
export const prepareDayforceHcmBeforeScan = async (
  applicantData: Applicant,
): Promise<void> => {
  const previousSnapshot = getPersonalInfoParseSnapshot();
  const alreadyAttached = isResumeAlreadyAttached();
  const alreadyParsed = hasPersonalInfoParsedValues();
  const fileInput = findDayforceHcmResumeFileInput();

  if (!alreadyAttached && applicantData?.pdf_url && fileInput) {
    const uploaded = await uploadDayforceHcmResume(applicantData);
    if (uploaded) {
      await waitUntilDayforceHcmResumeParsed(previousSnapshot);
    }
  } else if (!alreadyParsed && alreadyAttached) {
    await waitUntilDayforceHcmResumeParsed(previousSnapshot);
  }

  if (alreadyAttached || alreadyParsed || fileInput) {
    await delay(RESUME_PARSED_MIN_WAIT_MS);
    await waitForDayforceHcmParseIdle();
  }

  await prepareDayforceHcmEducationRecords(applicantData);
};

const buildScanPayload = async (
  options: DayforceHcmScanToMakeApiOptions,
): Promise<DayforceHcmScanToMakeApiPayload> => {
  const payload = await scanDayforceHcmHtmlToMakeApiPayload(options);
  return { ...payload, source: "dayforcehcm" };
};

const applyFill = async (
  fillData: unknown,
  _applicantData: Applicant,
): Promise<AiFillResult> => {
  // Resume already uploaded + parsed in prepareBeforeScan
  const fillResult = await autofillDayforceHcmWithAi(fillData);

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Dayforce HCM AI autofill site strategy.
 * Flow: resume upload + wait for site parse → scan remaining fields → AI API → fill.
 */
export const dayforcehcmAiHandler: AiSiteHandler = {
  id: "dayforcehcm",
  matches: isDayforceHcmUrl,
  prepareBeforeScan: prepareDayforceHcmBeforeScan,
  initFieldScanner: (applicantData, options) =>
    initDayforceHcmHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
