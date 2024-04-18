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

const fillDeviceType = async (applicantData) => {
  let phonetype = false;
  const phoneElement: any = document.querySelector(
    '[data-automation-id="phone-device-type"]'
  );
  if (!phoneElement) {
    return;
  }
  phoneElement.click();
  await delay(1000);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  if (phonetype) {
    return;
  }

  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        fromatStirngInLowerCase(applicantData.phone_type)
      ) &&
      !phonetype
    ) {
      phonetype = true;
      element.click();
    }
  }
  await delay(1000);
};

export const customSelectFiller = async (tempDiv1, applicantData, iframe) => {
  let country = false;
  let state = false;
  let degree = false;
  let collage = false;
  let phonetype = false;
  let veteran = false;
  const tempDiv = document.querySelector("body");
  const selectButtonFields: any = document.querySelectorAll(
    'button[aria-haspopup="listbox"]'
  );
  if (window.location.href.includes(".myworkdayjobs.")) {
    fillDeviceType(applicantData);
    await delay(1000);
  }

  for (const [selectIndex, select] of selectButtonFields.entries()) {
    // console.log("select::", select);

    const selectid = select.getAttribute("id");

    const labelElement = document?.querySelector(`[for="${selectid}"]`);
    // console.log("labelElement::", labelElement);

    const labelText = labelElement?.textContent?.trim() ?? "";
    console.log("labelText::", labelText);

    // for country or nation
    if (!window.location.href.includes("myworkdayjobs")) {
      if (checkIfExist(labelText, fieldNames.country) && !country) {
        select.click();
        await delay(500);
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
          }
        }
        //   await delay(5000);
      }
    }

    // for state
    if (checkIfExist(labelText, fieldNames.state) && !state) {
      select.click();
      await delay(500);
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
      await delay(1000);
    }

    // for gender
    if (checkIfExist(labelText, fieldNames.gender)) {
      select.click();
      await delay(500);
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

    // for language
    if (checkIfExist(labelText, fieldNames.language)) {
      select.click();
      await delay(500);
      // console.log("state::language");
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const [index, element] of selectOptions.entries()) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()) ===
          fromatStirngInLowerCase(applicantData.language)
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
      await delay(500);
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const [index, element] of selectOptions.entries()) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            fromatStirngInLowerCase(applicantData.race)
          )
        ) {
          element.click();
          // return true;
        }
      }
      await delay(1000);
    }

    // for veteran
    if (checkIfExist(labelText, fieldNames.veteran)) {
      select.click();
      await delay(500);
      // console.log("state::gender");
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const [index, element] of selectOptions.entries()) {
        // for yes
        if (
          applicantData.veteran_status === 1 &&
          !veteran &&
          (fromatStirngInLowerCase(element.textContent.trim()).includes(
            "amaveteran"
          ) ||
            fromatStirngInLowerCase(element.textContent.trim()).includes(
              "amveteran"
            ))
        ) {
          veteran = true;
          element.click();
        }

        // for no
        if (
          applicantData.veteran_status === 2 &&
          !veteran &&
          fromatStirngInLowerCase(element.textContent.trim()).includes("iamnot")
        ) {
          veteran = true;
          element.click();
        }

        if (
          applicantData.veteran_status === 3 &&
          !veteran &&
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            "identifyasaveteran"
          )
        ) {
          veteran = true;

          element.click();
        }

        //for one or more
        if (
          applicantData.veteran_status === 3 &&
          !veteran &&
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            "identifyasoneormore"
          )
        ) {
          veteran = true;
          element.click();
        }

        //for one or more
        if (
          applicantData.veteran_status === 4 &&
          !veteran &&
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            "identifyasoneormore"
          )
        ) {
          veteran = true;
          element.click();
        }

        //   for one or more
        if (
          applicantData.veteran_status === 1 &&
          !veteran &&
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            "identifyasoneormore"
          )
        ) {
          veteran = true;
          element.click();
        }

        // for decline
        if (
          applicantData.veteran_status === 5 &&
          !veteran &&
          (fromatStirngInLowerCase(element.textContent.trim()).includes(
            "selfidentify"
          ) ||
            fromatStirngInLowerCase(element.textContent.trim()).includes(
              "dontwish"
            ) ||
            fromatStirngInLowerCase(element.textContent.trim()).includes(
              "decline"
            ) ||
            fromatStirngInLowerCase(element.textContent.trim()).includes(
              "notwish"
            ))
        ) {
          veteran = true;
          element.click();
        }
      }
      await delay(1000);
    }
  }
  // await delay(300);
  // console.log("phonefiring:;");
  // // for phone device
  // fillDeviceType(applicantData);
};
