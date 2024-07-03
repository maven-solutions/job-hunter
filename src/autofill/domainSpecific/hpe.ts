import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase } from "../helper";

const handleDisabiblit = (applicantData: Applicant) => {
  const disabilityEle: HTMLElement = document.getElementById(
    "disability_heading_self_identity.disabilityStatus"
  );

  if (!disabilityEle) {
    return;
  }
  const allLabel = disabilityEle.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    if (
      label &&
      applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("yesihave")
    ) {
      label.click();
    }

    if (
      label &&
      !applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("idonothave")
    ) {
      label.click();
    }
  }
};

export const hpe = async (tempDiv: any, applicantData: Applicant) => {
  handleDisabiblit(applicantData);
};
