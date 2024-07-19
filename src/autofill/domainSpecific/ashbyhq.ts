import { fieldNames } from "../FromFiller/fieldsname";
import { Applicant } from "../data";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const fillFullName = async (applicantData: Applicant) => {
  await delay(1000);
  const fullName: HTMLInputElement = document.querySelector(
    '[name="_systemfield_name"]'
  );
  if (!fullName) {
    return;
  }
  fullName.value = applicantData.full_name;
  handleValueChanges(fullName);
};

const fillGender = async (applicantData: Applicant) => {
  const genderTag: HTMLLabelElement = document.querySelector(
    '[for="_systemfield_eeoc_gender"]'
  );
  if (!genderTag) {
    return;
  }
  const parentTag = genderTag.parentElement;
  if (!parentTag) {
    return;
  }
  const allLabel = parentTag.querySelectorAll("label");
  if (allLabel && allLabel.length > 0) {
    for (const label of allLabel) {
      if (fromatStirngInLowerCase(label.textContent) === applicantData.gender) {
        label.click();
        handleValueChanges(label);
      }
    }
  }
};

const fillRace = async (applicantData: Applicant) => {
  const raceTag: HTMLLabelElement = document.querySelector(
    '[for="_systemfield_eeoc_race"]'
  );
  if (!raceTag) {
    return;
  }
  const parentTag = raceTag.parentElement;
  if (!parentTag) {
    return;
  }
  const allLabel = parentTag.querySelectorAll("label");
  if (allLabel && allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        fromatStirngInLowerCase(label.textContent)?.includes(
          fromatStirngInLowerCase(applicantData.race)
        )
      ) {
        label.click();
        handleValueChanges(label);
      }
    }
  }
};

const fillVeteran = async (applicantData: Applicant) => {
  const veteranTag: HTMLLabelElement = document.querySelector(
    '[for="_systemfield_eeoc_veteran_status"]'
  );
  if (!veteranTag) {
    return;
  }
  const parentTag = veteranTag.parentElement;
  if (!parentTag) {
    return;
  }
  const allLabel = parentTag.querySelectorAll("label");
  if (allLabel && allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        applicantData.veteran_status === 2 &&
        fromatStirngInLowerCase(label.textContent)?.includes(
          fromatStirngInLowerCase("I am not a protected")
        )
      ) {
        label.click();
        handleValueChanges(label);
        return;
      }

      if (
        applicantData.veteran_status === 5 &&
        fromatStirngInLowerCase(label.textContent)?.includes(
          fromatStirngInLowerCase("decline")
        )
      ) {
        label.click();
        handleValueChanges(label);
        return;
      }

      if (
        (applicantData.veteran_status === 1 ||
          applicantData.veteran_status === 3 ||
          applicantData.veteran_status === 4) &&
        fromatStirngInLowerCase(label.textContent)?.includes(
          fromatStirngInLowerCase("I identify as")
        )
      ) {
        label.click();
        handleValueChanges(label);
        return;
      }
    }
  }
};

export const ashbyhq = async (tempDiv: any, applicantData: Applicant) => {
  //
  const formSection: any = document.querySelectorAll(
    ".ashby-application-form-question-title"
  );
  if (!formSection || formSection.length === 0) {
    return;
  }

  formSection.forEach((label) => {
    // Extract all attributes

    const labelText = label?.textContent?.trim() ?? "";
    // for visa
    if (checkIfExist(labelText, fieldNames.visa)) {
      //
      const parentElement = label?.nextSibling;
      if (!parentElement) {
        return;
      }
      const childElement = parentElement.children;
      if (!childElement || childElement.length === 0) {
        return;
      }
      const yesButton = childElement[0];
      const NoButton = childElement[1];
      if (yesButton && NoButton && applicantData.sponsorship_required) {
        yesButton.click();
      } else {
        NoButton.click();
      }
    }
    //work authorization
    if (checkIfExist(labelText, ["legal", "authoriz"])) {
      //
      const parentElement = label?.nextSibling;
      if (!parentElement) {
        return;
      }
      const childElement = parentElement.children;
      if (!childElement || childElement.length === 0) {
        return;
      }
      const yesButton = childElement[0];
      const NoButton = childElement[1];
      if (yesButton && NoButton && applicantData.us_work_authoriztaion) {
        yesButton.click();
      } else {
        NoButton.click();
      }
    }
    // You can do whatever you want with each label field here
  });

  await fillFullName(applicantData);
  await fillGender(applicantData);
  await fillRace(applicantData);
  await fillVeteran(applicantData);
};
