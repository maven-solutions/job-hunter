import { Applicant } from "../data";
import { checkIfExist, handleValueChanges } from "../helper";
import { fieldNames } from "./fieldsname";

export const telTypeDataFiller = (tempDiv: any, applicantData: Applicant) => {
  // Extract input fields of type "text"

  const textInputFields = tempDiv.querySelectorAll('input[type="tel"]');
  textInputFields.forEach((input) => {
    // console.log(input);
    // Extract all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";
    const attributes: any = Array.from(input.attributes);

    // Log all attributes
    attributes.some((attribute) => {
      if (
        (checkIfExist(labelText, fieldNames.phone_number) ||
          checkIfExist(attribute.value, fieldNames.phone_number)) &&
        applicantData.phone_number
      ) {
        input.value = Number(applicantData.phone_number);
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
};
