import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillRadioButton = (applicantData: Applicant) => {
  const allFieldset = document.querySelectorAll("fieldset");
  if (!allFieldset || allFieldset.length === 0) {
    return;
  }

  for (const fieldset of allFieldset) {
    const legend = fieldset.querySelector("legend");
    if (!legend) {
      return;
    }
    // for gender
    if (fromatStirngInLowerCase(legend?.textContent).includes("gender")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            fromatStirngInLowerCase(label?.textContent) === applicantData.gender
          ) {
            label.click();
          }
        }
      }
    }
    // race
    if (fromatStirngInLowerCase(legend?.textContent).includes("ethnic")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase(applicantData.race)
            )
          ) {
            label.click();
          }
        }
      }
    }
  }
};

export const silkroad = async (tempDiv: any, applicantData: Applicant) => {
  await fillRadioButton(applicantData);
};
