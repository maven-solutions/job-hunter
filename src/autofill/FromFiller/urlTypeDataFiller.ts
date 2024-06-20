import { Applicant } from "../data";
import { checkIfExist, handleValueChanges } from "../helper";
import { fieldNames } from "./fieldsname";

export const urlTypeDataFiller = (tempDiv: any, applicantData: Applicant) => {
  // Extract input fields of type "text"
  let textInputFields = tempDiv.querySelectorAll('input[type="url"]');
  if (!textInputFields || textInputFields?.length === 0) {
    textInputFields = tempDiv.querySelectorAll('input[type="link"]');
  }

  textInputFields.forEach((input, index) => {
    // console.log(input);
    // Extract all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";
    const attributes: any = Array.from(input.attributes);

    // Log all attributes
    attributes.some((attribute) => {
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
      if (
        checkIfExist(labelText, fieldNames.github) ||
        checkIfExist(attribute.value, fieldNames.github)
      ) {
        input.value = applicantData.github_url;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }
      if (
        checkIfExist(labelText, fieldNames.portfolio) ||
        checkIfExist(attribute.value, fieldNames.portfolio)
      ) {
        input.value = applicantData.portfolio_url;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }
      return false; // Continue iterating
    });

    // You can do whatever you want with each input field here
  });

  // for
};
