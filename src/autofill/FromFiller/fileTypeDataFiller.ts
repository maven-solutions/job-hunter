import { Applicant } from "../data";

export async function createFile(url, resumetitle) {
  let response = await fetch(url);
  let data = await response.blob();
  let metadata = {
    type: "application/pdf",
  };
  return new File([data], `${resumetitle}.pdf`, metadata);
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
  if (window.location.href.includes(".ashbyhq.")) {
    const allInputfield = document.querySelectorAll('input[type="file"]');
    textInputField = allInputfield[1];
  }
  if (window.location.href.includes(".bamboohr.")) {
    return;
  }

  try {
    if (applicantData.pdf_url) {
      textInputField.setAttribute("ci-aria-file-uploaded", "true");
      // Create file asynchronously
      const designFile = await createFile(
        applicantData.pdf_url,
        applicantData.resume_title
      );
      // Set file to input field only for the first file input field found
      const dt = new DataTransfer();
      dt.items.add(designFile);
      textInputField.files = dt.files;
      // Trigger input change event
      textInputField.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
