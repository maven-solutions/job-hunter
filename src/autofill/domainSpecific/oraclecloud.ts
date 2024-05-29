import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

const filltexttype = (applicantData: Applicant) => {
  const firstName: any = document.querySelector('[name="firstName"]');
  if (firstName) {
    firstName.value = applicantData.first_name;
    handleValueChanges(firstName);
  }
  const lastname: any = document.querySelector('[name="lastName"]');
  if (lastname) {
    lastname.value = applicantData.first_name;
    handleValueChanges(lastname);
  }

  const preferedname: any = document.querySelector('[name="knownAs"]');
  if (preferedname) {
    preferedname.value = applicantData.full_name;
    handleValueChanges(preferedname);
  }

  const adress: any = document.querySelector('[name="addressLine1"]');
  if (adress) {
    adress.value = applicantData.address;
    handleValueChanges(adress);
  }

  const postalCode: any = document.querySelector('[name="postalCode"]');
  if (postalCode) {
    postalCode.value = applicantData.zip_code;
    handleValueChanges(postalCode);
  }
};

export const oraclecloud = async (tempDiv: any, applicantData: Applicant) => {
  filltexttype(applicantData);
};
