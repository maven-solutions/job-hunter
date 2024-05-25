import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillDeviceType = async (applicantData) => {
  const phoneElement: any = document.querySelector(
    '[data-automation-id="phone-device-type"]'
  );
  if (!phoneElement) {
    return;
  }
  phoneElement.click();
  await delay(1000);
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
  await delay(1000);
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

export const myworkDays = async (tempDiv: any, applicantData: Applicant) => {
  filltodayDate();
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
  fillDeviceType(applicantData);
  await delay(2000);
};
