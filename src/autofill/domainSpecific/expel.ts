import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

export const expel = async (tempDiv: any, applicantData: Applicant) => {
  const phone: any = document.getElementById("first_name");
  // console.log("firstanme::", phone);
  if (phone) {
    phone.value = applicantData.first_name;
    phone.focus(); // Autofocus on the input field
    phone.click();
    phone.select();
    handleValueChanges(phone);
  }
};
