import { Applicant } from "../data";
import { checkIfExist, handleValueChanges } from "../helper";
import { fieldNames } from "./fieldsname";

export const passwordTypeDataFiller = (
  tempDiv: any,
  applicantData: Applicant
) => {
  // Extract input fields of type "text"
  // console.log("email::::");

  const textInputFields = tempDiv.querySelectorAll('input[type="password"]');
  // console.log("emailtextInputFields::::", textInputFields);

  textInputFields.forEach((input) => {
    // console.log("inpt::", input);
    // Extract all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    const attributes: any = Array.from(input.attributes);

    // Log all attributes
    attributes.some((attribute) => {
      if (
        checkIfExist(labelText, fieldNames.password) ||
        checkIfExist(attribute.value, fieldNames.password)
      ) {
        input.value = applicantData.password;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        // return true; // Stop iterating
      }
      return false; // Continue iterating
    });
    // You can do whatever you want with each input field here
  });
};
