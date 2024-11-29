import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

export const mvpworks = async (tempDiv: any, applicantData: Applicant) => {
  const fullName: any = document.getElementById("awsm-applicant-name");
  if (fullName) {
    fullName.value = applicantData.full_name;
    handleValueChanges(fullName);
  }
};
