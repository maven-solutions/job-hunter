import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillcountry = async (applicantData) => {
  const countryDropDown: any = document.querySelector(
    '[data-automation-id="countryDropdown"]'
  );
  if (!countryDropDown) {
    return;
  }
  countryDropDown.click();
  await delay(2000);
  const selectOptions: any = document.querySelectorAll('[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (countryHandler(element.textContent.trim(), applicantData)) {
      element.click();
    }
  }
  await delay(3000);
};

const fillDeviceType = async (applicantData) => {
  const phoneElement: any = document.querySelector(
    '[data-automation-id="phone-device-type"]'
  );
  if (!phoneElement) {
    return;
  }
  phoneElement.click();
  await delay(1500);
  const selectOptions: any = document.querySelectorAll('[role="option"]');

  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim()).includes(
        fromatStirngInLowerCase("mobile")
      )
    ) {
      //   phonetype = true;
      element.click();
    }
  }
  await delay(1500);
};

const countryHandler = (text, applicantData) => {
  if (
    fromatStirngInLowerCase(text) ===
    fromatStirngInLowerCase(applicantData.country)
  ) {
    return true;
  }
  if (fromatStirngInLowerCase(text) === fromatStirngInLowerCase("america")) {
    return true;
  }
  if (fromatStirngInLowerCase(text) === fromatStirngInLowerCase("usa")) {
    return true;
  }
  if (
    fromatStirngInLowerCase(text) === fromatStirngInLowerCase("unitedstates")
  ) {
    return true;
  }
  if (
    fromatStirngInLowerCase(text) ===
    fromatStirngInLowerCase("unitedstatesofamerica")
  ) {
    return true;
  }
};
function getTodayDateDetails() {
  const today = new Date();

  const month = today.getMonth() + 1; // getMonth() returns months from 0-11, so we add 1
  const date = today.getDate();
  const year = today.getFullYear();

  return {
    month: month.toString(),
    date: date.toString(),
    year: year.toString(),
  };
}

// Example usage

const filltodayDate = () => {
  const todayDetails = getTodayDateDetails();
  if (!todayDetails) {
    return;
  }
  const label = document.querySelector('label[label="Date"]');
  if (!label) {
    return;
  }
  const parent = label.parentElement;
  if (!parent) {
    return;
  }
  let dateLabel: any = parent.childNodes[2];
  if (!dateLabel) {
    return;
  }
  const month: any = dateLabel.querySelector('input[aria-label="Month"]');
  if (!month) {
    return;
  }
  month.value = todayDetails.month;
  month.focus(); // Autofocus on the month field
  month.click();
  month.select();
  handleValueChanges(month);
  const day: any = dateLabel.querySelector('input[aria-label="Day"]');
  if (!day) {
    return;
  }
  day.value = todayDetails.date;
  day.focus(); // Autofocus on the day field
  day.click();
  day.select();
  handleValueChanges(day);
  const year: any = dateLabel.querySelector('input[aria-label="Year"]');
  if (!year) {
    return;
  }
  year.value = todayDetails.year;
  year.focus(); // Autofocus on the year field
  year.click();
  year.select();
  handleValueChanges(year);
};

const fillSponshership = async (applicantData: Applicant) => {
  const selectElement: any = document.querySelectorAll(
    'button[aria-haspopup="listbox"]'
  );

  for (const select of selectElement) {
    // console.log("select::", select);
    const label = select.getAttribute("aria-label");
    if (
      label?.toLowerCase().includes("sponsorship") ||
      label?.toLowerCase().includes("visa")
    ) {
      select.click();
      await delay(2000);
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const element of selectOptions) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            fromatStirngInLowerCase("no")
          ) &&
          !applicantData.sponsorship_required
        ) {
          element.click();
          return;
        }

        if (
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            fromatStirngInLowerCase("yes")
          ) &&
          applicantData.sponsorship_required
        ) {
          element.click();
          return;
        }
      }
    }
  }
  await delay(1000);
};

const authorizedTowork = async (applicantData: Applicant) => {
  const selectElement: any = document.querySelectorAll(
    'button[aria-haspopup="listbox"]'
  );

  for (const select of selectElement) {
    const label = select.getAttribute("aria-label");
    if (
      label?.toLowerCase().includes("legally") ||
      label?.toLowerCase().includes("currently authorized")
    ) {
      select.click();
      await delay(2000);
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const element of selectOptions) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            fromatStirngInLowerCase("yes")
          ) &&
          applicantData.us_work_authoriztaion
        ) {
          //   phonetype = true;
          element.click();
          return;
        }
      }
    }
  }
  await delay(1000);
};

const fillisAdult = async (applicantData: Applicant) => {
  const selectElement: any = document.querySelectorAll(
    'button[aria-haspopup="listbox"]'
  );

  for (const select of selectElement) {
    const label = select.getAttribute("aria-label");
    if (label?.toLowerCase().includes("18 years")) {
      select.click();
      await delay(2000);
      const selectOptions: any = document.querySelectorAll('[role="option"]');
      for (const element of selectOptions) {
        if (
          fromatStirngInLowerCase(element.textContent.trim()).includes(
            fromatStirngInLowerCase("yes")
          )
        ) {
          //   phonetype = true;
          element.click();
          return;
        }
      }
    }
  }
  await delay(1000);
};

const fillFieldSetDataType = (applicantData: Applicant) => {
  const ethnicityPrompt = document.querySelector(
    '[data-automation-id="ethnicityPrompt"]'
  );
  if (!ethnicityPrompt) {
    return;
  }
  const allLabel = ethnicityPrompt.querySelectorAll("label");
  if (!allLabel || allLabel?.length === 0) {
    return;
  }
  for (const label of allLabel) {
    if (
      fromatStirngInLowerCase(label.textContent.trim()).includes(
        fromatStirngInLowerCase(applicantData.race)
      )
    ) {
      label.click();
      return;
    }
  }
};

export const myworkDays = async (tempDiv: any, applicantData: Applicant) => {
  filltodayDate();
  await fillcountry(applicantData);
  await fillDeviceType(applicantData);
  await fillSponshership(applicantData);
  await authorizedTowork(applicantData);
  await fillisAdult(applicantData);
  await fillFieldSetDataType(applicantData);
};
