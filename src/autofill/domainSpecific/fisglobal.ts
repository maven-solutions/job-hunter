import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillDisability = async (applicantData: Applicant) => {
  const disability = document.querySelector(
    '[id="disability_heading_self_identity.disabilityStatus"]'
  );

  if (!disability) {
    return;
  }
  const allLabel = disability.querySelectorAll("label");
  if (allLabel && allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        fromatStirngInLowerCase(label.textContent).includes("yes") &&
        applicantData.disability_status
      ) {
        label.click();
        handleValueChanges(label);
      }

      if (
        fromatStirngInLowerCase(label.textContent).includes("noi") &&
        !applicantData.disability_status
      ) {
        label.click();
        handleValueChanges(label);
      }
    }
  }
};

export const fisglobal = async (tempDiv: any, applicantData: Applicant) => {
  await fillDisability(applicantData);
};
