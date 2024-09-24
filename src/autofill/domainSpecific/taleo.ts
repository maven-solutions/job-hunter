import { isEmptyArray } from "../../utils/helper";
import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillSelectData = (applicantData: Applicant) => {
  const selectInputFields = document.querySelectorAll("select");
  if (isEmptyArray(selectInputFields)) return;
  for (const select of selectInputFields) {
    const id = select?.getAttribute("id");

    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      const text = label?.textContent;
      // for phone type
      if (text && fromatStirngInLowerCase(text)?.includes("primarynumber")) {
        Array.from(select.options).find((option: any) => {
          if (fromatStirngInLowerCase(option?.text)?.includes("cellular")) {
            option.selected = true;
            handleValueChanges(select);
            // return true;
          }
        });
      }

      // for higest level education
      if (
        text &&
        fromatStirngInLowerCase(text)?.includes(
          fromatStirngInLowerCase("education")
        )
      ) {
        console.log("educatio text::", text);

        Array.from(select.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text)?.includes(
              fromatStirngInLowerCase(applicantData.higher_education)
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
            //   return true;
          }
        });
      }

      // for veteran
      if (text && fromatStirngInLowerCase(text)?.includes("veteran")) {
        Array.from(select.options).find((option: any) => {
          if (
            (applicantData.veteran_status === 1 ||
              applicantData.veteran_status === 3 ||
              applicantData.veteran_status === 4) &&
            fromatStirngInLowerCase(option?.text)?.includes("yes")
          ) {
            option.selected = true;
            handleValueChanges(select);
            //   return true;
          }
          if (
            applicantData.veteran_status === 2 &&
            fromatStirngInLowerCase(option?.text)?.includes("no")
          ) {
            option.selected = true;
            handleValueChanges(select);
            //   return true;
          }

          if (
            applicantData.veteran_status === 5 &&
            fromatStirngInLowerCase(option?.text)?.includes("notspecified")
          ) {
            option.selected = true;
            handleValueChanges(select);
            //   return true;
          }
        });
      }

      // disablity
      if (text && fromatStirngInLowerCase(text)?.includes("disability")) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.disability_status &&
            fromatStirngInLowerCase(option?.text)?.includes(
              fromatStirngInLowerCase("yes")
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
            //   return true;
          }

          if (
            !applicantData.disability_status &&
            fromatStirngInLowerCase(option?.text) === "no"
          ) {
            option.selected = true;
            handleValueChanges(select);
            //   return true;
          }
        });
      }

      // disablity status
      if (
        text &&
        fromatStirngInLowerCase(text) ===
          fromatStirngInLowerCase("disabilitystatusrequired")
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.disability_status &&
            fromatStirngInLowerCase(option?.text)?.includes(
              fromatStirngInLowerCase("yes")
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
          }

          if (
            !applicantData.disability_status &&
            fromatStirngInLowerCase(option?.text).includes(
              fromatStirngInLowerCase("No, I do not have a disability")
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
          }
        });
      }

      // for higest level education
      if (
        text &&
        fromatStirngInLowerCase(text)?.includes(
          fromatStirngInLowerCase("ethnicity")
        )
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.hispanic_or_latino &&
            fromatStirngInLowerCase(option?.text)?.includes(
              fromatStirngInLowerCase("Hispanic or Latino")
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
          }

          if (
            !applicantData.hispanic_or_latino &&
            fromatStirngInLowerCase(option?.text)?.includes(
              fromatStirngInLowerCase("Not Hispanic or Latino")
            )
          ) {
            option.selected = true;
            handleValueChanges(select);
          }
        });
      }
    }
  }
};

export const taleo = async (tempDiv: any, applicantData: Applicant) => {
  await fillSelectData(applicantData);
};
