import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase } from "../helper";

const profileImport = async (applicantData: Applicant) => {
  const profileEle = document.getElementById("importprofile");
  profileEle.click();

  await delay(5000);

  const uploadButton: any = document.getElementById("file");
  // console.log("uploadButton::", uploadButton);
  uploadButton.click();
};
const fillCountry = async (applicantData: Applicant) => {
  // console.log("fired::eight--");

  const countryEle = document.getElementById(
    "0-0-additional-questions-dropdown"
  );
  countryEle.focus();
  countryEle.click();
  await delay(2000);
  const selectOptions: any = document.querySelectorAll(
    ".menu-item_iojSa2k.wrap_p5SU8dV.medium_tsF_D4y.neutral_POVTfdT"
  );
  // console.log("selectOptions::", selectOptions);
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        "china"
        // fromatStirngInLowerCase(applicantData.country)
      )
    ) {
      element.click();
      // return true;
    }
  }
  await delay(1000);
};
export const eightFold = async (tempDiv: any, applicantData: Applicant) => {};
