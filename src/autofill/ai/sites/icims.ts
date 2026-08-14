import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { delay } from "../../helper";
import { autofillIcimsWithAi } from "../autofill.icims";
import { initIcimsHtmlScanner } from "../cibtn.icims";
import {
  getIcimsFormContext,
  getIcimsFormDocument,
  scanIcimsHtmlToMakeApiPayload,
  IcimsScanToMakeApiOptions,
  IcimsScanToMakeApiPayload,
} from "../scan.icims";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * iCIMS career portal hosts where AI autofill is enabled.
 * Matches *.icims.com (e.g. careers-ruralking.icims.com).
 * Form fields live in `#icims_content_iframe` on the parent page.
 */
const ICIMS_HOST_SUFFIXES = ["icims.com"] as const;

/** Extra settle after iCIMS finishes parsing the resume (pre-fills profile fields). */
const RESUME_PARSED_SETTLE_MS = 2000;

/** Max time to wait for iCIMS resume parse after upload/submit. */
const RESUME_PARSE_TIMEOUT_MS = 90000;

export const isIcimsUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ICIMS_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return ICIMS_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const findIcimsResumeFileInput = (
  doc: Document = getIcimsFormDocument(),
): HTMLInputElement | null => {
  const byId = doc.getElementById(
    "PortalProfileFields.Resume_File",
  ) as HTMLInputElement | null;
  if (byId?.type === "file") return byId;

  const selectors = [
    "input[type='file'][id*='Resume_File']",
    "input[type='file'][name*='Resume_File']",
    "input[type='file'][id*='Resume']",
    "input[type='file'][name*='Resume']",
    ".iCIMS_Resume input[type='file']",
    "#profileForm input[type='file']",
  ];

  for (const selector of selectors) {
    const el = doc.querySelector<HTMLInputElement>(selector);
    if (el) return el;
  }

  return doc.querySelector<HTMLInputElement>(
    ".iCIMS_MainWrapper input[type='file']",
  );
};

/**
 * True when iCIMS has finished parsing the resume and shows the uploaded file UI:
 * - Resume_FileName has a value
 * - Current file label is visible (not iCIMS_NoDisplay)
 * - Loading spinner is hidden
 */
const isIcimsResumeParsed = (doc: Document | null): boolean => {
  if (!doc) return false;

  const loading = doc.getElementById("PortalProfileFields.Resume_Loading");
  if (loading && !loading.classList.contains("iCIMS_NoDisplay")) {
    return false; // still showing "Parsing resume, please wait..."
  }

  const fileNameInput = doc.getElementById(
    "PortalProfileFields.Resume_FileName",
  ) as HTMLInputElement | null;
  if (fileNameInput?.value?.trim()) {
    return true;
  }

  const fileNameLabel = doc.getElementById(
    "PortalProfileFields.Resume_FileNameLabel",
  );
  if (
    fileNameLabel &&
    !fileNameLabel.classList.contains("iCIMS_NoDisplay") &&
    fileNameLabel.textContent?.trim()
  ) {
    return true;
  }

  // Replace Resume button visible ⇒ file is attached
  const deleteSpan = doc.getElementById(
    "PortalProfileFields.Resume_DeleteButtonSpan",
  );
  if (deleteSpan && !deleteSpan.classList.contains("iCIMS_NoDisplay")) {
    return true;
  }

  return false;
};

/**
 * Wait until the content iframe document is readable (same-origin).
 */
const waitForIcimsIframeReady = async (
  maxWaitMs = 15000,
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const { doc, iframe } = getIcimsFormContext();
    if (
      doc?.body &&
      doc.querySelector(
        "#profileForm, .iCIMS_MainWrapper, .iCIMS_ProfileFormTable",
      )
    ) {
      return true;
    }
    if (!iframe && !document.getElementById("icims_content_iframe")) {
      await delay(200);
      return !!getIcimsFormDocument().body;
    }
    await delay(200);
  }
  return false;
};

/**
 * Poll until iCIMS shows the parsed-resume UI (or timeout).
 * Re-reads iframe document each tick because uploadResume submit reloads it.
 */
const waitUntilIcimsResumeParsed = async (
  maxWaitMs = RESUME_PARSE_TIMEOUT_MS,
): Promise<boolean> => {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await waitForIcimsIframeReady(3000);
    const { doc } = getIcimsFormContext();
    if (isIcimsResumeParsed(doc)) {
      return true;
    }
    await delay(300);
  }

  console.warn(
    "[CareerAI iCIMS] Timed out waiting for resume parse to finish",
  );
  return false;
};

/**
 * Upload resume and let iCIMS submit/parse it (uploadResume=1).
 * The submit reloads only the content iframe; CareerAI on the parent keeps running.
 */
const uploadIcimsResumeAndSubmitForParse = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;

  const { doc, win } = getIcimsFormContext();
  const fileInput = findIcimsResumeFileInput(doc);
  if (!fileInput) {
    console.warn(
      "[CareerAI iCIMS] Resume file input not found (checked iframe + top doc)",
    );
    return false;
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

    const fieldId =
      fileInput.id?.replace(/_File$/, "") || "PortalProfileFields.Resume";

    // Mark file on iCIMS field (same as native onchange first step)
    const setFileFn = (win as any).icims_setFileFieldValue as
      | ((
          fieldId: string,
          fileValue: string,
          url: string,
          thumb: string,
          isImage: boolean,
          source: string,
        ) => void)
      | undefined;

    if (typeof setFileFn === "function") {
      try {
        setFileFn(fieldId, designFile.name, "", "", false, "local");
      } catch (err) {
        console.warn("[CareerAI iCIMS] icims_setFileFieldValue failed:", err);
      }
    }

    // Submit like native onchange: append uploadResume=1 and form.submit()
    // so the server parses the resume and returns the CurrentFile UI.
    const form =
      fileInput.form ||
      (doc.getElementById("profileForm") as HTMLFormElement | null) ||
      doc.querySelector<HTMLFormElement>("form");

    if (!form) {
      console.warn("[CareerAI iCIMS] profileForm not found for resume submit");
      // Fall back to native change (includes submit when onchange is intact)
      fileInput.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false }),
      );
      return true;
    }

    try {
      (win as any).pageDirtyFlag = true;
      win.onbeforeunload = null;
      if (win.document?.body) {
        (win.document.body as any).onbeforeunload = null;
      }
    } catch {
      /* ignore */
    }

    const action = form.getAttribute("action") || form.action || "";
    if (!/[?&]uploadResume=1(?:&|$)/.test(action)) {
      form.action =
        action + (action.includes("?") ? "&" : "?") + "uploadResume=1";
    }

    form.submit();
    return true;
  } catch (error) {
    console.error("[CareerAI iCIMS] Resume upload/submit failed:", error);
    return false;
  }
};

/**
 * iCIMS-specific prep:
 * 1. Wait for iframe
 * 2. Upload resume (form submit so iCIMS parses it)
 * 3. Wait until parsed resume UI appears
 * 4. Wait 2s more, then scan
 */
export const prepareIcimsBeforeScan = async (
  applicantData: Applicant,
): Promise<void> => {
  await waitForIcimsIframeReady();

  const { doc } = getIcimsFormContext();

  // Already parsed from a prior upload — just settle, then scan
  if (isIcimsResumeParsed(doc)) {
    await delay(RESUME_PARSED_SETTLE_MS);
    return;
  }

  if (!applicantData?.pdf_url) {
    return;
  }

  const submitted = await uploadIcimsResumeAndSubmitForParse(applicantData);
  if (!submitted) {
    return;
  }

  // iframe reloads during parse — wait for CurrentFile / FileName UI
  const parsed = await waitUntilIcimsResumeParsed();
  if (!parsed) {
    // Best-effort: still give a short settle before scanning
    await delay(RESUME_PARSED_SETTLE_MS);
    return;
  }

  await delay(RESUME_PARSED_SETTLE_MS);
};

const buildScanPayload = async (
  options: IcimsScanToMakeApiOptions,
): Promise<IcimsScanToMakeApiPayload> => {
  const payload = await scanIcimsHtmlToMakeApiPayload(options);
  return { ...payload, source: "icims" };
};

const applyFill = async (
  fillData: unknown,
  _applicantData: Applicant,
): Promise<AiFillResult> => {
  // Resume already uploaded + parsed in prepareBeforeScan
  const fillResult = await autofillIcimsWithAi(fillData);

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * iCIMS AI autofill site strategy.
 * Flow: resume upload+parse → wait 2s → scan → AI API → fill.
 * Form DOM is read/written via `#icims_content_iframe` contentDocument.
 */
export const icimsAiHandler: AiSiteHandler = {
  id: "icims",
  matches: isIcimsUrl,
  prepareBeforeScan: prepareIcimsBeforeScan,
  initFieldScanner: (applicantData, options) =>
    initIcimsHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
