import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const phonetypeSecelcotr = async (applicantData: Applicant) => {
  const deviceType = document.querySelector('div[id="deviceType"]');
  if (!deviceType) {
    return;
  }
  const allLabel: any = deviceType.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }

  for (const label of allLabel) {
    const text = fromatStirngInLowerCase(label?.textContent);
    if (text?.includes("mobile")) {
      label.click();
      handleValueChanges(label);
    }
  }
};

const radioButtonSelector = async (applicantData: Applicant) => {
  const radioSection: any = document.querySelectorAll('[role="radiogroup"]');
  if (!radioSection || radioSection.length === 0) {
    return;
  }
  for (const radio of radioSection) {
    const label = radio?.querySelector("label")?.textContent;
    const text = fromatStirngInLowerCase(label);
    if (text?.includes(fromatStirngInLowerCase("legally authorized"))) {
      const allLabel = radio?.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          const text = fromatStirngInLowerCase(label?.textContent);
          if (text?.includes("yes") && applicantData.us_work_authoriztaion) {
            label.click();
            handleValueChanges(label);
          }
          if (text?.includes("no") && !applicantData.us_work_authoriztaion) {
            label.click();
            handleValueChanges(label);
          }
        }
      }
    }

    // for sponshership
    if (
      text?.includes(fromatStirngInLowerCase("sponsorship")) ||
      text?.includes(fromatStirngInLowerCase("visa"))
    ) {
      const allLabel = radio?.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          const text = fromatStirngInLowerCase(label?.textContent);
          if (text?.includes("yes") && applicantData.sponsorship_required) {
            label.click();
            handleValueChanges(label);
          }
          if (text?.includes("no") && !applicantData.sponsorship_required) {
            label.click();
            handleValueChanges(label);
          }
        }
      }
    }
  }
};

const hanldeDisablityStatus = async (applicantData: Applicant) => {
  const disabilityDiv = document.querySelector(
    '[id="disability_heading_self_identity1.disabilityStatus"]'
  );
  if (!disabilityDiv) {
    return;
  }

  const allLabel = disabilityDiv?.querySelectorAll("label");
  if (allLabel && allLabel.length > 0) {
    for (const label of allLabel) {
      const text = fromatStirngInLowerCase(label?.textContent);
      if (
        text?.includes(fromatStirngInLowerCase("Yes, I have a disability")) &&
        applicantData.disability_status
      ) {
        label.click();
        handleValueChanges(label);
      }
      if (
        text?.includes(fromatStirngInLowerCase("I do not have a disability")) &&
        !applicantData.disability_status
      ) {
        label.click();
        handleValueChanges(label);
      }
    }
  }
};

export const jobsabbott = async (tempDiv: any, applicantData: Applicant) => {
  await phonetypeSecelcotr(applicantData);
  await radioButtonSelector(applicantData);
  await hanldeDisablityStatus(applicantData);
};
