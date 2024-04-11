import { Applicant } from "../data";

async function createFile(url) {
  let response = await fetch(url);
  let data = await response.blob();
  let metadata = {
    type: "application/pdf",
  };
  return new File([data], "resume.pdf", metadata);
}

export const fileTypeDataFiller = async (
  tempDiv: any,
  applicantData: Applicant,
  iframe: boolean
) => {
  // Extract input fields of type "text"
  let file = false;

  const tempDivForFile = document.querySelector("body");
  let textInputField: any = "";
  if (iframe) {
    textInputField = tempDiv.querySelector('input[type="file"]');
  } else {
    textInputField = tempDivForFile.querySelector('input[type="file"]');
  }
  if (!textInputField) {
    return;
  }

  try {
    if (
      applicantData.pdf_url &&
      !file &&
      !textInputField.hasAttribute("ci-aria-file-uploaded")
    ) {
      textInputField.setAttribute("ci-aria-file-uploaded", "true");
      // Create file asynchronously
      const designFile = await createFile(applicantData.pdf_url);
      // Set file to input field only for the first file input field found
      const dt = new DataTransfer();
      dt.items.add(designFile);
      textInputField.files = dt.files;
      // Trigger input change event
      textInputField.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );
      file = true;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
