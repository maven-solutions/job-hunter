import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import { fieldNames } from "./fieldsname";

export const checkboxTypeDataFiller = (
  tempDiv: any,
  applicantData: Applicant
) => {
  // Extract input fields of type "text"
  // console.log("checkbox::::");

  const textInputFields = tempDiv.querySelectorAll('input[type="checkbox"]');
  // console.log("emailtextInputFields::::", textInputFields);

  textInputFields.forEach((input) => {
    // console.log("inpt::", input);
    // Extract all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    const attributes: any = Array.from(input.attributes);

    // for disability
    attributes.some((attribute) => {
      // for yes
      if (
        (checkIfExist(labelText, fieldNames.disability_status) ||
          checkIfExist(attribute.value, fieldNames.disability_status)) &&
        fromatStirngInLowerCase(labelText).includes("yes")
      ) {
        input.focus(); // Autofocus on the input field
        input.checked = applicantData.disability_status ? true : false;
        handleValueChanges(input);
        return true; // Stop iterating
      }
      // for false
      if (
        (checkIfExist(labelText, fieldNames.disability_status) ||
          checkIfExist(attribute.value, fieldNames.disability_status)) &&
        fromatStirngInLowerCase(labelText).includes("no")
      ) {
        input.focus(); // Autofocus on the input field
        input.checked = applicantData.disability_status ? false : true;
        handleValueChanges(input);
        return true; // Stop iterating
      }
      return false; // Continue iterating
    });
    // You can do whatever you want with each input field here
  });
};
