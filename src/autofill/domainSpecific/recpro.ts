import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillEthnic = async (applicantData: Applicant) => {
  const ethnic: HTMLSelectElement = document.querySelector(
    'select[data-automation="country-questions-ethnic-origin"]'
  );
  if (!ethnic) {
    return;
  }
  Array.from(ethnic.options).find((option: any) => {
    if (
      applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(option?.text) === "hispaniclatino"
    ) {
      option.selected = true;
      handleValueChanges(ethnic);
      return true;
    }

    if (
      !applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(option?.text) === "nothispaniclatino"
    ) {
      option.selected = true;
      handleValueChanges(ethnic);
      return true;
    }
  });
};

const fillVeretan = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector(
    'select[data-automation="country-questions-us-federal-contractor"]'
  );
  if (!select) {
    return;
  }
  Array.from(select.options).find((option: any) => {
    if (
      (applicantData.veteran_status == 1 ||
        applicantData.veteran_status == 3 ||
        applicantData.veteran_status == 4) &&
      fromatStirngInLowerCase(option?.text) === "yes"
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }

    if (
      (applicantData.veteran_status == 2 ||
        applicantData.veteran_status == 5) &&
      fromatStirngInLowerCase(option?.text) === "no"
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }
  });
};
const fillDisability = async (applicantData: Applicant) => {
  const disabilityLabel = document.querySelector(
    '[data-automation="disability-status-question-label"]'
  );
  if (!disabilityLabel) {
    return;
  }
  const parentElement = disabilityLabel.parentElement;
  if (!parentElement) {
    return;
  }
  const allLabel = parentElement.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  if (allLabel && allLabel.length > 0)
    for (const label of allLabel) {
      if (
        fromatStirngInLowerCase(label.textContent)?.includes("yesihave") &&
        applicantData.disability_status
      ) {
        label.click();
        return;
      }

      if (
        fromatStirngInLowerCase(label.textContent)?.includes("donothave") &&
        !applicantData.disability_status
      ) {
        label.click();
        return;
      }
    }
};

export const recpro = async (tempDiv: any, applicantData: Applicant) => {
  await fillEthnic(applicantData);
  await fillVeretan(applicantData);
  await fillDisability(applicantData);

  const fullname = document.getElementById("YourName") as HTMLInputElement;
  if (fullname) {
    fullname.value = applicantData.full_name;
    handleValueChanges(fullname);
  }
};
