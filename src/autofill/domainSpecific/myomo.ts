import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

export const myomo = async (tempDiv: any, applicantData: Applicant) => {
  const adress: any = document.getElementById("address1");
  // console.log("firstanme::", adress);
  if (adress) {
    adress.value = applicantData.address;
    adress.focus(); // Autofocus on the input field
    adress.click();
    adress.select();
    handleValueChanges(adress);
  }

  const city: any = document.getElementById("address2");
  // console.log("firstanme::", city);
  if (city) {
    city.value = applicantData.city;
    city.focus(); // Autofocus on the input field
    city.click();
    city.select();
    handleValueChanges(city);
  }

  const postcode: any = document.getElementById("postcode");
  // console.log("firstanme::", postcode);
  if (postcode) {
    postcode.value = applicantData.zip_code;
    postcode.focus(); // Autofocus on the input field
    postcode.click();
    postcode.select();
    handleValueChanges(postcode);
  }

  const select = document.querySelector(
    'select[id="application_form[application][town]"]'
  ) as HTMLSelectElement;
  if (!select) {
    return;
  }
  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase(applicantData.state)
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }
  });
};
