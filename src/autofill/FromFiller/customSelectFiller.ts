import { checkIfExist, delay, fromatStirngInLowerCase } from "../helper";
import { fieldNames } from "./fieldsname";

const countryHandler = (option, applicantData, country) => {
  if (
    fromatStirngInLowerCase(option) ===
      fromatStirngInLowerCase(applicantData.country) &&
    !country
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(option) === fromatStirngInLowerCase("america") &&
    !country
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(option) === fromatStirngInLowerCase("usa") &&
    !country
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(option) ===
      fromatStirngInLowerCase("unitedstates") &&
    !country
  ) {
    // console.log("fired::9");
    return true;
  }
  if (
    fromatStirngInLowerCase(option) ===
      fromatStirngInLowerCase("unitedstatesofamerica") &&
    !country
  ) {
    // console.log("fired::10");
    return true;
  }
};

export const customSelectFiller = async (tempDiv1, applicantData, iframe) => {
  let country = false;
  let state = false;
  let degree = false;
  let collage = false;
  const tempDiv = document.querySelector("body");
  const selectButtonFields: any = tempDiv.querySelectorAll(
    'button[aria-haspopup="listbox"]'
  );

  for (const [selectIndex, select] of selectButtonFields.entries()) {
    const selectid = select.getAttribute("id");
    const labelElement = tempDiv.querySelector(`[for="${selectid}"]`);
    if (!labelElement) {
      return;
    }
    const labelText = labelElement.textContent.trim();
    console.log("labelText::", labelText);

    // for country or nation
    if (!window.location.href.includes("myworkdayjobs")) {
      if (checkIfExist(labelText, fieldNames.country) && !country) {
        select.click();
        await delay(300);
        const selectOptions: any = document.querySelectorAll('[role="option"]');
        for (const [index, element] of selectOptions.entries()) {
          if (
            countryHandler(element.textContent.trim(), applicantData, country)
          ) {
            // console.log("country::fired");
            country = true;
            element.focus();
            element.click();
            await delay(300);
            // console.log("country::fired2");
            return true;
          }
        }
        //   await delay(5000);
      }
    }

    // for state
    if (checkIfExist(labelText, fieldNames.state) && !state) {
      select.click();
      await delay(200);
      console.log("state::fired");
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const [index, element] of selectOptions.entries()) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()) ===
          fromatStirngInLowerCase(applicantData.state)
        ) {
          state = true;
          element.click();
          return true;
        }
      }
    }

    // for gender
    if (checkIfExist(labelText, fieldNames.gender)) {
      select.click();
      await delay(200);
      // console.log("state::gender");
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const [index, element] of selectOptions.entries()) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()) ===
          fromatStirngInLowerCase(applicantData.gender)
        ) {
          element.click();
          // return true;
        }
      }
      await delay(1000);
    }

    // for race
    if (checkIfExist(labelText, fieldNames.race)) {
      select.click();
      await delay(200);
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const [index, element] of selectOptions.entries()) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            fromatStirngInLowerCase(applicantData.race)
          )
        ) {
          element.click();
          return true;
        }
      }
    }
  }
};
