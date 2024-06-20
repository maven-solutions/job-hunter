import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase } from "../helper";

const fillEligibility = (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll(
    'label[class="datasetfieldLabel"]'
  );

  for (const singleField of allLabel) {
    const questionField = singleField?.children[1];
    if (!questionField) {
      return;
    }
    const questionText = questionField.textContent.trim();
    if (!questionText) {
      return;
    }

    if (questionText.includes("legally authorized")) {
      const select = singleField.querySelector("select");
      Array.from(select.options).find((option: any) => {
        if (
          applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase("yes")
        ) {
          option.selected = true;
          return true;
        }

        if (
          !applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase("no")
        ) {
          option.selected = true;
          return true;
        }
      });
    }
  }
};

const fillVisa = (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll('label[class="fieldLabel"]');
  for (const singleField of allLabel) {
    const questionField = singleField?.children[0];
    if (!questionField) {
      return;
    }
    const questionText = questionField.textContent.trim();
    if (!questionText) {
      return;
    }
    if (questionText.includes("sponsorship") || questionText.includes("visa")) {
      const select = singleField.querySelector("select");
      Array.from(select.options).find((option: any) => {
        if (
          applicantData.sponsorship_required &&
          fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase("yes")
        ) {
          option.selected = true;
          return true;
        }

        if (
          !applicantData.sponsorship_required &&
          fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase("no")
        ) {
          option.selected = true;
          return true;
        }
      });
    }
  }
};

const resumeUpload = async () => {
  const button: any = document.querySelector('button[id="uploadFileResume"]');
  if (!button) {
    return;
  }
  await delay(2000);
  button.click();
  await delay(3000);
};

export const avature = async (tempDiv: any, applicantData: Applicant) => {
  fillEligibility(applicantData);
  fillVisa(applicantData);
  resumeUpload();
};
