import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const uploadFile = async (applicantData: Applicant) => {
  const resumeButton = document.getElementById("AddResumeLink");
  if (resumeButton) {
    resumeButton.click();
  }
};

const racefiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (
      fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase(applicantData.race)
      )
    ) {
      label.click();
      handleValueChanges(label);
    }
  }
};

const veteranStatusFiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (
      (applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 3 ||
        applicantData.veteran_status === 4) &&
      fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase("I IDENTIFY AS")
      )
    ) {
      label.click();
      handleValueChanges(label);
    }

    if (
      applicantData.veteran_status === 2 &&
      fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase("I AM NOT A PROTECTED VETERAN")
      )
    ) {
      label.click();
      handleValueChanges(label);
    }

    if (
      applicantData.veteran_status === 5 &&
      fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase("I choose not to disclose")
      )
    ) {
      label.click();
      handleValueChanges(label);
    }
  }
};

const disabilityStatusFiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (
      applicantData.disability_status &&
      fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase("YES, I HAVE A DISABILITY ")
      )
    ) {
      label.click();
      handleValueChanges(label);
    }

    if (
      !applicantData.disability_status &&
      fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase("NO, I DON'T HAVE A DISABILITY")
      )
    ) {
      label.click();
      handleValueChanges(label);
    }
  }
};

export const brassring = async (tempDiv: any, applicantData: Applicant) => {
  await uploadFile(applicantData);
  await racefiller(applicantData);
  await veteranStatusFiller(applicantData);
  //   await disabilityStatusFiller(applicantData);
};
