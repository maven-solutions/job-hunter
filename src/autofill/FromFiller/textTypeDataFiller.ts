import { Applicant } from "../data";
import {
  checkIfExist,
  checkNationForWorkDays,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import { fieldNames } from "./fieldsname";

export const textTypeDataFiller = (tempDiv: any, applicantData: Applicant) => {
  // Extract input fields of type "text"
  let address = false;
  let phone = false;

  // console.log("iframeForm::", iframeForm);
  const textInputFields = tempDiv.querySelectorAll('input[type="text"]');

  textInputFields.forEach((input: any) => {
    // Extract all attributes
    const attributes: any = Array.from(input.attributes);
    // Log all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    attributes.some((attribute) => {
      if (
        checkIfExist(labelText, fieldNames.first_name) ||
        checkIfExist(attribute.value, fieldNames.first_name)
      ) {
        input.value = applicantData.first_name;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        checkIfExist(labelText, fieldNames.middle_name) ||
        checkIfExist(attribute.value, fieldNames.middle_name)
      ) {
        input.value = "";
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        checkIfExist(labelText, fieldNames.last_name) ||
        checkIfExist(attribute.value, fieldNames.last_name)
      ) {
        input.value = applicantData.last_name;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        checkIfExist(labelText, fieldNames.full_name) ||
        checkIfExist(attribute.value, fieldNames.full_name)
      ) {
        input.value = applicantData.full_name;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (fromatStirngInLowerCase(labelText) === fieldNames.name[0]) {
        input.value = applicantData.full_name;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        checkIfExist(labelText, fieldNames.email_address) ||
        checkIfExist(attribute.value, fieldNames.email_address)
      ) {
        input.value = applicantData.email_address;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        checkIfExist(labelText, fieldNames.zip_code) ||
        checkIfExist(attribute.value, fieldNames.zip_code)
      ) {
        input.value = applicantData.zip_code;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        (checkIfExist(labelText, fieldNames.phone_number_text) ||
          checkIfExist(attribute.value, fieldNames.phone_number_text)) &&
        !phone
      ) {
        input.value = applicantData.phone_number;
        phone = true;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        checkIfExist(labelText, fieldNames.city) ||
        checkIfExist(attribute.value, fieldNames.city)
      ) {
        input.value = applicantData.city;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        (checkIfExist(labelText, fieldNames.address) ||
          checkIfExist(attribute.value, fieldNames.address)) &&
        !address
      ) {
        input.value = applicantData.address;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        address = true;
        return true; // Stop iterating
      }

      if (
        checkIfExist(labelText, fieldNames.country) ||
        checkIfExist(attribute.value, fieldNames.country)
      ) {
        input.value = applicantData.country;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      // salary
      if (
        // checkIfExist(labelText, fieldNames.salary) ||
        checkIfExist(attribute.value, fieldNames.salary)
      ) {
        console.log("sallary", applicantData.salary);
        input.value = applicantData.salary;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }
      // for state
      if (
        checkIfExist(labelText, fieldNames.state) ||
        checkIfExist(attribute.value, fieldNames.state)
      ) {
        input.value = applicantData.state;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (
        (checkIfExist(labelText, fieldNames.linkedin_url) ||
          checkIfExist(attribute.value, fieldNames.linkedin_url)) &&
        applicantData.linkedin_url
      ) {
        input.value = applicantData.linkedin_url;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }
      // for workdays
      if (checkNationForWorkDays(attribute.value, fieldNames.workday_country)) {
        input.value = applicantData.country;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        address = true;
        return true; // Stop iterating
      }

      return false; // Continue iterating
    });
    // You can do whatever you want with each input field here
  });
};
