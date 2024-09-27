import { Applicant } from "../data";
import { createFile } from "../FromFiller/fileTypeDataFiller";

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
export const talemetry = async (tempDiv: any, applicantData: Applicant) => {
  await fillResume(applicantData);
};
