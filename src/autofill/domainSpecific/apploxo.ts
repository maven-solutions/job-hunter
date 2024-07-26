import { all } from "axios";
import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillName = (applicantData: Applicant) => {
  const name: HTMLInputElement = document.querySelector('[name="name"]');
  if (name) {
    name.value = applicantData.full_name;
    handleValueChanges(name);
  }
};

const fillWorkAuth = (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    if (
      fromatStirngInLowerCase(label?.textContent)?.includes(
        fromatStirngInLowerCase("legally authorized")
      )
    ) {
      //
      const parentEle = label.parentElement;
      if (!parentEle) {
        return;
      }
      const allInput = parentEle?.querySelectorAll("input");
      if (!allInput && allInput.length === 0) {
        return;
      }

      const yesInput = allInput[0];
      const noInput = allInput[1];
      if (applicantData.us_work_authoriztaion) {
        yesInput.focus();
        yesInput.click();
        handleValueChanges(yesInput);
      } else {
        noInput.focus();
        noInput.click();
        handleValueChanges(noInput);
      }
    }
  }
};

const fillVisa = (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    if (
      fromatStirngInLowerCase(label?.textContent)?.includes(
        fromatStirngInLowerCase("sponsorship")
      )
    ) {
      //
      const parentEle = label.parentElement;
      if (!parentEle) {
        return;
      }
      const allInput = parentEle?.querySelectorAll("input");
      if (!allInput && allInput.length === 0) {
        return;
      }

      const yesInput = allInput[0];
      const noInput = allInput[1];
      if (applicantData.sponsorship_required) {
        yesInput.focus();
        yesInput.click();
        yesInput.checked;

        handleValueChanges(yesInput);
      } else {
        noInput.focus();
        noInput.click();
        noInput.checked;

        handleValueChanges(noInput);
      }
    }
  }
};

export const apploxo = async (tempDiv: any, applicantData: Applicant) => {
  fillName(applicantData);
  fillWorkAuth(applicantData);
  fillVisa(applicantData);
};
