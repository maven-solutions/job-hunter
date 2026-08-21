import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { autofillApplyToJobWithAi } from "../autofill.applytojob";
import { initApplyToJobHtmlScanner } from "../cibtn.applytojob";
import {
  ApplyToJobScanToMakeApiOptions,
  ApplyToJobScanToMakeApiPayload,
  getApplyToJobFormRoot,
  scanApplyToJobHtmlToMakeApiPayload,
} from "../scan.applytojob";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * JazzHR / ApplyToJob hosts where AI autofill is enabled.
 * Matches applytojob.com and tenant subdomains (e.g. landing.applytojob.com).
 */
const APPLYTOJOB_HOST_SUFFIXES = ["applytojob.com"] as const;

export const isApplyToJobUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return APPLYTOJOB_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    const lower = url.toLowerCase();
    return APPLYTOJOB_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
  }
};

const waitForPredicate = <T>(
  getter: () => T | null,
  timeoutMs: number,
): Promise<T | null> =>
  new Promise((resolve) => {
    const existing = getter();
    if (existing) {
      resolve(existing);
      return;
    }

    let observer: MutationObserver | null = null;
    const timer = window.setTimeout(() => {
      observer?.disconnect();
      resolve(getter());
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const value = getter();
      if (value) {
        window.clearTimeout(timer);
        observer?.disconnect();
        resolve(value);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });
  });

const isResumeAlreadyAttached = (): boolean => {
  const uploaded = document.querySelector<HTMLInputElement>("#uploaded-file");
  if (uploaded?.value?.trim()) return true;

  const twoStage = document.getElementById("resumator-two-stage-resume-toggle");
  if (twoStage && !twoStage.classList.contains("none")) {
    const style = window.getComputedStyle(twoStage);
    if (style.display !== "none" && style.visibility !== "hidden") {
      return true;
    }
  }

  const fileInput = document.querySelector<HTMLInputElement>(
    "#resumator-resume-value",
  );
  return !!fileInput?.files?.length;
};

const isResumeUploadVisible = (): boolean => {
  const wrapper = document.getElementById("resumator-resume-upload-wrapper");
  if (!wrapper) return false;
  if (wrapper.classList.contains("none")) return false;
  const style = window.getComputedStyle(wrapper);
  return style.display !== "none" && style.visibility !== "hidden";
};

const findApplyToJobResumeFileInput = (): HTMLInputElement | null => {
  const form = getApplyToJobFormRoot();
  const byId = form.querySelector<HTMLInputElement>("#resumator-resume-value");
  if (byId?.type === "file") return byId;

  return form.querySelector<HTMLInputElement>(
    "input[name='resumator-resume-value'][type='file'], #resumator-resume-field input[type='file']",
  );
};

const clickApplyToJobAttachResume = (): boolean => {
  const link = document.querySelector<HTMLElement>("#resumator-choose-upload");
  if (!link) return false;
  link.click();
  return true;
};

const notifyFileChange = (fileInput: HTMLInputElement): void => {
  fileInput.dispatchEvent(new Event("input", { bubbles: true }));
  fileInput.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false }),
  );
  if (typeof fileInput.onchange === "function") {
    fileInput.onchange(new Event("change") as any);
  }
};

/**
 * Resume is hidden until "Attach resume" is clicked.
 * Reveal `#resumator-resume-value`, then set files from applicant pdf_url.
 */
const uploadApplyToJobResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;
  if (isResumeAlreadyAttached()) return true;

  if (!isResumeUploadVisible()) {
    if (!clickApplyToJobAttachResume()) {
      console.warn("[CareerAI ApplyToJob] Attach resume control not found");
      return false;
    }
  }

  await waitForPredicate(
    () => (isResumeUploadVisible() ? true : null),
    3000,
  );

  const fileInput = await waitForPredicate(findApplyToJobResumeFileInput, 2000);
  if (!fileInput) {
    console.warn("[CareerAI ApplyToJob] Resume file input not found");
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
    notifyFileChange(fileInput);
    return !!fileInput.files?.length;
  } catch (error) {
    console.error("[CareerAI ApplyToJob] Resume upload failed:", error);
    return false;
  }
};

const buildScanPayload = async (
  options: ApplyToJobScanToMakeApiOptions,
): Promise<ApplyToJobScanToMakeApiPayload> => {
  const payload = await scanApplyToJobHtmlToMakeApiPayload(options);
  return { ...payload, source: "applytojob" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillApplyToJobWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume: it is not one of the scanned form fields.
  if (applicantData?.pdf_url) {
    await uploadApplyToJobResume(applicantData);
  }

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * JazzHR / ApplyToJob AI autofill site strategy.
 * Native inputs/selects, datepicker text, and resume file attach.
 */
export const applytojobAiHandler: AiSiteHandler = {
  id: "applytojob",
  matches: isApplyToJobUrl,
  initFieldScanner: (applicantData, options) =>
    initApplyToJobHtmlScanner(
      applicantData as Record<string, unknown>,
      options,
    ),
  buildScanPayload,
  applyFill,
};
