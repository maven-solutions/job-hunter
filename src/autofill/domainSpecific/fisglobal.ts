import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillDisability = async (applicantData: Applicant) => {
  await delay(500);
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
        return;
      }

      if (
        fromatStirngInLowerCase(label.textContent).includes("noi") &&
        !applicantData.disability_status
      ) {
        label.click();
        handleValueChanges(label);
        return;
      }
    }
  }
};

export const fisglobal = async (tempDiv: any, applicantData: Applicant) => {
  await fillDisability(applicantData);
};
