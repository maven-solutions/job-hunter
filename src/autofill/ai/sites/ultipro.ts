import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { delay } from "../../helper";
import { autofillUltiproWithAi } from "../autofill.ultipro";
import { initUltiproHtmlScanner } from "../cibtn.ultipro";
import {
  UltiproScanToMakeApiOptions,
  UltiproScanToMakeApiPayload,
  scanUltiproHtmlToMakeApiPayload,
} from "../scan.ultipro";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * UKG / Ultipro career hosts where AI autofill is enabled.
 * Matches recruiting.ultipro.com and tenant subdomains.
 */
const ULTIPRO_HOST_SUFFIXES = ["ultipro.com"] as const;

/** Minimum wait after the pre-fill notification before considering parse done. */
const RESUME_PARSED_MIN_WAIT_MS = 4000;

/** DOM must stay quiet this long after parse before we scan. */
const RESUME_PARSE_IDLE_MS = 3000;

/** Max extra wait for the form to stop updating after the notification. */
const RESUME_PARSE_IDLE_TIMEOUT_MS = 25000;

/** Max time to wait for the global pre-fill notification after upload. */
const RESUME_PARSE_TIMEOUT_MS = 90000;

const PREFILL_MESSAGE_RE =
  /has been used to pre-fill|pre-fill part of your application/i;

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

const findUltiproResumeFileInput = (): HTMLInputElement | null => {
  const selectors = [
    'input[type="file"][data-automation="upload-file-input"]',
    "upload-button input[type='file'][name='file']",
    "input[type='file'][name='file'][id^='FileUpload_']",
    "form[enctype='multipart/form-data'] input[type='file'][name='file']",
  ];

  for (const selector of selectors) {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (el) return el;
  }

  return null;
};

const isDisplayVisible = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return true;
};

const getGlobalNotification = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(
    "#GlobalNotificationContainer [data-automation='global-notification'], [data-automation='global-notification']",
  );

const getNotificationMessage = (alert: HTMLElement): string =>
  (alert.textContent || "").replace(/\s+/g, " ").trim();

const getNotificationSnapshot = (): string => {
  const alert = getGlobalNotification();
  if (!alert || !isDisplayVisible(alert)) return "";
  return getNotificationMessage(alert);
};

/**
 * True when UKG has finished parsing the resume and shows the pre-fill alert:
 * "{filename} has been used to pre-fill part of your application..."
 */
export const isUltiproResumeParsed = (
  fileName?: string,
  previousMessage?: string,
): boolean => {
  const alert = getGlobalNotification();
  if (!alert || !isDisplayVisible(alert)) return false;
  if (
    alert.classList.contains("alert-danger") ||
    alert.classList.contains("alert-error")
  ) {
    return false;
  }

  const message = getNotificationMessage(alert);
  if (!message) return false;
  if (previousMessage != null && message === previousMessage) return false;
  if (!PREFILL_MESSAGE_RE.test(message)) return false;

  if (fileName) {
    const lowerMessage = message.toLowerCase();
    const lowerName = fileName.toLowerCase();
    const base = fileName.replace(/\.pdf$/i, "").toLowerCase();
    if (
      (lowerName && lowerMessage.includes(lowerName)) ||
      (base && lowerMessage.includes(base))
    ) {
      return true;
    }
    // Phrase matched; filename may differ from our DataTransfer name.
  }

  return true;
};

const waitUntilUltiproResumeParsed = async (
  fileName?: string,
  previousMessage?: string,
  maxWaitMs = RESUME_PARSE_TIMEOUT_MS,
): Promise<boolean> => {
  const start = Date.now();
  const root =
    document.getElementById("GlobalNotificationContainer") || document.body;

  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      observer.disconnect();
      window.clearInterval(poll);
      resolve(ok);
    };

    const check = (): boolean => {
      if (isUltiproResumeParsed(fileName, previousMessage)) {
        finish(true);
        return true;
      }
      if (Date.now() - start >= maxWaitMs) {
        console.warn(
          "[CareerAI Ultipro] Timed out waiting for resume parse notification",
        );
        finish(false);
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
      attributeFilter: ["class", "style", "hidden"],
    });

    const poll = window.setInterval(() => {
      check();
    }, 400);

    if (check()) return;
  });
};

/** Wait until UKG stops mutating the apply form (resume parse finished filling). */
const waitForUltiproParseIdle = (
  idleMs = RESUME_PARSE_IDLE_MS,
  maxWaitMs = RESUME_PARSE_IDLE_TIMEOUT_MS,
): Promise<void> =>
  new Promise((resolve) => {
    const start = Date.now();
    let lastChange = Date.now();

    const observer = new MutationObserver(() => {
      lastChange = Date.now();
    });
    observer.observe(document.body, {
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

const notifyFileChange = (fileInput: HTMLInputElement): void => {
  fileInput.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: false }),
  );
  fileInput.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false }),
  );

  const jquery = (window as any).jQuery || (window as any).$;
  try {
    jquery?.(fileInput)?.trigger?.("change")?.trigger?.("input");
  } catch {
    // jQuery is optional — native events already fired.
  }
};

const uploadUltiproResume = async (
  applicantData: Applicant,
): Promise<string | null> => {
  if (!applicantData?.pdf_url) return null;

  const fileInput = findUltiproResumeFileInput();
  if (!fileInput) {
    console.warn("[CareerAI Ultipro] Resume file input not found");
    return null;
  }

  try {
    const designFile = await createFile(
      applicantData.pdf_url,
      applicantData.resume_title || "resume",
    );
    const dt = new DataTransfer();
    dt.items.add(designFile);

    fileInput.setAttribute("ci-aria-file-uploaded", "true");
    fileInput.files = dt.files;
    notifyFileChange(fileInput);
    return designFile.name;
  } catch (error) {
    console.error("[CareerAI Ultipro] Resume upload failed:", error);
    return null;
  }
};

/**
 * Ultipro-specific prep:
 * 1. Upload resume from applicantData.pdf_url
 * 2. Wait until the global notification says the file was used to pre-fill
 * 3. Wait until the form stops updating so parse is fully applied before scan
 */
export const prepareUltiproBeforeScan = async (
  applicantData: Applicant,
): Promise<void> => {
  const previousMessage = getNotificationSnapshot();
  const alreadyParsed = isUltiproResumeParsed();
  const fileInput = findUltiproResumeFileInput();

  if (!alreadyParsed && applicantData?.pdf_url && fileInput) {
    const fileName = await uploadUltiproResume(applicantData);
    if (fileName) {
      await waitUntilUltiproResumeParsed(fileName, previousMessage);
    }
  } else if (!alreadyParsed) {
    return;
  }

  await delay(RESUME_PARSED_MIN_WAIT_MS);
  await waitForUltiproParseIdle();
};

const buildScanPayload = async (
  options: UltiproScanToMakeApiOptions,
): Promise<UltiproScanToMakeApiPayload> => {
  const payload = await scanUltiproHtmlToMakeApiPayload(options);
  return { ...payload, source: "ultipro" };
};

const applyFill = async (
  fillData: unknown,
  _applicantData: Applicant,
): Promise<AiFillResult> => {
  // Resume already uploaded + parsed in prepareBeforeScan
  const fillResult = await autofillUltiproWithAi(fillData);

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * UKG / Ultipro AI autofill site strategy.
 * Flow: resume upload + parse notification → scan → AI API → fill.
 */
export const ultiproAiHandler: AiSiteHandler = {
  id: "ultipro",
  matches: isUltiproUrl,
  prepareBeforeScan: prepareUltiproBeforeScan,
  initFieldScanner: (applicantData, options) =>
    initUltiproHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
