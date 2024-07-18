import { all } from "axios";
import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase } from "../helper";

const fillRadioButton = (applicantData: Applicant) => {
  const allQuestion = document.querySelectorAll(
    ".form-group.drag-edit.toggle.toggle-inline.padding-bottom-none.multi-question"
  );
  if (!allQuestion || allQuestion.length === 0) {
    return;
  }
  for (const question of allQuestion) {
    const ptag = question.querySelector("p");
    if (ptag) {
      const questionText = ptag.textContent.trim();

      // for 18years
      if (questionText.includes("18 years")) {
        const allLabel = question.querySelectorAll("label");
        if (!allLabel || allLabel.length === 0) {
          return;
        }
        const yesButton = allLabel[0];
        const Nobutton = allLabel[1];
        if (applicantData.is_over_18) {
          yesButton.click();
        } else {
          Nobutton.click();
        }
      }

      // for visa
      if (
        questionText.includes("sponsorship") ||
        questionText.includes("visa")
      ) {
        const allLabel = question.querySelectorAll("label");
        if (!allLabel || allLabel.length === 0) {
          return;
        }
        const yesButton = allLabel[0];
        const Nobutton = allLabel[1];
        if (applicantData.sponsorship_required) {
          yesButton.click();
        } else {
          Nobutton.click();
        }
      }
    }
  }
};

const fillGender = async (applicantData: Applicant) => {
  const gender: HTMLDivElement = document.querySelector('[data-for="Gender"]');

  if (!gender) {
    return;
  }
  gender.click();
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim()) ===
      fromatStirngInLowerCase(applicantData.gender)
    ) {
      element.click();
      // return true;
    }
  }
  await delay(500);
};

const fillRace = async (applicantData: Applicant) => {
  const race: HTMLDivElement = document.querySelector(
    '[data-for="Race and/or Ethnicity"]'
  );

  if (!race) {
    return;
  }
  race.click();
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim())?.includes(
        fromatStirngInLowerCase(applicantData.race)
      ) &&
      !race
    ) {
      element.click();
      // return true;
    }
  }
  await delay(500);
};

const fillDisability = async (applicantData: Applicant) => {
  const disability: HTMLDivElement = document.querySelector(
    '[data-for="Disability Status"]'
  );

  if (!disability) {
    return;
  }
  disability.click();
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      applicantData.disability_status &&
      fromatStirngInLowerCase(element.textContent.trim())?.includes("ihavea")
    ) {
      element.click();
      // return true;
    }

    if (
      !applicantData.disability_status &&
      fromatStirngInLowerCase(element.textContent.trim())?.includes("idonot")
    ) {
      element.click();
      // return true;
    }
  }
  await delay(500);
};
const fillWorkAuthorizarion = async (applicantData: Applicant) => {
  const gender = document.querySelector(
    '[data-for="Do you identify by your legal gender?"]'
  ) as HTMLDivElement;

  if (!gender) {
    return;
  }
  gender.click();
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(element.textContent.trim()) === "yes"
    ) {
      element.click();
      // return true;
    }
    if (
      !applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(element.textContent.trim()) === "no"
    ) {
      element.click();
      // return true;
    }
  }
  await delay(500);
};

const fillVeteranStatus = async (applicantData: Applicant) => {
  const veteranStatus: HTMLDivElement = document.querySelector(
    '[data-for="Veteran Status"]'
  );

  let veteran = false;

  if (!veteranStatus) {
    return;
  }
  veteranStatus.click();
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    // for yes
    if (
      applicantData.veteran_status === 1 &&
      !veteran &&
      (fromatStirngInLowerCase(element.textContent.trim())?.includes(
        "amaveteran"
      ) ||
        fromatStirngInLowerCase(element.textContent.trim())?.includes(
          "amveteran"
        ))
    ) {
      veteran = true;
      element.click();
    }

    // for no
    if (
      applicantData.veteran_status === 2 &&
      !veteran &&
      fromatStirngInLowerCase(element.textContent.trim())?.includes("iamnot")
    ) {
      veteran = true;
      element.click();
    }

    if (
      applicantData.veteran_status === 3 &&
      !veteran &&
      fromatStirngInLowerCase(element.textContent.trim())?.includes(
        "identifyasaveteran"
      )
    ) {
      veteran = true;

      element.click();
    }

    //for one or more
    if (
      applicantData.veteran_status === 3 &&
      !veteran &&
      fromatStirngInLowerCase(element.textContent.trim())?.includes(
        "identifyasoneormore"
      )
    ) {
      veteran = true;
      element.click();
    }

    //   for one or more
    if (
      (applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 3 ||
        applicantData.veteran_status === 4) &&
      !veteran &&
      fromatStirngInLowerCase(element.textContent.trim())?.includes(
        "identifyasoneormore"
      )
    ) {
      veteran = true;
      element.click();
    }

    // for decline
    if (
      applicantData.veteran_status === 5 &&
      !veteran &&
      (fromatStirngInLowerCase(element.textContent.trim())?.includes(
        "selfidentify"
      ) ||
        fromatStirngInLowerCase(element.textContent.trim())?.includes(
          "dontwish"
        ) ||
        fromatStirngInLowerCase(element.textContent.trim())?.includes(
          "decline"
        ) ||
        fromatStirngInLowerCase(element.textContent.trim())?.includes(
          "notwish"
        ))
    ) {
      veteran = true;
      element.click();
    }
  }
  await delay(500);
};
export const paylocity = async (tempDiv: any, applicantData: Applicant) => {
  await fillRadioButton(applicantData);
  await fillGender(applicantData);
  await fillRace(applicantData);
  await fillVeteranStatus(applicantData);
  await fillDisability(applicantData);
  await fillWorkAuthorizarion(applicantData);
};
