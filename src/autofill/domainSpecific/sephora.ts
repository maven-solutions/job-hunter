import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const genderSelectfiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let inputId = "";
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (fromatStirngInLowerCase(text).includes("gender")) {
      inputId = label?.getAttribute("for") ?? "";
    }
  }
  if (!inputId) {
    return;
  }
  const input: any = document.querySelector(`[id="${inputId}"]`);
  if (input) {
    input.click();
  }
  await delay(500);
  const selectOptions: any = document.querySelectorAll("li");
  for (const element of selectOptions) {
    if (
      fromatStirngInLowerCase(element?.textContent) ===
      fromatStirngInLowerCase(applicantData.gender)
    ) {
      const button = element?.querySelector("button");
      button?.click();
      // return true;
    }
  }
  await delay(500);
};
const ethnicitySelectfiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let inputId = "";
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (fromatStirngInLowerCase(text).includes("ethnicity")) {
      inputId = label?.getAttribute("for") ?? "";
    }
  }
  if (!inputId) {
    return;
  }
  const input: any = document.querySelector(`[id="${inputId}"]`);
  if (input) {
    input.click();
  }
  await delay(500);

  const selectOptions: any = document.querySelectorAll("li");
  for (const element of selectOptions) {
    if (
      applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(element.textContent) ===
        fromatStirngInLowerCase("Hispanic or Latino")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }

    if (
      !applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(element?.textContent) ===
        fromatStirngInLowerCase("Not Hispanic or Latino")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);

      // return true;
    }
    await delay(500);
  }
};

const raceSelectfiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let inputId = "";
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (fromatStirngInLowerCase(text).includes("race")) {
      inputId = label?.getAttribute("for") ?? "";
    }
  }
  if (!inputId) {
    return;
  }
  const input: any = document.querySelector(`[id="${inputId}"]`);
  if (input) {
    input.click();
  }
  await delay(500);
  const selectOptions: any = document.querySelectorAll("li");
  for (const element of selectOptions) {
    if (
      fromatStirngInLowerCase(element?.textContent) ===
      fromatStirngInLowerCase(applicantData?.race)
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }
  }
  await delay(500);
};

const relocateSelectfiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let inputId = "";
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (fromatStirngInLowerCase(text).includes("relocat")) {
      inputId = label?.getAttribute("for") ?? "";
    }
  }
  if (!inputId) {
    return;
  }
  const input: any = document.querySelector(`[id="${inputId}"]`);
  if (input) {
    input.click();
  }
  await delay(500);

  const selectOptions: any = document.querySelectorAll("li");
  for (const element of selectOptions) {
    if (
      applicantData.willingToTravel &&
      Number(applicantData.willingToTravel) > 0 &&
      fromatStirngInLowerCase(element.textContent) ===
        fromatStirngInLowerCase("yes")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }

    if (
      (!applicantData.willingToTravel ||
        Number(applicantData.willingToTravel) === 0) &&
      fromatStirngInLowerCase(element.textContent) ===
        fromatStirngInLowerCase("no")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }

    await delay(500);
  }
};

const authorizetoworkSelectfiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let inputId = "";
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (fromatStirngInLowerCase(text).includes("authorized")) {
      inputId = label?.getAttribute("for") ?? "";
    }
  }
  if (!inputId) {
    return;
  }
  const input: any = document.querySelector(`[id="${inputId}"]`);
  if (input) {
    input.click();
  }
  await delay(500);

  const selectOptions: any = document.querySelectorAll("li");
  for (const element of selectOptions) {
    if (
      applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(element.textContent) ===
        fromatStirngInLowerCase("yes")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }

    if (
      !applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(element.textContent) ===
        fromatStirngInLowerCase("no")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }

    await delay(500);
  }
};
const visaSelectfiller = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let inputId = "";
  for (const label of allLabel) {
    const text = label?.textContent ?? "";
    if (fromatStirngInLowerCase(text).includes("visa")) {
      inputId = label?.getAttribute("for") ?? "";
    }
  }
  if (!inputId) {
    return;
  }
  const input: any = document.querySelector(`[id="${inputId}"]`);
  if (input) {
    input.click();
  }
  await delay(500);

  const selectOptions: any = document.querySelectorAll("li");
  for (const element of selectOptions) {
    if (
      !applicantData.sponsorship_required &&
      fromatStirngInLowerCase(element.textContent) ===
        fromatStirngInLowerCase("no")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }

    if (
      applicantData.sponsorship_required &&
      fromatStirngInLowerCase(element.textContent) ===
        fromatStirngInLowerCase("yes")
    ) {
      const button = element?.querySelector("button");
      button?.click();
      handleValueChanges(button);
      // return true;
    }

    await delay(500);
  }
};
export const sephora = async (tempDiv: any, applicantData: Applicant) => {
  await relocateSelectfiller(applicantData);
  await authorizetoworkSelectfiller(applicantData);
  await visaSelectfiller(applicantData);
  await ethnicitySelectfiller(applicantData);
  await genderSelectfiller(applicantData);
  await raceSelectfiller(applicantData);
};
