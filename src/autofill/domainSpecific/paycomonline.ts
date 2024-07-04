import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

const fillTextFielld = (applicantData: Applicant) => {
  const firstNme: any = document.querySelector('[name="firstName"]');
  if (firstNme) {
    firstNme.value = applicantData.first_name;
    handleValueChanges(firstNme);
  }
};

export const paycomonline = async (tempDiv: any, applicantData: Applicant) => {
  await fillTextFielld(applicantData);
};
