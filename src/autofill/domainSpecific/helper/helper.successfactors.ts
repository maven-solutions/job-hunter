import { Applicant } from "../../data";
import { delay, handleValueChanges } from "../../helper";

export const openAllTab = async () => {
  const div = document.querySelector(".rcmResumeElement");
  if (!div) {
    return;
  }
  const button = div.querySelector("a");
  if (!button) {
    return;
  }
  button.click();
  await delay(1000);
};

export const fillBasicInfo = async (applicantData: Applicant) => {
  const firstName: HTMLInputElement =
    document.querySelector('[name="firstName"]');
  if (firstName) {
    firstName.value = applicantData.first_name;
    handleValueChanges(firstName);
  }

  const lastName: HTMLInputElement =
    document.querySelector('[name="lastName"]');
  if (lastName) {
    lastName.value = applicantData.last_name;
    handleValueChanges(lastName);
  }

  const contactEmail: HTMLInputElement = document.querySelector(
    '[name="contactEmail"]'
  );
  if (contactEmail) {
    contactEmail.value = applicantData.email_address;
    handleValueChanges(contactEmail);
  }

  const adress: HTMLInputElement = document.querySelector('[name="address"]');
  if (adress) {
    adress.value = applicantData.address;
    handleValueChanges(adress);
  }

  const adress2: HTMLInputElement = document.querySelector(
    '[aria-label="Address"]'
  );
  if (adress2) {
    adress2.value = applicantData.address;
    handleValueChanges(adress2);
  }

  const city: HTMLInputElement = document.querySelector('[name="city"]');
  if (city) {
    city.value = applicantData.city;
    handleValueChanges(city);
  }

  const zipcode: any = document.querySelector('[name="zip"]');
  if (zipcode) {
    zipcode.value = applicantData.zip_code;
    handleValueChanges(zipcode);
  }

  const cellPhone: any = document.querySelector('[name="cellPhone"]');
  if (cellPhone) {
    cellPhone.value = applicantData.phone_number;
    handleValueChanges(cellPhone);
  }

  await delay(1000);
};
