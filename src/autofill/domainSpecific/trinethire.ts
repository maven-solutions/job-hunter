import { isEmptyArray } from "../../utils/helper";
import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillMale = () => {
  const male: any = document.getElementById("applicant_gender_male");
  if (!male) return;
  male?.focus(); // Autofocus on the male? field
  male?.click();
  male.checked = true;
  handleValueChanges(male);
};

const fillFemale = () => {
  const female: any = document.getElementById("applicant_gender_fefemale");
  if (!female) return;

  female?.focus(); // Autofocus on the female? field
  female?.click();
  female.checked = true;
  handleValueChanges(female);
};

const genderFiller = (applicantData: Applicant) => {
  if (fromatStirngInLowerCase(applicantData.gender) === "male") {
    fillMale();
  }
  if (fromatStirngInLowerCase(applicantData.gender) === "female") {
    fillFemale();
  }
};

const fillRace = (applicantData: Applicant) => {
  const textInputFields = document.querySelectorAll('input[type="radio"]');
  if (isEmptyArray(textInputFields)) return;

  textInputFields.forEach((element: any) => {
    const label: any = element?.getAttribute("data-label");
    if (label) {
      if (
        fromatStirngInLowerCase(label)?.includes(
          fromatStirngInLowerCase(applicantData.race)
        )
      ) {
        // Autofocus on the label field
        element?.focus(); // Autofocus on the label? field
        element?.click();
        element.checked = true;
        handleValueChanges(element);
      }
    }
  });
};

const fillDisability = (applicantData: Applicant) => {
  const textInputFields = document.querySelectorAll('input[type="radio"]');
  if (isEmptyArray(textInputFields)) return;

  textInputFields.forEach((element: any) => {
    const label: any = element?.getAttribute("data-label");
    if (label) {
      if (
        applicantData.disability_status &&
        fromatStirngInLowerCase(label)?.includes(
          fromatStirngInLowerCase("Yes, I Have A Disability")
        )
      ) {
        // Autofocus on the label field

        element?.focus(); // Autofocus on the label? field
        element?.click();
        element.checked = true;
        handleValueChanges(element);
      }

      if (
        !applicantData.disability_status &&
        fromatStirngInLowerCase(label)?.includes(
          fromatStirngInLowerCase("No, I Don’t Have A Disability")
        )
      ) {
        // Autofocus on the label field
        element?.focus(); // Autofocus on the label? field
        element?.click();
        element.checked = true;
        handleValueChanges(element);
      }
    }
  });
};

export const trinethire = async (tempDiv: any, applicantData: Applicant) => {
  await genderFiller(applicantData);
  await fillRace(applicantData);
  await fillDisability(applicantData);
};
