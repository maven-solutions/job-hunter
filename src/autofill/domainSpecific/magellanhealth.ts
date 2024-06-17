import { all } from "axios";
import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

export const magellanhealth = async (
  tempDiv: any,
  applicantData: Applicant
) => {
  const disabilityEle: HTMLElement = document.getElementById(
    "disability_heading_self_identity.disabilityStatus"
  );
  console.log("disability::", disabilityEle);
  const allLabel = disabilityEle.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    if (
      label &&
      applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("yesihave")
    ) {
      label.click();
    }

    if (
      label &&
      applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("idonothave")
    ) {
      label.click();
    }
  }

  //   if (phone) {
  //     phone.value = applicantData.phone_number;
  //     phone.focus(); // Autofocus on the input field
  //     phone.click();
  //     phone.select();
  //     handleValueChanges(phone);
  //   }
};
