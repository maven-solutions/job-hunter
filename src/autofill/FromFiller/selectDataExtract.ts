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
  let gender = false;
  let veteran = false;
  // Extract input fields of type "select"

  // Replace 'form_id' with the actual ID of the form inside the iframe

  //   const selectInputFields = iframeForm.querySelectorAll("select");
  const selectInputFields = document.querySelectorAll("select");
  if (!selectInputFields || selectInputFields.length === 0) {
    return;
  }

  selectInputFields.forEach((input) => {
    // Extract all attributes
    // filling country data
    Array.from(input.options).find((option: any) => {
      if (countryHandler(option, applicantData, country)) {
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
        option.selected = true;
        handleValueChanges(option);
        state = true;
        return true;
      }
    });

    // filling  degree data
    // Ensure applicantData is defined
    // if (
    //   applicantData &&
    //   applicantData.education &&
    //   applicantData.education.length > 0
    // ) {
    //   // Ensure education array has at least one item
    //   const maxEducation = applicantData.education[0];
    //   const school = applicantData.education[0]?.school;
    //   if (maxEducation) {
    //     const educationField = maxEducation.field;
    //     Array.from(input.options).find((option: any) => {
    //       if (
    //         option &&
    //         fromatStirngInLowerCase(option.text) ===
    //           fromatStirngInLowerCase(educationField) &&
    //         !degree
    //       ) {
    //         option.selected = true;
    //         handleValueChanges(option);
    //         degree = true;
    //         return true;
    //       }
    //     });
    //   }

    //   if (school) {
    //     Array.from(input.options).find((option: any) => {
    //       if (
    //         option &&
    //         fromatStirngInLowerCase(option.text) ===
    //           fromatStirngInLowerCase(school) &&
    //         !collage
    //       ) {
    //         // console.log("options--", option);
    //         // console.log("text--", option.text);
    //         // console.log("value--", option.value);
    //         option.selected = true;
    //         handleValueChanges(option);
    //         collage = true;
    //         return true;
    //       }
    //     });
    //   }
    // }
  });

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
            handleValueChanges(option);
            gender = true;
            return true;
          }
        });
      }

      // for phone type
      if (
        checkIfExist(labelText, fieldNames.is_over_18) ||
        checkIfExist(attribute.value, fieldNames.is_over_18)
      ) {
        Array.from(select.options).find((option: any) => {
          if (fromatStirngInLowerCase(option?.text) === "yes") {
            option.selected = true;
            handleValueChanges(option);
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
            handleValueChanges(option);
            return true;
          }

          if (
            fromatStirngInLowerCase(option?.text).includes("no") &&
            !applicantData.disability_status
          ) {
            option.selected = true;
            handleValueChanges(option);
            gender = true;
            return true;
          }
        });
      }

      // for race
      if (
        checkIfExist(labelText, fieldNames.race) ||
        checkIfExist(attribute.value, fieldNames.race)
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text).includes(
              fromatStirngInLowerCase(applicantData.race)
            )
          ) {
            option.selected = true;
            handleValueChanges(option);
            gender = true;
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
            applicantData.veteran_status === 1 &&
            !veteran &&
            (fromatStirngInLowerCase(option?.text).includes("amaveteran") ||
              fromatStirngInLowerCase(option?.text).includes("amveteran"))
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          if (
            applicantData.veteran_status === 2 &&
            !veteran &&
            fromatStirngInLowerCase(option?.text).includes("iamnot")
          ) {
            option.selected = true;
            handleValueChanges(option);
            veteran = true;
          }

          // for yes
          if (
            applicantData.veteran_status === 3 &&
            !veteran &&
            fromatStirngInLowerCase(option?.text).includes("identifyasaveteran")
          ) {
            option.selected = true;
            handleValueChanges(option);
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
            handleValueChanges(option);
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
            handleValueChanges(option);
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
            handleValueChanges(option);
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
            handleValueChanges(option);
            veteran = true;
          }
        });
      }
    });
  }
};
