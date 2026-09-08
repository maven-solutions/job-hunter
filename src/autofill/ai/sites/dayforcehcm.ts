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
const RESUME_PARSED_MIN_WAIT_MS = 2500;

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

/** Resume import finished: Dayforce shows the file chip with ant-upload-list-item-done. */
const getParsedResumeListItem = (): HTMLElement | null => {
  const byTestId = document.querySelector<HTMLElement>(
    '[test-id="upload-file-item-test"] .ant-upload-list-item-done',
  );
  if (byTestId) return byTestId;

  const wrapper = getResumeUploadWrapper(findDayforceHcmResumeFileInput());
  return (
    wrapper?.querySelector<HTMLElement>(
      ".ant-upload-list-item.ant-upload-list-item-done",
    ) ?? null
  );
};

const isUploadInProgress = (): boolean => {
  const wrapper = getResumeUploadWrapper(findDayforceHcmResumeFileInput());
  const section = document.querySelector<HTMLElement>(
    '[test-id="import-resume-section"]',
  );
  const root = wrapper ?? section;
  if (!root) return false;
  return !!(
    root.querySelector(".ant-upload-list-item-uploading") ||
    root.querySelector(".ant-spin-spinning")
  );
};

const isResumeListedAsDone = (): boolean =>
  !!getParsedResumeListItem() && !isUploadInProgress();

const isResumeAlreadyAttached = (): boolean => isResumeListedAsDone();

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

const getResumeParseWatchRoots = (): HTMLElement[] => {
  const selectors = [
    '[test-id="import-resume-section"]',
    '[test-id="personal-information"]',
    '[test-id="work-history"]',
    '[test-id="education-history"]',
  ];
  const roots = selectors
    .map((selector) => document.querySelector<HTMLElement>(selector))
    .filter((el): el is HTMLElement => !!el);
  return roots.length > 0 ? roots : [document.body];
};

const observeResumeParseRoots = (
  observer: MutationObserver,
  options: MutationObserverInit,
): void => {
  for (const root of getResumeParseWatchRoots()) {
    observer.observe(root, options);
  }
};

/**
 * Wait until Dayforce lists the imported resume as done
 * (`[test-id="upload-file-item-test"] .ant-upload-list-item-done`).
 */
const waitUntilDayforceHcmResumeListed = async (
  maxWaitMs = RESUME_PARSE_TIMEOUT_MS,
): Promise<boolean> => {
  const start = Date.now();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearInterval(poll);
      resolve(ok);
    };

    const check = (): boolean => {
      if (isUploadInProgress()) return false;
      if (isResumeListedAsDone()) {
        finish(true);
        return true;
      }
      if (Date.now() - start >= maxWaitMs) {
        console.warn(
          "[CareerAI DayforceHcm] Timed out waiting for resume import",
        );
        finish(isResumeListedAsDone());
        return true;
      }
      return false;
    };

    const observer = new MutationObserver(() => {
      check();
    });
    observeResumeParseRoots(observer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    const poll = window.setInterval(() => {
      check();
    }, 400);

    if (check()) return;
  });
};

/**
 * After the file chip appears, wait until Dayforce finishes auto-filling
 * parsed values (personal info, work history, etc.).
 */
const waitUntilDayforceHcmResumeAutoFilled = async (
  previousSnapshot: string,
  maxWaitMs = RESUME_PARSE_TIMEOUT_MS,
): Promise<boolean> => {
  const start = Date.now();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearInterval(poll);
      resolve(ok);
    };

    const check = (): boolean => {
      if (isUploadInProgress()) return false;

      const parsedValues = hasPersonalInfoParsedValues();
      const snapshotChanged =
        getPersonalInfoParseSnapshot() !== previousSnapshot && parsedValues;
      const listedAndParsed = isResumeListedAsDone() && parsedValues;

      if (snapshotChanged || listedAndParsed) {
        finish(true);
        return true;
      }
      if (Date.now() - start >= maxWaitMs) {
        console.warn(
          "[CareerAI DayforceHcm] Timed out waiting for resume auto-fill",
        );
        finish(parsedValues || isResumeListedAsDone());
        return true;
      }
      return false;
    };

    const observer = new MutationObserver(() => {
      check();
    });
    observeResumeParseRoots(observer, {
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

    const observer = new MutationObserver(() => {
      lastChange = Date.now();
    });
    observeResumeParseRoots(observer, {
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
 * 2. Wait until the import chip is done (`upload-file-item-test`)
 * 3. Wait until Dayforce parses the resume and auto-fills the form
 * 4. Wait until the form stops updating (including Work History)
 * 5. Expand Education History records from applicantData.education
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
      await waitUntilDayforceHcmResumeListed();
      await waitUntilDayforceHcmResumeAutoFilled(previousSnapshot);
    }
  } else if (alreadyAttached && !alreadyParsed) {
    await waitUntilDayforceHcmResumeAutoFilled(previousSnapshot);
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
