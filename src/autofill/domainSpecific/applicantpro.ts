import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillAllRadioType = async (applicantData: Applicant) => {
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
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("gender")) {
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
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("ethnic")) {
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

    // VETERANS
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("veterans")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            (applicantData.veteran_status === 1 ||
              applicantData.veteran_status === 3 ||
              applicantData.veteran_status === 4) &&
            fromatStirngInLowerCase(label?.textContent).includes(
              fromatStirngInLowerCase("I IDENTIFY AS ONE")
            )
          ) {
            label.click();
          }

          //----
          if (
            applicantData.veteran_status === 2 &&
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase("I AM NOT A")
            )
          ) {
            label.click();
          }

          // -----
          if (
            applicantData.veteran_status === 5 &&
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase("WISH")
            )
          ) {
            label.click();
          }
        }
      }
    }
  }
};

export const applicantpro = async (tempDiv: any, applicantData: Applicant) => {
  await fillAllRadioType(applicantData);
};
