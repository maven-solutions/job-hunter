import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import { fieldNames } from "./fieldsname";

export const buttonFilder = async () => {
  const allAtag: any = document.querySelectorAll("a");
  if (allAtag.length === 0) {
    return;
  }

  for (let i = 0; i < allAtag.length; i++) {
    const atag = allAtag[i];
    const labelText = atag?.textContent?.trim() ?? "";

    if (checkIfExist(labelText, fieldNames.attach_file)) {
      // console.log("labelTextfind::", labelText);
      atag.focus(); // Autofocus on the input field
      atag.click();
      handleValueChanges(atag);
      await delay(1000);
      return true; // Stop iterating
    }
  }
};
