import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

const firstname = (applicantData: Applicant) => {
  const name: HTMLInputElement = document.querySelector('[name="firstname"]');
  if (name) {
    name.value = applicantData.first_name;
    handleValueChanges(name);
  }
};
const lastname = (applicantData: Applicant) => {
  const lastname: HTMLInputElement =
    document.querySelector('[name="lastname"]');
  if (lastname) {
    lastname.value = applicantData.last_name;
    handleValueChanges(lastname);
  }
};
const emailid = (applicantData: Applicant) => {
  const name: HTMLInputElement = document.querySelector('[name="emailid"]');
  if (name) {
    name.value = applicantData.email_address;
    handleValueChanges(name);
  }
};
const contactnumber = (applicantData: Applicant) => {
  const name: HTMLInputElement = document.querySelector(
    '[name="contactnumber"]'
  );
  if (name) {
    name.value = applicantData.phone_number;
    handleValueChanges(name);
  }
};
const city = (applicantData: Applicant) => {
  const name: HTMLInputElement = document.querySelector('[name="city"]');
  if (name) {
    name.value = applicantData.city;
    handleValueChanges(name);
  }
};

const state = (applicantData: Applicant) => {
  const name: HTMLInputElement = document.querySelector('[name="state"]');
  if (name) {
    name.value = applicantData.state;
    handleValueChanges(name);
  }
};

const country = (applicantData: Applicant) => {
  const name: HTMLInputElement = document.querySelector('[name="country"]');
  if (name) {
    name.value = applicantData.country;
    handleValueChanges(name);
  }
};

export const recruitcrm = (tempDiv: any, applicantData: Applicant) => {
  firstname(applicantData);
  lastname(applicantData);
  emailid(applicantData);
  contactnumber(applicantData);
  city(applicantData);
  state(applicantData);
  country(applicantData);
};
