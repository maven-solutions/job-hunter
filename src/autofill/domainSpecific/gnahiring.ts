import { Applicant } from "../data";
import { delay, handleValueChanges } from "../helper";

const fillBasicInfo = async (applicantData: Applicant) => {
  const fname: any = document.querySelector('[name="user.first_name"]');
  if (fname) {
    fname.value = applicantData.first_name;
    handleValueChanges(fname);
  }

  const lname: any = document.querySelector('[name="user.last_name"]');
  if (lname) {
    lname.value = applicantData.last_name;
    handleValueChanges(lname);
  }

  const email: any = document.querySelector('[name="user.email"]');
  if (email) {
    email.value = applicantData.email_address;
    handleValueChanges(email);
  }

  const phone: any = document.querySelector('[name="user.phone"]');
  if (phone) {
    phone.value = applicantData.phone_number;
    handleValueChanges(phone);
  }

  const city: any = document.querySelector('[name="user.city"]');
  if (city) {
    city.value = applicantData.city;
    handleValueChanges(city);
  }
  await delay(500);
  const zip: any = document.querySelector('[name="user.zip"]');
  if (zip) {
    zip.value = applicantData.zip_code;
    handleValueChanges(zip);
  }

  const linkedin: any = document.querySelector('[name="user.linkedin_url"]');
  if (linkedin) {
    linkedin.value = applicantData.linkedin_url;
    handleValueChanges(linkedin);
  }

  await delay(500);

  const adress: any = document.querySelector('[name="user.address1"]');
  if (adress) {
    console.log("applicantData.address::", applicantData.address);
    adress.value = applicantData.address;
    handleValueChanges(adress);
  }
  await delay(500);

  const adress2: any = document.querySelector('[name="user.address2"]');
  if (adress2) {
    console.log("applicantData.address::", applicantData.address);
    adress2.value = applicantData.address;
    handleValueChanges(adress2);
  }
};
const fillResume = (applicantData: Applicant) => {
  //   try {
  //     const tempDivForFile = document.querySelector("body");
  //     if (applicantData.pdf_url) {
  //       textInputField.setAttribute("ci-aria-file-uploaded", "true");
  //       // Create file asynchronously
  //       const designFile = await createFile(
  //         applicantData.pdf_url,
  //         applicantData.resume_title
  //       );
  //       // Set file to input field only for the first file input field found
  //       const dt = new DataTransfer();
  //       dt.items.add(designFile);
  //       textInputField.files = dt.files;
  //       // Trigger input change event
  //       textInputField.dispatchEvent(
  //         new Event("change", { bubbles: true, cancelable: false })
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //   }
};

export const gnahiring = async (tempDiv: any, applicantData: Applicant) => {
  await fillBasicInfo(applicantData);
  ///

  fillResume(applicantData);
};
