import { Applicant } from "../data";
import { fromatStirngInLowerCase } from "../helper";

const fillDisability = async (applicantData: Applicant) => {
  const disablityDiv = document.querySelector(".disability-status-radio");
  if (!disablityDiv) {
    return;
  }
  const allLabel = disablityDiv.querySelectorAll("label");
  if (allLabel && allLabel.length > 0)
    for (const label of allLabel) {
      if (
        fromatStirngInLowerCase(label.textContent).includes("yes") &&
        applicantData.disability_status
      ) {
        label.click();
        return;
      }

      if (
        fromatStirngInLowerCase(label.textContent).includes("no") &&
        !applicantData.disability_status
      ) {
        label.click();
        return;
      }
    }
};

export const concentrix = async (tempDiv: any, applicantData: Applicant) => {
  await fillDisability(applicantData);
};
