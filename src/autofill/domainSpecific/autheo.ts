import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

export const autheo = async (tempDiv: any, applicantData: Applicant) => {
  const city: any = document.getElementById("application_location");
  if (city) {
    city.value = applicantData.city;
    city.focus(); // Autofocus on the input field
    city.click();
    city.select();
    handleValueChanges(city);
  }
};
