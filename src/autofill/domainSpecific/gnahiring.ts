import { isEmptyArray } from "../../utils/helper";
import { Applicant } from "../data";
import { delay, handleValueChanges } from "../helper";

const fillBasicInfo = async (applicantData: Applicant) => {
  const fname: any = document.querySelector('[name="user.first_name"]');
  if (fname) {
    fname.value = applicantData.first_name;
    handleValueChanges(fname);
  }

  const lname: any = document.querySelector('[name="user.last_name"]');
  if (lname) {
    lname.value = applicantData.last_name;
    handleValueChanges(lname);
  }

  const email: any = document.querySelector('[name="user.email"]');
  if (email) {
    email.value = applicantData.email_address;
    handleValueChanges(email);
  }

  const phone: any = document.querySelector('[name="user.phone"]');
  if (phone) {
    phone.value = applicantData.phone_number;
    handleValueChanges(phone);
  }

  const city: any = document.querySelector('[name="user.city"]');
  if (city) {
    city.value = applicantData.city;
    handleValueChanges(city);
  }
  await delay(500);
  const zip: any = document.querySelector('[name="user.zip"]');
  if (zip) {
    zip.value = applicantData.zip_code;
    handleValueChanges(zip);
  }

  const linkedin: any = document.querySelector('[name="user.linkedin_url"]');
  if (linkedin) {
    linkedin.value = applicantData.linkedin_url;
    handleValueChanges(linkedin);
  }

  await delay(500);

  const adress: any = document.querySelector('[name="user.address1"]');
  if (adress) {
    adress.value = applicantData.address;
    handleValueChanges(adress);
  }
  await delay(500);

  const adress2: any = document.querySelector('[name="user.address2"]');
  if (adress2) {
    adress2.value = applicantData.address;
    handleValueChanges(adress2);
  }
};

const fillSponshership = (applicantData: Applicant) => {
  const allQuestionLable: any = document.querySelectorAll("label");
  if (isEmptyArray(allQuestionLable)) return;
  for (const question of allQuestionLable) {
    if (question) {
      const text = question?.textContent;
      if (text && text?.includes("require employment visa sponsorship")) {
        const parentDiv = question.parentElement;
        if (parentDiv) {
          const answerDiv = parentDiv?.querySelector(".form-input-container ");
          const allAnswer = answerDiv?.querySelectorAll(
            ".checkbox-option-label"
          );

          if (allAnswer.length > 1) {
            const ans1 = allAnswer[0];
            const ans2 = allAnswer[1];
            if (applicantData.sponsorship_required) {
              ans1?.click();
            }
            if (!applicantData.sponsorship_required) {
              ans2?.click();
            }
          }
        }
      }
    }
  }
};

const fillUsWorkPermission = (applicantData: Applicant) => {
  const allQuestionLable: any = document.querySelectorAll("label");
  if (isEmptyArray(allQuestionLable)) return;
  for (const question of allQuestionLable) {
    if (question) {
      const text = question?.textContent;
      if (text && text?.includes("authorized to work")) {
        const parentDiv = question.parentElement;
        if (parentDiv) {
          const answerDiv = parentDiv?.querySelector(".form-input-container ");
          const allAnswer = answerDiv?.querySelectorAll(".radio-option-label");

          if (allAnswer.length > 1) {
            const ans1 = allAnswer[0];
            const ans2 = allAnswer[1];
            if (applicantData.us_work_authoriztaion) {
              ans1?.click();
            }
            if (!applicantData.us_work_authoriztaion) {
              ans2?.click();
            }
          }
        }
      }
    }
  }
};
export const gnahiring = async (tempDiv: any, applicantData: Applicant) => {
  await fillBasicInfo(applicantData);
  await fillSponshership(applicantData);
  await fillUsWorkPermission(applicantData);
  ///
};
