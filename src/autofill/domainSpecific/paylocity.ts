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
      return true;
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
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        fromatStirngInLowerCase(applicantData.race)
      ) &&
      !race
    ) {
      element.click();
      return true;
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
      fromatStirngInLowerCase(element.textContent.trim()).includes("yes") &&
      applicantData.disability_status
    ) {
      element.click();
      return true;
    }

    if (
      fromatStirngInLowerCase(element.textContent.trim()).includes("no") &&
      !applicantData.disability_status
    ) {
      element.click();
      return true;
    }
  }
  await delay(500);
};
export const paylocity = async (tempDiv: any, applicantData: Applicant) => {
  fillRadioButton(applicantData);
  fillGender(applicantData);
  fillRace(applicantData);
  fillDisability(applicantData);
};
