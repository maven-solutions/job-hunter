import { Applicant } from "../data";
import { fieldNames } from "../FromFiller/fieldsname";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const selectDataExtract = (tempDiv: any, applicantData: Applicant) => {
  let gender = false;
  let veteran = false;
  // Extract input fields of type "select"

  // Replace 'form_id' with the actual ID of the form inside the iframe

  //   const selectInputFields = iframeForm.querySelectorAll("select");
  const selectInputFields = tempDiv.querySelectorAll("select");
  if (!selectInputFields || selectInputFields.length === 0) {
    return;
  }

  for (const select of selectInputFields) {
    const selectid = select.getAttribute("id");
    const labelElement = tempDiv.querySelector(`[for="${selectid}"]`);

    const labelText = labelElement?.textContent?.trim();
    const attributes: any = Array.from(select.attributes);
    attributes.some((attribute) => {
      // for gender
      if (
        checkIfExist(labelText, fieldNames.gender) ||
        checkIfExist(attribute.value, fieldNames.gender)
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text) ===
              fromatStirngInLowerCase(applicantData.gender) &&
            !gender
          ) {
            option.selected = true;
            handleValueChanges(select);

            gender = true;
            return true;
          }
        });
      }

      // for is 18 years
      if (
        checkIfExist(labelText, fieldNames.is_over_18) ||
        checkIfExist(attribute.value, fieldNames.is_over_18) ||
        labelText?.toLowerCase()?.includes("18 years")
      ) {
        Array.from(select.options).find((option: any) => {
          if (fromatStirngInLowerCase(option?.text) === "yes") {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }
        });
      }

      // for work authorizaion
      if (
        checkIfExist(labelText, fieldNames.us_work_authorization) ||
        checkIfExist(attribute.value, fieldNames.us_work_authorization)
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(option?.text) === "yes"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }

          if (
            !applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(option?.text) === "no"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }
        });
      }

      // for sponsersship
      if (
        checkIfExist(labelText, fieldNames.sponsorship) ||
        checkIfExist(attribute.value, fieldNames.sponsorship)
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text) === "yes"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }

          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text) === "no"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
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
            handleValueChanges(select);
            return true;
          }

          if (
            fromatStirngInLowerCase(option?.text).includes("no") &&
            !applicantData.disability_status
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }
        });
      }

      // for hispanico and lation
      if (
        checkIfExist(labelText, ["ethnicity", "hispanic", "latino"]) ||
        checkIfExist(attribute.value, ["ethnicity", "hispanic", "latino"])
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.hispanic_or_latino &&
            (fromatStirngInLowerCase(option?.text) === "yes" ||
              fromatStirngInLowerCase(option?.text) === "hispanicorlatino")
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }

          if (
            !applicantData.hispanic_or_latino &&
            (fromatStirngInLowerCase(option?.text) === "no" ||
              fromatStirngInLowerCase(option?.text) === "nothispanicorlatino")
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }
        });
      }

      // for race
      if (
        checkIfExist(labelText, ["race", "ethnicity"]) ||
        checkIfExist(attribute?.value, ["race", "ethnicity"])
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text) &&
            fromatStirngInLowerCase(option?.text).includes(
              fromatStirngInLowerCase(applicantData?.race)
            )
          ) {
            option.selected = true;
            handleValueChanges(select);

            return true;
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
            (applicantData.veteran_status === 1 ||
              applicantData.veteran_status === 3 ||
              applicantData.veteran_status === 4) &&
            (fromatStirngInLowerCase(option?.text).includes("yes") ||
              fromatStirngInLowerCase(option?.text).includes("amaveteran") ||
              fromatStirngInLowerCase(option?.text).includes("amveteran"))
          ) {
            option.selected = true;
            handleValueChanges(select);
            veteran = true;
          }

          if (
            (applicantData.veteran_status === 2 ||
              applicantData.veteran_status === 5) &&
            !veteran &&
            (fromatStirngInLowerCase(option?.text).includes("iamnot") ||
              fromatStirngInLowerCase(option?.text).includes("no"))
          ) {
            option.selected = true;
            handleValueChanges(select);
            veteran = true;
          }

          // for yes
          if (
            applicantData.veteran_status === 3 &&
            !veteran &&
            fromatStirngInLowerCase(option?.text).includes("identifyasaveteran")
          ) {
            option.selected = true;
            handleValueChanges(select);
            veteran = true;
          }

          // for yes
          if (
            applicantData.veteran_status === 3 &&
            !veteran &&
            fromatStirngInLowerCase(option?.text).includes(
              "identifyasoneormore"
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
            veteran = true;
          }

          //for one or more
          if (
            applicantData.veteran_status === 4 &&
            !veteran &&
            fromatStirngInLowerCase(option?.text).includes(
              "identifyasoneormore"
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
            veteran = true;
          }
          // for yes---

          if (
            applicantData.veteran_status === 1 &&
            !veteran &&
            fromatStirngInLowerCase(option?.text).includes(
              "identifyasoneormore"
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
            veteran = true;
          }

          //for decline
          if (
            applicantData.veteran_status === 5 &&
            !veteran &&
            (fromatStirngInLowerCase(option?.text).includes("selfidentify") ||
              fromatStirngInLowerCase(option?.text).includes("dontwish") ||
              fromatStirngInLowerCase(option?.text).includes("decline") ||
              fromatStirngInLowerCase(option?.text).includes("notwish"))
          ) {
            option.selected = true;
            handleValueChanges(select);
            veteran = true;
          }
        });
      }
    });
  }
};
export const icims = async (tempDiv: any, applicantData: Applicant) => {
  const acceptButton = tempDiv.querySelector('[for="accept_gdpr"]');
  if (acceptButton) {
    acceptButton.click();
    await delay(1000);
  }

  const nextButton = tempDiv.querySelector(
    'input[id="enterEmailSubmitButton"]'
  );
  if (nextButton) {
    nextButton.click();
    await delay(1000);
  }
  // await fillGender(applicantData, tempDiv);
  // await fillRace(applicantData, tempDiv);
  // await FillDisability(applicantData, tempDiv);
  // await FillVeteran(applicantData, tempDiv);
  await selectDataExtract(tempDiv, applicantData);
};
