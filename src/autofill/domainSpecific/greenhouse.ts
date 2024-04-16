import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const checkAdultAge = (applicantData: Applicant) => {
  let isOver18 = false;

  const select: any = document.querySelector(
    "#job_application_answers_attributes_3_boolean_value"
  );
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

export const greenHouse = (tempDiv: any, applicantData: Applicant) => {
  checkAdultAge(applicantData);
  usWorkAuthorization(applicantData);
};
