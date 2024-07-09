import { Applicant } from "../data";
import { fieldNames } from "../FromFiller/fieldsname";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const texttypefiller = async (applicantData: Applicant) => {
  // Extract input fields of type "text"
  let address = false;
  let phone = false;

  const textInputFields = document.querySelectorAll("input");
  // console.log("textInputFields::", textInputFields);

  textInputFields.forEach((input: any) => {
    // Extract all attributes
    const attributes: any = Array.from(input.attributes);
    // Log all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: any =
      document.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";
    // console.log("labeltext::", labelText);
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

      if (fromatStirngInLowerCase(labelText) === fieldNames.name) {
        input.value = applicantData.full_name;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }

      if (fromatStirngInLowerCase(labelText) === "name") {
        input.value = applicantData.full_name;
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        handleValueChanges(input);
        return true; // Stop iterating
      }
      if (
        checkIfExist(labelText, ["username"]) ||
        checkIfExist(attribute.value, ["username"])
      ) {
        input.value = applicantData.email_address;
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

      // portfolio
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

      // github
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
      // for country
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

      return false; // Continue iterating
    });
    // You can do whatever you want with each input field here
  });
};

const fillGender = async (applicantData: Applicant) => {
  const gender: HTMLElement = document.querySelector('[data-testid="gender"]');
  const select: HTMLElement = gender.querySelector(
    '[data-testid="select-controller"]'
  );
  select.click();
  await delay(500);
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
};

const fillRace = async (applicantData: Applicant) => {
  const race: HTMLElement = document.querySelector('[data-testid="race"]');
  const select: HTMLElement = race.querySelector(
    '[data-testid="select-controller"]'
  );
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
};

const fillHispanic = async (applicantData: Applicant) => {
  const hispanic: HTMLElement = document.querySelector(
    '[data-testid="hispanicOrLatino"]'
  );
  const select: HTMLElement = hispanic.querySelector(
    '[data-testid="select-controller"]'
  );
  select.click();
  await delay(500);

  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(element.textContent.trim()).includes("yes")
    ) {
      element.click();
      // return true;
    }

    if (
      !applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(element.textContent.trim()).includes("no")
    ) {
      element.click();
      // return true;
    }
  }
  await delay(1000);
};
const fillVeteran = async (applicantData: Applicant) => {
  const veteran: HTMLElement = document.querySelector(
    '[data-testid="veteranStatus"]'
  );
  const select: HTMLElement = veteran.querySelector(
    '[data-testid="select-controller"]'
  );
  select.click();
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    // for yes
    if (
      applicantData.veteran_status === 1 &&
      (fromatStirngInLowerCase(element.textContent.trim()).includes(
        "amaveteran"
      ) ||
        fromatStirngInLowerCase(element.textContent.trim()).includes(
          "amveteran"
        ))
    ) {
      element.click();
    }

    // for no
    if (
      applicantData.veteran_status === 2 &&
      fromatStirngInLowerCase(element.textContent.trim()).includes("iamnot")
    ) {
      element.click();
    }

    if (
      (applicantData.veteran_status === 3 ||
        applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 4) &&
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        "identifyasaveteran"
      )
    ) {
      element.click();
    }

    //for one or more
    if (
      (applicantData.veteran_status === 3 ||
        applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 4) &&
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        "identifyasoneormore"
      )
    ) {
      element.click();
    }

    //for one or more
    if (
      (applicantData.veteran_status === 4 ||
        applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 3) &&
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        "identifyasoneormore"
      )
    ) {
      element.click();
    }

    //   for one or more
    if (
      applicantData.veteran_status === 1 &&
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        "identifyasoneormore"
      )
    ) {
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
        fromatStirngInLowerCase(element.textContent.trim()).includes("notwish"))
    ) {
      element.click();
    }
  }
  await delay(1000);
};

const fillDisability = async (applicantData: Applicant) => {
  const disability: HTMLElement = document.querySelector(
    '[data-testid="disabilityStatus"]'
  );
  const select: HTMLElement = disability.querySelector(
    '[data-testid="select-controller"]'
  );
  select.click();
  await delay(500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim()).includes("yes") &&
      applicantData.disability_status
    ) {
      element.click();
    }

    if (
      fromatStirngInLowerCase(element.textContent.trim()).includes("noidont") &&
      !applicantData.disability_status
    ) {
      element.click();
    }
  }
  await delay(1000);
};
export const rippling = async (tempDiv: any, applicantData: Applicant) => {
  await texttypefiller(applicantData);
  await fillGender(applicantData);
  await fillRace(applicantData);
  await fillHispanic(applicantData);
  await fillVeteran(applicantData);
  await fillDisability(applicantData);
};
