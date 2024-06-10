import { fieldNames } from "../FromFiller/fieldsname";
import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

export const jobvite = async (tempDiv: any, applicantData: Applicant) => {
  const selectInputFields = document.querySelectorAll("select");
  if (!selectInputFields || selectInputFields.length === 0) {
    return;
  }
  let veteran = false;

  for (const select of selectInputFields) {
    const selectid = select.getAttribute("id");
    const labelElement = tempDiv.querySelector(`[for="${selectid}"]`);

    const labelText = labelElement?.textContent?.trim();
    const attributes: any = Array.from(select.attributes);
    attributes.some((attribute) => {
      // for work authorization
      if (checkIfExist(labelText, ["legally"])) {
        Array.from(select.options).find((option: any) => {
          if (fromatStirngInLowerCase(option?.text).includes("yes")) {
            option.selected = true;
            handleValueChanges(option);
            return;
          }
        });
      }
      // for disability
      if (
        checkIfExist(labelText, fieldNames.disability_status) ||
        checkIfExist(attribute.value, fieldNames.disability_status)
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text).includes("yes") &&
            applicantData.disability_status
          ) {
            option.selected = true;
            handleValueChanges(option);
            return;
          }

          if (
            fromatStirngInLowerCase(option?.text).includes("no") &&
            !applicantData.disability_status
          ) {
            option.selected = true;
            handleValueChanges(option);
            return;
          }
        });
      }

      // for veteran
      if (
        checkIfExist(labelText, fieldNames.veteran) ||
        checkIfExist(attribute.value, fieldNames.veteran)
      ) {
        Array.from(select.options).find((option: any) => {
          //for yes
          if (
            applicantData.veteran_status === 1 &&
            // !veteran &&
            (fromatStirngInLowerCase(option?.text).includes("veteran") ||
              fromatStirngInLowerCase(option?.text).includes("veteran"))
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          if (
            applicantData.veteran_status === 2 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text).includes("nota")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          // for yes
          if (
            applicantData.veteran_status === 3 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text).includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          // for yes
          if (
            applicantData.veteran_status === 3 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text).includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          //for one or more
          if (
            applicantData.veteran_status === 4 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text).includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }
          // for yes---

          if (
            applicantData.veteran_status === 1 &&
            // !veteran &&
            fromatStirngInLowerCase(option?.text).includes("veteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          //for decline
          if (
            applicantData.veteran_status === 5 &&
            // !veteran &&
            (fromatStirngInLowerCase(option?.text).includes("selfidentify") ||
              fromatStirngInLowerCase(option?.text).includes("dontwish") ||
              fromatStirngInLowerCase(option?.text).includes("decline") ||
              fromatStirngInLowerCase(option?.text).includes("notwish"))
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }
        });
      }
    });
  }

  const checkBox: HTMLInputElement = document.querySelector(
    '[ng-model="linkedInRecruiter.statusSync"]'
  );
  if (checkBox) {
    checkBox.click();
    checkBox.checked;
    handleValueChanges(checkBox);
  }
};
