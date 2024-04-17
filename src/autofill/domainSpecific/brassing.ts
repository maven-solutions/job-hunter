import { Applicant } from "../data";
import { delay } from "../helper";

const profileImport = async (applicantData: Applicant) => {
  const profileEle = document.getElementById("importprofile");
  profileEle.click();

  await delay(5000);
  console.log("fired::--");

  const uploadButton: any = document.getElementById("file");
  console.log("uploadButton::", uploadButton);
  uploadButton.click();
};

export const brassing = (tempDiv: any, applicantData: Applicant) => {
  // profileImport(applicantData);
};
