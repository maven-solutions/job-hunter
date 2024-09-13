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

export const jobsabbott = async (tempDiv: any, applicantData: Applicant) => {
  await phonetypeSecelcotr(applicantData);
};
