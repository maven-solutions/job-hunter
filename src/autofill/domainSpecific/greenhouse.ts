import { fieldNames } from "../FromFiller/fieldsname";
import { Applicant, Education } from "../data";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const checkAdultAge = (applicantData: Applicant) => {
  let isOver18 = false;

  const select: any = document.querySelector(
    "#job_application_answers_attributes_3_boolean_value"
  );
  if (!select) {
    return;
  }
  Array.from(select.options).find((option: any) => {
    if (
      applicantData.is_over_18 &&
      fromatStirngInLowerCase(option?.text).includes("yes")
    ) {
      option.selected = true;
      handleValueChanges(option);
      isOver18 = true;
      return true;
    }

    if (
      !applicantData.is_over_18 &&
      fromatStirngInLowerCase(option?.text).includes("no")
    ) {
      option.selected = true;
      handleValueChanges(option);
      isOver18 = true;
      return true;
    }
  });
};

const usWorkAuthorization = (applicantData: Applicant) => {
  let workAuthorization = false;

  const select: any = document.querySelector(
    "#job_application_answers_attributes_4_boolean_value"
  );
  if (!select) {
    return;
  }
  Array.from(select.options).find((option: any) => {
    if (
      applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(option?.text).includes("yes")
    ) {
      option.selected = true;
      handleValueChanges(option);
      workAuthorization = true;
      return true;
    }

    if (
      !applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(option?.text).includes("no")
    ) {
      option.selected = true;
      handleValueChanges(option);
      workAuthorization = true;
      return true;
    }
  });
};

const fillEducation = async (educationData: Education[]) => {
  //---
  // console.log("educationData::", educationData);

  const addEducationButton = document.getElementById("add_education");

  for (let index = 0; index < educationData.length - 1; index++) {
    addEducationButton.click();
    await delay(1000);
  }
  await delay(1000);

  const selectInputFields: any = document.querySelectorAll(
    '[name="job_application[educations][][degree_id]"]'
  );

  for (const [index, select] of selectInputFields.entries()) {
    const education = educationData[index];
    Array.from(select.options).find((option: any) => {
      const optionText = option?.text ?? "";
      if (
        fromatStirngInLowerCase(optionText)?.includes(
          fromatStirngInLowerCase(education?.degree)
        ) &&
        !select.hasAttribute("ci_data_filled")
      ) {
        select.setAttribute("ci_data_filled", "true");
        option.selected = true;
        handleValueChanges(option);
      }
    });

    // if (index + 1 === educationData.length) {
    //   return;
    // }
  }

  const selectInputFieldsForMajor: any = document.querySelectorAll(
    '[name="job_application[educations][][discipline_id]"]'
  );

  for (const [index, select] of selectInputFieldsForMajor.entries()) {
    const education = educationData[index];
    Array.from(select.options).find((option: any) => {
      const optionText = option?.text ?? "";

      if (
        fromatStirngInLowerCase(optionText) ===
          fromatStirngInLowerCase(education?.major) &&
        !select.hasAttribute("ci_data_filled")
      ) {
        select.setAttribute("ci_data_filled", "true");
        option.selected = true;
        handleValueChanges(option);
      }
    });

    // if (index + 1 === educationData.length) {
    //   return;
    // }
  }
};

export const greenHouse = (tempDiv: any, applicantData: Applicant) => {
  checkAdultAge(applicantData);
  usWorkAuthorization(applicantData);
  fillEducation(applicantData.education);
};
