import { Applicant } from "../data";
import { handleValueChanges } from "../helper";

export const workable = async (tempDiv: any, applicantData: Applicant) => {
  const firstname: any = document.getElementById("firstname");
  if (firstname) {
    firstname.value = applicantData.first_name;
    handleValueChanges(firstname);
  }

  const lastname: any = document.getElementById("lastname");
  if (lastname) {
    lastname.value = applicantData.last_name;
    handleValueChanges(lastname);
  }

  const email: any = document.getElementById("email");
  if (email) {
    email.value = applicantData.email_address;
    handleValueChanges(email);
  }

  const phone: any = document.querySelector('[name="phone"]');
  if (phone) {
    phone.value = Number(applicantData.phone_number);
    handleValueChanges(phone);
  }

  const address: any = document.getElementById("address");
  if (address) {
    address.value = applicantData.address;
    handleValueChanges(address);
  }
};
