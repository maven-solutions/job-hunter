import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase } from "../helper";

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

export const myworkDays = async (tempDiv: any, applicantData: Applicant) => {
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

export const selectapi = async () => {
  const inputElement: any = document.getElementById("input-21");
  console.log("inputElement::", inputElement);
  inputElement.focus();
  inputElement.click();
  await delay(1000);
  inputElement.value = "biology";
  inputElement.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false })
  );
  await delay(1000);
  inputElement.value = "biology";
  inputElement.dispatchEvent(
    new Event("click", { bubbles: true, cancelable: false })
  );
  await delay(1000);
  inputElement.value = "biology";
  inputElement.dispatchEvent(
    new Event("click", { bubbles: true, cancelable: false })
  );
  inputElement.dispatchEvent(new Event("search"), {
    bubbles: true,
    cancelable: false,
  });
  inputElement.blur();
};
