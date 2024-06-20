import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillName = (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    if (fromatStirngInLowerCase(label.textContent).includes("preferredname")) {
      const input: any = label.nextElementSibling;
      input.value = applicantData.full_name;
      handleValueChanges(input);
    }
  }
};

const fillWorkAuthorization = (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    if (
      fromatStirngInLowerCase(label?.textContent).includes("authorizedtowork")
    ) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId) as HTMLSelectElement;
      if (select) {
        Array.from(select.options).find((option: HTMLOptionElement) => {
          if (
            applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(option?.text) === "yes"
          ) {
            option.selected = true;
            handleValueChanges(select);

            return true;
          }

          if (
            !applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(option?.text) === "no"
          ) {
            option.selected = true;
            handleValueChanges(select);

            return true;
          }
        });
      }
    }
  }
};

const fillVisa = (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    if (
      fromatStirngInLowerCase(label?.textContent).includes("sponsorship") ||
      fromatStirngInLowerCase(label?.textContent).includes("visa")
    ) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId) as HTMLSelectElement;
      if (select) {
        Array.from(select.options).find((option: HTMLOptionElement) => {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text) === "yes"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }

          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text) === "no"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }
        });
      }
    }
  }
};

export const applytojob = async (tempDiv: any, applicantData: Applicant) => {
  fillName(applicantData);
  fillWorkAuthorization(applicantData);
  fillVisa(applicantData);
};
