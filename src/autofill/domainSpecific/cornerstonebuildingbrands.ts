import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillRadioType = async (applicantData: Applicant) => {
  const allRadioParentEle = document.querySelectorAll(".mb-6.text-dark-gray");
  if (!allRadioParentEle || allRadioParentEle.length === 0) {
    return;
  }
  for (const radioParent of allRadioParentEle) {
    const questionLabel = radioParent.querySelector("label");

    // 18 years
    if (
      fromatStirngInLowerCase(questionLabel?.textContent)?.includes("yearsold")
    ) {
      const allLabel = radioParent?.querySelectorAll("label");
      if (allLabel && allLabel.length > 0)
        for (const label of allLabel) {
          if (
            applicantData.is_over_18 &&
            fromatStirngInLowerCase(label?.textContent) === "yes"
          ) {
            label.click();
          }

          if (
            !applicantData.is_over_18 &&
            fromatStirngInLowerCase(label?.textContent) === "no"
          ) {
            label.click();
          }
        }
    }

    // for legally
    if (
      fromatStirngInLowerCase(questionLabel?.textContent)?.includes(
        "legallyauthorized"
      )
    ) {
      const allLabel = radioParent.querySelectorAll("label");
      if (allLabel && allLabel.length > 0)
        for (const label of allLabel) {
          if (
            applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(label?.textContent) === "yes"
          ) {
            label.click();
          }

          if (
            !applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(label?.textContent) === "no"
          ) {
            label.click();
          }
        }
    }

    // for sponshership
    if (
      fromatStirngInLowerCase(questionLabel?.textContent)?.includes(
        "sponsorship"
      )
    ) {
      const allLabel = radioParent?.querySelectorAll("label");
      if (allLabel && allLabel.length > 0)
        for (const label of allLabel) {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(label?.textContent) === "yes"
          ) {
            label.click();
          }

          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(label?.textContent) === "no"
          ) {
            label.click();
          }
        }
    }
  }
};

export const cornerstonebuildingbrands = async (
  tempDiv: any,
  applicantData: Applicant
) => {
  await fillRadioType(applicantData);
};
