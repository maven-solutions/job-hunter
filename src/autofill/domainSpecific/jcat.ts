import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

export const jcat = async (tempDiv: any, applicantData: Applicant) => {
  const phone: HTMLInputElement = document.querySelector("#phone");

  if (phone) {
    phone.value = applicantData.phone_number;
  }

  const workPermission = document.querySelector('label[for="workPermit"]');
  if (workPermission) {
    const yesButtonContainer = workPermission.nextElementSibling;
    if (!yesButtonContainer) {
      return;
    }
    const yesButton = yesButtonContainer.querySelector("label");
    if (!yesButton) {
      return;
    }
    yesButton.click();
  }
};
