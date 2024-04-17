import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const fillName = (applicantData: Applicant) => {
  const nameEle: any = document.querySelector(
    '[name="eeo[disabilitySignature]"]'
  );
  if (!nameEle) {
    return;
  }
  nameEle.focus(); // Autofocus on the nameEle field
  nameEle.click();
  nameEle.select();
  nameEle.value = applicantData.full_name;
  handleValueChanges(nameEle);
};

const fillDate = (applicantData: Applicant) => {
  const nameEle: any = document.querySelector(
    '[name="eeo[disabilitySignatureDate]"]'
  );
  if (!nameEle) {
    return;
  }
  nameEle.focus(); // Autofocus on the nameEle field
  nameEle.click();
  nameEle.select();
  const currentDate = new Date();

  // Format the date as MM/DD/YYYY
  const formattedDate =
    ("0" + (currentDate.getMonth() + 1)).slice(-2) +
    "/" +
    ("0" + currentDate.getDate()).slice(-2) +
    "/" +
    currentDate.getFullYear();
  nameEle.value = formattedDate;
  handleValueChanges(nameEle);
};

const fillRace = (applicantData: Applicant) => {
  const textInputFields = document.querySelectorAll('input[type="radio"]');

  textInputFields.forEach((input) => {
    const labelElement = input.nextElementSibling;
    const labelText = labelElement?.textContent?.trim() ?? "";

    if (
      fromatStirngInLowerCase(labelText).includes(
        fromatStirngInLowerCase(applicantData.race)
      )
    ) {
      input.parentElement.click();
      handleValueChanges(input);
      return;
    }
  });
};
export const jobsLever = (tempDiv: any, applicantData: Applicant) => {
  fillName(applicantData);
  fillDate(applicantData);
  fillRace(applicantData);
};
