import { saveJobPayload } from "./api";

const SAVE_BUTTON_CLASS = "careerai-claude-save-btn";
const savedJobLinks = new Set<string>();
let observerStarted = false;
let debounceTimer: number | null = null;

const isJobPayload = (data: unknown): data is Record<string, any> => {
  if (!data || typeof data !== "object") return false;
  const job = data as Record<string, unknown>;
  return Boolean(job.companyName && job.jobTitle && job.jobLink);
};

const parseJobJson = (rawText: string) => {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw error;
  }
};

const toApiPayload = (job: Record<string, any>) => ({
  companyName: job.companyName ?? "",
  jobTitle: job.jobTitle ?? "",
  jobLink: job.jobLink ?? "",
  posted_on: job.posted_on ?? "",
  description: job.description ?? "",
  jobType: job.jobType ?? "",
  category: job.category ?? "",
  employment: job.employment ?? "",
  jobBoard: job.jobBoard ?? "",
  state: job.state ?? "USA",
  city: job.city,
  easyApply: job.easyApply ?? 0,
  recruiterDetails: job.recruiterDetails ?? {},
  companyDetails: job.companyDetails ?? {},
  jobOverview: job.jobOverview ?? [],
  location: job.location ?? "",
});

const getJobFromBlock = (block: Element) => {
  const code = block.querySelector("code.language-json, pre code");
  const rawText = code?.textContent?.trim() ?? "";
  if (!rawText || !rawText.includes('"companyName"')) return null;

  try {
    const parsed = parseJobJson(rawText);
    return isJobPayload(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
};

const setButtonState = (
  button: HTMLButtonElement,
  state: "idle" | "saving" | "done" | "error",
  label?: string
) => {
  button.dataset.careeraiState = state;
  button.disabled = state === "saving" || state === "done";
  button.classList.toggle("is-saving", state === "saving");
  button.classList.toggle("is-done", state === "done");
  button.classList.toggle("is-error", state === "error");

  if (state === "idle") button.textContent = label ?? "API";
  if (state === "saving") button.textContent = "Saving...";
  if (state === "done") button.textContent = label ?? "Done";
  if (state === "error") button.textContent = label ?? "Retry";
};

const handleSaveClick = async (
  event: MouseEvent,
  block: Element,
  button: HTMLButtonElement
) => {
  event.preventDefault();
  event.stopPropagation();

  if (button.dataset.careeraiState === "saving" || button.dataset.careeraiState === "done") {
    return;
  }

  const job = getJobFromBlock(block);
  if (!job) {
    setButtonState(button, "error", "Invalid JSON");
    return;
  }

  setButtonState(button, "saving");

  try {
    const result = await saveJobPayload(toApiPayload(job));
    const status = result?.status;

    if (status === "success") {
      savedJobLinks.add(String(job.jobLink));
      setButtonState(button, "done");
      return;
    }

    if (status === "duplicate-jobs" || status === "failed") {
      savedJobLinks.add(String(job.jobLink));
      setButtonState(button, "done", "Saved");
      return;
    }

    setButtonState(button, "error");
  } catch (error) {
    setButtonState(button, "error");
  }
};

const attachButtonToBlock = (block: Element) => {
  if (block.querySelector(`.${SAVE_BUTTON_CLASS}`)) return;

  const job = getJobFromBlock(block);
  if (!job) return;

  const wrap = document.createElement("div");
  wrap.className = "careerai-claude-save-wrap";

  const button = document.createElement("button");
  button.type = "button";
  button.className = SAVE_BUTTON_CLASS;
  button.setAttribute("aria-label", "Save this job to CareerAI");
  setButtonState(button, "idle");

  if (savedJobLinks.has(String(job.jobLink))) {
    setButtonState(button, "done");
  }

  button.addEventListener("click", (event) => {
    handleSaveClick(event, block, button);
  });

  wrap.appendChild(button);
  block.insertBefore(wrap, block.firstChild);
};

const attachButtonsToJsonBlocks = () => {
  const blocks = document.querySelectorAll(
    '[role="group"][aria-label="json code"]'
  );
  blocks.forEach((block) => attachButtonToBlock(block));
};

const scheduleAttach = () => {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(attachButtonsToJsonBlocks, 300);
};

export const addSaveButtonsToClaudeResponses = () => {
  if (!window.location.hostname.includes("claude.ai")) return;

  attachButtonsToJsonBlocks();

  if (observerStarted) return;
  observerStarted = true;

  const observer = new MutationObserver(scheduleAttach);
  observer.observe(document.body, { childList: true, subtree: true });
};
