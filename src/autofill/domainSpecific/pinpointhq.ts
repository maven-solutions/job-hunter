import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

export const pinpointhq = async (tempDiv: any, applicantData: Applicant) => {
  const phone: any = document.getElementById(
    "application_form_application_phone"
  );

  if (phone) {
    phone.value = applicantData.phone_number;
    phone.focus(); // Autofocus on the input field
    phone.click();
    phone.select();
    handleValueChanges(phone);
  }
};
