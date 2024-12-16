import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import { fieldNames } from "./fieldsname";

export const radioTypeDataFiller = (tempDiv: any, applicantData: Applicant) => {
  // Extract input fields of type "text"
  // console.log("email::::");

  const textInputFields = tempDiv.querySelectorAll('input[type="radio"]');
  // console.log("textInputFields::::", textInputFields);

  textInputFields.forEach((input) => {
    // console.log("inpt::", input);
    // Extract all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    const attributes: any = Array.from(input.attributes);

    // Log all attributes
    attributes.some((attribute) => {
      // for male
      if (
        checkIfExist(labelText, ["male"]) ||
        (checkIfExist(attribute.value, ["male"]) &&
          fromatStirngInLowerCase(applicantData.gender)) === "male"
      ) {
        console.log("");
        input.focus(); // Autofocus on the input field
        input.click();
        input.checked = true;
        handleValueChanges(input);
        return true; // Stop iterating
      }

      // for female
      if (
        checkIfExist(labelText, ["female"]) ||
        (checkIfExist(attribute.value, ["female"]) &&
          fromatStirngInLowerCase(applicantData.gender)) === "female"
      ) {
        input.focus(); // Autofocus on the input field
        input.click();
        input.checked = true;
        handleValueChanges(input);
        return true; // Stop iterating
      }
      return false; // Continue iterating
    });
    // You can do whatever you want with each input field here
  });
};
