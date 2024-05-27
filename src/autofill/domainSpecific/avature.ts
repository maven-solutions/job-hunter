import { Applicant } from "../data";
import { delay } from "../helper";

export const avature = async (tempDiv: any, applicantData: Applicant) => {
  const button: any = document.querySelector('button[id="uploadFileResume"]');
  if (!button) {
    return;
  }
  await delay(2000);
  button.click();
  await delay(3000);
};
