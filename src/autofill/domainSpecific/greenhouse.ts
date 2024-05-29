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

  const allLabel = document.querySelectorAll("label");
  if (allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        label.textContent.trim().includes("18 years") ||
        label.textContent.trim().toLowerCase().includes("adult")
      ) {
        const select = label.querySelector("select");
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
        return;
      }
    }
  }
};

const usWorkAuthorization = (applicantData: Applicant) => {
  let workAuthorization = false;

  // });

  const allLabel = document.querySelectorAll("label");
  if (allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        label.textContent
          .trim()
          .includes("legally authorized to work in the United States") ||
        label.textContent
          .trim()
          .toLowerCase()
          .includes("legally authorized to work in the united states")
      ) {
        const select = label.querySelector("select");
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
        return;
      }
    }
  }
};

const sponsorship = (applicantData: Applicant) => {
  let workAuthorization = false;

  // });

  const allLabel = document.querySelectorAll("label");
  if (allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        label.textContent.trim().toLowerCase().includes("sponsorship") ||
        label.textContent.trim().toLowerCase().includes("visa")
      ) {
        const select = label.querySelector("select");
        if (!select) {
          return;
        }
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text).includes("yes")
          ) {
            option.selected = true;
            handleValueChanges(option);
            workAuthorization = true;
            return true;
          }

          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text).includes("no")
          ) {
            option.selected = true;
            handleValueChanges(option);
            workAuthorization = true;
            return true;
          }
        });
        // return;
      }

      if (
        label.textContent
          .trim()
          .toLowerCase()
          .includes("immigration sponsorship")
      ) {
        const select = label.querySelector("select");
        if (!select) {
          return;
        }
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text).includes("yes")
          ) {
            option.selected = true;
            handleValueChanges(option);
            workAuthorization = true;
            return true;
          }

          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text).includes("no")
          ) {
            option.selected = true;
            handleValueChanges(option);
            workAuthorization = true;
            return true;
          }
        });
        return;
      }
    }
  }
};

const immigrationsponsorship = (applicantData: Applicant) => {
  let workAuthorization = false;

  // });

  const allLabel = document.querySelectorAll("label");
  if (allLabel.length > 0) {
    for (const label of allLabel) {
      if (
        label.textContent.trim().toLowerCase().includes("h1b") ||
        label.textContent.trim().toLowerCase().includes("f1") ||
        label.textContent.trim().toLowerCase().includes("h4")
      ) {
        const select = label.querySelector("select");
        if (!select) {
          return;
        }
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text).includes("yes")
          ) {
            option.selected = true;
            handleValueChanges(option);
            return true;
          }

          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text).includes("no")
          ) {
            option.selected = true;
            handleValueChanges(option);
            return true;
          }
        });
        return;
      }
    }
  }
};
const fillEducation = async (educationData: Education[]) => {
  //---
  // console.log("educationData::", educationData);

  const addEducationButton = document.getElementById("add_education");
  if (!addEducationButton) {
    return;
  }
  for (let index = 0; index < educationData.length - 1; index++) {
    addEducationButton.click();
    await delay(1000);
  }
  await delay(1000);

  const selectInputFields: any = document.querySelectorAll(
    '[name="job_application[educations][][degree_id]"]'
  );
  if (!selectInputFields) {
    return;
  }
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
  if (!selectInputFieldsForMajor) {
    return;
  }

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
  sponsorship(applicantData);
  immigrationsponsorship(applicantData);
  fillEducation(applicantData.education);
};
