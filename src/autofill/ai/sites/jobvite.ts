import { Applicant } from "../../data";
import { createFile } from "../../FromFiller/fileTypeDataFiller";
import { autofillJobviteWithAi } from "../autofill.jobvite";
import { initJobviteHtmlScanner } from "../cibtn.jobvite";
import {
  scanJobviteHtmlToMakeApiPayload,
  JobviteScanToMakeApiOptions,
  JobviteScanToMakeApiPayload,
} from "../scan.jobvite";
import { AiFillResult, AiSiteHandler } from "../types";

/**
 * Jobvite apply hosts where AI autofill is enabled.
 * Matches jobs.jobvite.com and regional jobs.jobvite.* hosts.
 */
const JOBVITE_HOST_SUFFIXES = ["jobs.jobvite.com"] as const;

export const isJobviteUrl = (url: string = window.location.href): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (
      JOBVITE_HOST_SUFFIXES.some(
        (suffix) => host === suffix || host.endsWith(`.${suffix}`),
      )
    ) {
      return true;
    }
    return host.startsWith("jobs.") && host.includes("jobvite");
  } catch {
    const lower = url.toLowerCase();
    return (
      lower.includes("jobs.jobvite.") || /jobs\.[a-z0-9.-]*jobvite/i.test(lower)
    );
  }
};

const isResumeAlreadyAttached = (): boolean => {
  const list = document.querySelector("#attachResume .jv-file-list");
  if (list && list.querySelector("li")) return true;

  const selectWrap = document.querySelector<HTMLElement>(
    "#attachResume [ng-show='!resumeName']",
  );
  if (selectWrap?.classList.contains("ng-hide")) return true;

  return false;
};

const getJobviteAttachmentDropdown = (): HTMLElement | null => {
  const dropdown = document.getElementById("attachmentDropdown");
  if (!dropdown) return null;
  if (dropdown.classList.contains("ng-hide")) return null;
  if (dropdown.getAttribute("aria-hidden") === "true") return null;
  const style = window.getComputedStyle(dropdown);
  if (style.display === "none" || style.visibility === "hidden") return null;
  return dropdown;
};

/**
 * File input lives in `#attachmentDropdown` (opened by Resume Select),
 * not inside `#attachResume`. Prefer `#file-input-0` / the File row.
 */
const findJobviteResumeFileInput = (): HTMLInputElement | null => {
  const dropdown = getJobviteAttachmentDropdown();
  const root: ParentNode = dropdown ?? document;

  const byId = root.querySelector<HTMLInputElement>(
    "#file-input-0, input[id^='file-input-']",
  );
  if (byId && byId.type === "file") return byId;

  const fileRow = Array.from(
    root.querySelectorAll<HTMLElement>(".jv-add-attachment-item"),
  ).find((item) => /(?:^|\s)file(?:\s|$)/i.test(item.textContent ?? ""));
  const fromRow = fileRow?.querySelector<HTMLInputElement>("input[type='file']");
  if (fromRow) return fromRow;

  return (
    root.querySelector<HTMLInputElement>(
      "[jv-file-input] input[type='file'], label[jv-file-input] + input[type='file']",
    ) ?? dropdown?.querySelector<HTMLInputElement>("input[type='file']") ??
    null
  );
};

const clickJobviteResumeSelect = (): boolean => {
  const button = document.querySelector<HTMLButtonElement>(
    "#attachResume button[jv-add-attachment], .jv-apply-with#attachResume button.jv-button, #attachResume button.jv-button",
  );
  if (!button) return false;

  button.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }),
  );
  button.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }),
  );
  button.click();
  return true;
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
      attributeFilter: ["class", "style", "aria-hidden"],
    });
  });

const callAngularChange = (element: HTMLElement): boolean => {
  const angular = (window as any).angular;
  if (!angular?.element) return false;

  try {
    const ngEl = angular.element(element);
    const scopes = [ngEl.scope?.(), ngEl.isolateScope?.()].filter(Boolean);
    for (const scope of scopes) {
      if (typeof scope.change !== "function") continue;
      if (!scope.$$phase && !scope.$root?.$$phase) {
        scope.$apply(() => scope.change());
      } else {
        scope.change();
      }
      return true;
    }
    ngEl.triggerHandler?.("change");
  } catch {
    // Angular missing or digest already in progress
  }
  return false;
};

/**
 * Jobvite File row uses:
 * `onchange="angular.element(this).scope().change()"`
 * `change` may live on the input scope or the `jv-file-input` isolate scope.
 */
const notifyJobviteFileChange = (fileInput: HTMLInputElement): void => {
  const label =
    (fileInput.previousElementSibling instanceof HTMLElement &&
    fileInput.previousElementSibling.matches("[jv-file-input], label")
      ? fileInput.previousElementSibling
      : null) ||
    (fileInput.id
      ? document.querySelector<HTMLElement>(
          `label[for="${CSS.escape(fileInput.id)}"]`,
        )
      : null);

  if (callAngularChange(fileInput) || (label && callAngularChange(label))) {
    return;
  }

  fileInput.dispatchEvent(new Event("input", { bubbles: true }));
  fileInput.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false }),
  );
  if (typeof fileInput.onchange === "function") {
    fileInput.onchange(new Event("change") as any);
  }
};

const assignFileAndNotify = async (
  fileInput: HTMLInputElement,
  applicantData: Applicant,
): Promise<boolean> => {
  const designFile = await createFile(
    applicantData.pdf_url,
    applicantData.resume_title || "resume",
  );
  const dt = new DataTransfer();
  dt.items.add(designFile);

  fileInput.setAttribute("ci-aria-file-uploaded", "true");
  fileInput.files = dt.files;
  notifyJobviteFileChange(fileInput);
  return true;
};

/**
 * Resume flow: click `#attachResume` Select → wait for `#attachmentDropdown`
 * → set files on `#file-input-0` → Angular `scope().change()`.
 */
const uploadJobviteResume = async (
  applicantData: Applicant,
): Promise<boolean> => {
  if (!applicantData?.pdf_url) return false;
  if (isResumeAlreadyAttached()) return true;

  if (!getJobviteAttachmentDropdown()) {
    if (!clickJobviteResumeSelect()) {
      console.warn("[CareerAI Jobvite] Resume Select button not found");
      return false;
    }
  }

  const dropdown = await waitForPredicate(getJobviteAttachmentDropdown, 3000);
  if (!dropdown) {
    console.warn("[CareerAI Jobvite] Attachment dropdown did not open");
    return false;
  }

  const fileInput = await waitForPredicate(findJobviteResumeFileInput, 2000);
  if (!fileInput) {
    console.warn("[CareerAI Jobvite] Resume file input not found in dropdown");
    return false;
  }

  try {
    await assignFileAndNotify(fileInput, applicantData);
    const attached = await waitForPredicate(
      () => (isResumeAlreadyAttached() ? true : null),
      8000,
    );
    return !!attached || !!fileInput.files?.length;
  } catch (error) {
    console.error("[CareerAI Jobvite] Resume upload failed:", error);
    return false;
  }
};

const buildScanPayload = async (
  options: JobviteScanToMakeApiOptions,
): Promise<JobviteScanToMakeApiPayload> => {
  const payload = await scanJobviteHtmlToMakeApiPayload(options);
  return { ...payload, source: "jobvite" };
};

const applyFill = async (
  fillData: unknown,
  applicantData: Applicant,
): Promise<AiFillResult> => {
  const fillResult = await autofillJobviteWithAi(fillData);

  // Resume is not returned by the AI fill API — upload from local applicant data.
  // Do NOT increment `filled` for resume: it is not one of the scanned form fields.
  if (applicantData?.pdf_url) {
    await uploadJobviteResume(applicantData);
  }

  return {
    total: fillResult.total,
    filled: fillResult.filled,
    failed: fillResult.failed,
    skipped: fillResult.skipped,
  };
};

/**
 * Jobvite AI autofill site strategy.
 * DOM scanning, native select/currency fill, Angular sync, and resume upload.
 */
export const jobviteAiHandler: AiSiteHandler = {
  id: "jobvite",
  matches: isJobviteUrl,
  initFieldScanner: (applicantData, options) =>
    initJobviteHtmlScanner(applicantData as Record<string, unknown>, options),
  buildScanPayload,
  applyFill,
};
