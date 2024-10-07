import { isEmptyArray } from "../../utils/helper";
import { Applicant } from "../data";
import { createFile } from "../FromFiller/fileTypeDataFiller";
import { delay } from "../helper";
import { talemetryWorkExperienceDatafiller } from "./helper/helper.talemetry";

const fillResume = async (applicantData: Applicant) => {
  const input: any = document.querySelector("#resume_upload_file_input");
  if (!input) return;

  try {
    if (applicantData.pdf_url) {
      input.setAttribute("ci-aria-file-uploaded", "true");
      // Create file asynchronously
      const designFile = await createFile(
        applicantData.pdf_url,
        applicantData.resume_title
      );
      // Set file to input field only for the first file input field found
      const dt = new DataTransfer();
      dt.items.add(designFile);
      input.files = dt.files;
      // Trigger input change event
      input.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const deleteAllHistory = async () => {
  const deleteButtons: any = document.querySelectorAll(
    'button[aria-label*="Delete"]'
  );
  if (isEmptyArray(deleteButtons)) return;
  for await (const deleteButton of deleteButtons) {
    deleteButton.click();
    await delay(1500);
    const buttons = document?.querySelectorAll("button");
    if (isEmptyArray(buttons)) return;
    // Filter buttons to find the ones whose textContent is exactly "Yes"
    const yesButton = Array.from(buttons)?.find(
      (button) => button?.textContent?.trim()?.toLowerCase() === "yes"
    );
    yesButton?.click();
    await delay(1500);
  }
  await delay(1500);
};

const getWorkButton = () => {
  const buttons = document?.querySelectorAll("button");
  if (isEmptyArray(buttons)) return;
  // Filter buttons to find the ones whose textContent is exactly "Yes"
  const workButton = Array.from(buttons)?.find((button) =>
    button?.textContent?.trim()?.toLowerCase().includes("work history")
  );
  return workButton;
};

const addWorkExperience = async (applicantData: Applicant) => {
  const workButton = getWorkButton();
  if (!workButton) return;

  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for await (const [
      index,
      element,
    ] of applicantData.employment_history.entries()) {
      workButton.click();
      await delay(3500);
      await talemetryWorkExperienceDatafiller(
        workButton,
        applicantData,
        element,
        index
      );
    }
  }
};

export const talemetry = async (tempDiv: any, applicantData: Applicant) => {
  await fillResume(applicantData);
  await deleteAllHistory();
  await addWorkExperience(applicantData);
};
