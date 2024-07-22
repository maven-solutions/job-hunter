import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillEligibility = async (applicantData: Applicant) => {
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

    if (questionText?.includes("legally authorized")) {
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

const fillVisa = async (applicantData: Applicant) => {
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
    if (
      questionText?.includes("sponsorship") ||
      questionText?.includes("visa")
    ) {
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

const fillAllRadioType = async (applicantData: Applicant) => {
  const allFieldset = document.querySelectorAll("fieldset");
  if (!allFieldset || allFieldset.length === 0) {
    return;
  }
  for (const fieldset of allFieldset) {
    const legend = fieldset.querySelector("legend");
    if (!legend) {
      return;
    }
    // for gender
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("gender")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            fromatStirngInLowerCase(label?.textContent) === applicantData.gender
          ) {
            label.click();
          }
        }
      }
    }
    // race
    if (fromatStirngInLowerCase(legend?.textContent)?.includes("race")) {
      const allLabel = fieldset.querySelectorAll("label");
      if (allLabel && allLabel.length > 0) {
        for (const label of allLabel) {
          if (
            fromatStirngInLowerCase(label?.textContent)?.includes(
              fromatStirngInLowerCase(applicantData.race)
            )
          ) {
            label.click();
          }
        }
      }
    }
  }
};

const fillDisability = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector(
    "select.SelectFormField.WizardFieldInputContainer.WizardFieldInput"
  );

  if (!select) {
    return;
  }
  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text)?.includes("yes") &&
      applicantData.disability_status
    ) {
      option.selected = true;
      handleValueChanges(select);
    }

    if (
      fromatStirngInLowerCase(option?.text)?.includes("no") &&
      !applicantData.disability_status
    ) {
      option.selected = true;
      handleValueChanges(select);
    }
  });
};
export const avature = async (tempDiv: any, applicantData: Applicant) => {
  await fillEligibility(applicantData);
  await fillVisa(applicantData);
  await resumeUpload();
  await fillAllRadioType(applicantData);
  await fillDisability(applicantData);
};
