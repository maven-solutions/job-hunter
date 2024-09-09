import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const statefiller = async (applicantData: Applicant) => {
  const select: any = document.querySelector(
    'select[id="application_form[application][town]"]'
  );
  // filling state data
  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase(applicantData.state)
    ) {
      option.selected = true;
      handleValueChanges(select);
    }
  });
};

const fillTextField = async (applicantData: Applicant) => {
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

  const adress = document.getElementById("address1") as HTMLInputElement;
  if (adress) {
    adress.value = applicantData.address;
    adress.focus(); // Autofocus on the input field
    adress.click();
    adress.select();
    handleValueChanges(phone);
  }

  const city = document.getElementById("address2") as HTMLInputElement;
  if (city) {
    city.value = applicantData.city;
    city.focus(); // Autofocus on the input field
    city.click();
    city.select();
    handleValueChanges(phone);
  }

  const postalcode = document.getElementById("postcode") as HTMLInputElement;
  if (postalcode) {
    postalcode.value = applicantData.zip_code.toString();
    postalcode.focus(); // Autofocus on the input field
    postalcode.click();
    postalcode.select();
    handleValueChanges(phone);
  }
};

export const pinpointhq = async (tempDiv: any, applicantData: Applicant) => {
  await fillTextField(applicantData);
  await statefiller(applicantData);
};
