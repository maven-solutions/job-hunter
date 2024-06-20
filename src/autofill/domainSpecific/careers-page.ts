import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

export const careersPage = async (tempDiv: any, applicantData: Applicant) => {
  const input: any = document.getElementById("field1185086");
  if (input) {
    input.value = applicantData.full_name;
    input.focus(); // Autofocus on the input field
    input.click();
    input.select();
    handleValueChanges(input);
  }
};
