import { fieldNames } from "../FromFiller/fieldsname";
import { Applicant } from "../data";
import { checkIfExist } from "../helper";

export const ashbyhq = async (tempDiv: any, applicantData: Applicant) => {
  //
  const formSection: any = document.querySelectorAll(
    ".ashby-application-form-question-title"
  );
  if (!formSection || formSection.length === 0) {
    return;
  }

  formSection.forEach((label) => {
    // Extract all attributes

    const labelText = label?.textContent?.trim() ?? "";

    if (checkIfExist(labelText, fieldNames.visa)) {
      //
      const parentElement = label?.nextSibling;
      if (!parentElement) {
        return;
      }
      const childElement = parentElement.children;
      if (!childElement || childElement.length === 0) {
        return;
      }
      const yesButton = childElement[0];
      const NoButton = childElement[1];
      if (yesButton && NoButton && applicantData.sponsorship_required) {
        yesButton.click();
      } else {
        NoButton.click();
      }
    }
    // You can do whatever you want with each label field here
  });
};
