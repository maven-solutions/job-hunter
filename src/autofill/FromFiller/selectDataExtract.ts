import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import { fieldNames } from "./fieldsname";

const countryHandler = (option, applicantData, country) => {
  if (
    fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase(applicantData.country) &&
    !country
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase("america") &&
    !country
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(option?.text) === fromatStirngInLowerCase("usa") &&
    !country
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase("unitedstates") &&
    !country
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase("unitedstatesofamerica") &&
    !country
  ) {
    return true;
  }
};

export const selectDataExtract = (
  tempDiv: any,
  applicantData: Applicant,
  iframe: boolean
) => {
  let country = false;
  let state = false;
  let degree = false;
  let collage = false;
  // Extract input fields of type "select"

  // Replace 'form_id' with the actual ID of the form inside the iframe

  //   const selectInputFields = iframeForm.querySelectorAll("select");
  const selectInputFields = tempDiv.querySelectorAll("select");
  console.log("selectInputFields::", selectInputFields);
  if (!selectInputFields || selectInputFields.length === 0) {
    return;
  }

  selectInputFields.forEach((input) => {
    // Extract all attributes
    // filling country data
    Array.from(input.options).find((option: any) => {
      if (countryHandler(option, applicantData, country)) {
        // console.log("options--", option);
        // console.log("text--", option.text);
        // console.log("value--", option.value);
        option.selected = true;
        handleValueChanges(option);
        country = true;
        return true;
      }
    });

    // filling state data
    Array.from(input.options).find((option: any) => {
      if (
        fromatStirngInLowerCase(option?.text) ===
          fromatStirngInLowerCase(applicantData.state) &&
        !state
      ) {
        // console.log("options--", option);
        // console.log("text--", option.text);
        // console.log("value--", option.value);
        option.selected = true;
        handleValueChanges(option);
        state = true;
        return true;
      }
    });

    // filling  degree data
    // Ensure applicantData is defined
    if (
      applicantData &&
      applicantData.education &&
      applicantData.education.length > 0
    ) {
      // Ensure education array has at least one item
      const maxEducation = applicantData.education[0];
      const school = applicantData.education[0]?.school;
      if (maxEducation) {
        const educationField = maxEducation.field;
        Array.from(input.options).find((option: any) => {
          if (
            option &&
            fromatStirngInLowerCase(option.text) ===
              fromatStirngInLowerCase(educationField) &&
            !degree
          ) {
            // console.log("options::--", option);
            // console.log("text--", option.text);
            // console.log("value--", option.value);
            // console.log("educationField::--", educationField);
            option.selected = true;
            handleValueChanges(option);
            degree = true;
            return true;
          }
        });
      }

      if (school) {
        Array.from(input.options).find((option: any) => {
          if (
            option &&
            fromatStirngInLowerCase(option.text) ===
              fromatStirngInLowerCase(school) &&
            !collage
          ) {
            // console.log("options--", option);
            // console.log("text--", option.text);
            // console.log("value--", option.value);
            option.selected = true;
            handleValueChanges(option);
            collage = true;
            return true;
          }
        });
      }
    }
  });
};

const customSelectFiller = (tempDiv1, applicantData, iframe) => {
  const tempDiv = document.querySelector("body");
  const selectButtonFields2: any = tempDiv.querySelector(
    'button[aria-haspopup="listbox"'
  );
  selectButtonFields2.click();

  setTimeout(() => {
    const buttonOption: any = document.querySelectorAll('[role="option"]');
    buttonOption.forEach((element) => {
      if (
        fromatStirngInLowerCase(element.textContent.trim()) ===
        fromatStirngInLowerCase("Master")
      ) {
        console.log("Master::");
        element.click();
        return true;
      }
    });
  }, 1000);
};
