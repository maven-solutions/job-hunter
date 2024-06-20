import { Applicant } from "../data";
import { checkIfExist, delay, handleValueChanges } from "../helper";
import { fieldNames } from "./fieldsname";

export const apiSelect = async (tempDiv: any, applicantData: Applicant) => {
  //   greenSchool(tempDiv);
  //   return;
  const labelFields = tempDiv.querySelectorAll("label");
  //   let labelss = false;
  for await (const label of labelFields) {
    const labelId = label?.getAttribute("for") ?? "";
    const inputElement = tempDiv.querySelector(`[id="${labelId}"]`) ?? "";

    if (checkIfExist(label?.textContent?.trim(), fieldNames.collage)) {
      // console.log("inputElement::", inputElement);
      // console.log("label::", label);
      //   labelss = true;
      inputElement.value = "Uva Wellassa University";
      inputElement.focus();
      inputElement.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );

      inputElement.click();
      //   await delay(3500);

      //   inputElement.dispatchEvent(
      //     new Event("click", { bubbles: true, cancelable: false })
      //   );
      //   inputElement.select();

      // console.log("fired--::");

      // Create a new keyboard event for 'Enter' key
      //   const enterKeyEvent = new KeyboardEvent("keypress", {
      //     bubbles: true,
      //     cancelable: true,
      //     key: "Enter",
      //     keyCode: 13,
      //   });
      //   inputElement.dispatchEvent(enterKeyEvent);
      //   console.log("fired--::1");

      //   await delay(3000);
      // console.log("fired--::2");

      //
    }
  }
};

const greenSchool = async (tempDiv) => {
  const labelFields = tempDiv.querySelectorAll("label");
  const inputElement: any = document.getElementById("s2id_autogen20_search");
  console.log("inputElement--::", inputElement);

  inputElement.focus();
  inputElement.select();
  inputElement.click();
  for await (const label of labelFields) {
    // const labelId = label?.getAttribute("for") ?? "";
    // const inputElement = tempDiv.querySelector(`[id="${labelId}"]`) ?? "";
    // console.log("label--::", label);
  }
  //   const inputElement: any = document.getElementById("s2id_autogen20_search");
  //   console.log("inputElement--::", inputElement);

  //   inputElement.value = "Uva Wellassa University";
  //   inputElement.focus();
  //   inputElement.dispatchEvent(
  //     new Event("change", { bubbles: true, cancelable: false })
  //   );
};
