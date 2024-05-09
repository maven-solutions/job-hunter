import { Applicant } from "../data";
import { delay } from "../helper";

const fillIsAdult = (applicantData: Applicant) => {
  const radioEle = document.querySelector("#question_row_10532307");
  const spanListContainer = radioEle.querySelector(".element");
  const spanList = spanListContainer.children;
  const yes: any = spanList[1];
  const No: any = spanList[2];
  if (applicantData.is_over_18) {
    yes.click();
  }
  if (!applicantData.is_over_18) {
    No.click();
  }
};

const isAuthorizedToWorkInUs = (applicantData: Applicant) => {
  const radioEle = document.querySelector("#question_row_10532807");
  const spanListContainer = radioEle.querySelector(".element");

  console.log("spanListContainer::", spanListContainer);
  const spanList = spanListContainer.children;
  const yes: any = spanList[1];
  const No: any = spanList[2];

  console.log("spanList::", spanList);
  console.log("spanyesList::", yes);
  console.log("No::", No);
  if (applicantData.us_work_authoriztaion) {
    yes.click();
  }
  if (!applicantData.us_work_authoriztaion) {
    No.click();
  }
};

export const adp = async (tempDiv: any, applicantData: Applicant) => {
  fillIsAdult(applicantData);
  await delay(500);
  isAuthorizedToWorkInUs(applicantData);
};
