import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

function getTodayDateFormatted(): string {
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString("default", { month: "short" });
  const year = today.getFullYear();

  return `${day} ${month} ${year}`;
}

const fillGender = async (applicantData: Applicant) => {
  const gender = document.querySelector(
    ".CandidateField__inputWrapper--genderId"
  ) as HTMLElement;
  if (!gender) {
    return;
  }
  const select: HTMLElement = gender.querySelector(
    ".fab-SelectToggle__toggleButton"
  );

  if (!select) {
    return;
  }
  select.click();
  handleValueChanges(select);
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="menuitem"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim()) ===
      fromatStirngInLowerCase(applicantData.gender)
    ) {
      element.click();
      // return true;
    }
  }
  await delay(600);
};

const fillDisability = async (applicantData: Applicant) => {
  const disability: HTMLElement = document.querySelector(
    ".CandidateField__inputWrapper--disabilityId"
  );
  if (!disability) {
    return;
  }
  const select: HTMLElement = disability.querySelector(
    ".fab-SelectToggle__toggleButton"
  );

  if (!select) {
    return;
  }
  select.click();
  handleValueChanges(select);
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="menuitem"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim())?.includes("yes") &&
      applicantData.disability_status
    ) {
      element.click();
    }

    if (
      fromatStirngInLowerCase(element.textContent.trim())?.includes(
        "noidont"
      ) &&
      !applicantData.disability_status
    ) {
      element.click();
    }
  }
  await delay(600);
};

const fillRace = async (applicantData: Applicant) => {
  const race: HTMLElement = document.querySelector(
    ".CandidateField--ethnicityId"
  );
  if (!race) {
    return;
  }
  const select: HTMLElement = race.querySelector(
    ".fab-SelectToggle__toggleButton"
  );

  if (!select) {
    return;
  }
  select.click();
  handleValueChanges(select);
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="menuitem"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim())?.includes(
        fromatStirngInLowerCase(applicantData.race)
      )
    ) {
      element.click();
      // return true;
    }
  }
  await delay(600);
};

const fillVeteran = async (applicantData: Applicant) => {
  const veteran: HTMLElement = document.querySelector(
    ".CandidateField--veteranStatusId"
  );
  if (!veteran) {
    return;
  }
  const allLabel = veteran.querySelectorAll("label");
  if (allLabel && allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        (applicantData.veteran_status === 1 ||
          applicantData.veteran_status === 3 ||
          applicantData.veteran_status === 4) &&
        fromatStirngInLowerCase(label.textContent) === "veteran"
      ) {
        label.click();
        handleValueChanges(label);
      }

      if (
        applicantData.veteran_status === 2 &&
        fromatStirngInLowerCase(label.textContent) === "notaveteran"
      ) {
        label.click();
        handleValueChanges(label);
      }

      if (
        applicantData.veteran_status === 5 &&
        fromatStirngInLowerCase(label.textContent)?.includes("decline")
      ) {
        label.click();
        handleValueChanges(label);
      }
    }
  }
};

const fillTodayDate = async () => {
  const date: any = document.querySelector('[name="dateAvailable"]');
  if (date) {
    date.value = getTodayDateFormatted();
    handleValueChanges(date);
  }
};

const fillAllRadioType = async (applicantData: Applicant) => {
  const allFieldset = document.querySelectorAll("fieldset.CandidateField");
  if (!allFieldset || allFieldset.length === 0) {
    return;
  }
  for (const fieldset of allFieldset) {
    const legend = fieldset.querySelector("legend");
    if (!legend) {
      return;
    }

    // for 18 years
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("yearsofage")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            applicantData.is_over_18 &&
            fromatStirngInLowerCase(label?.textContent) === "yes"
          ) {
            label.click();
          }
          if (
            !applicantData.is_over_18 &&
            fromatStirngInLowerCase(label?.textContent) === "no"
          ) {
            label.click();
          }
        }
      }
    }
  }
};

export const bamboohr = async (tempDiv: any, applicantData: Applicant) => {
  await fillGender(applicantData);
  await fillRace(applicantData);
  await fillDisability(applicantData);
  await fillVeteran(applicantData);
  await fillAllRadioType(applicantData);
  await fillTodayDate();
};
