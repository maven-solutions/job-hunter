import { isEmptyArray, sanitizeHTML } from "../../../utils/helper";
import { Applicant } from "../../data";
import { getMonthShortForm, getYearFromDate } from "../../FromFiller/helper";
import {
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../../helper";

const deletePreviousWorkExpereince = async () => {
  const allDeleteButton: any = document.querySelectorAll(
    '[data-automation="remove-button"]'
  );
  if (isEmptyArray(allDeleteButton)) return;
  for (const deleteButton of allDeleteButton) {
    const text = deleteButton?.getAttribute("aria-label")?.trim();
    if (text && text?.toLowerCase()?.includes("experience")) {
      deleteButton.click();
    }
  }
  await delay(500);
};

const openWorkExperience = async (applicantData) => {
  const addButtton: any = document.querySelector(
    'button[aria-label="Add experience"]'
  );
  if (!addButtton) {
    return;
  }
  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for (const times of applicantData.employment_history) {
      addButtton?.click();
      await delay(300);
    }
  }
};

const fillJobtitle = async (applicantData) => {
  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for (const [index, data] of applicantData.employment_history.entries()) {
      const id = `NewWorkExperience_JobTitle${index}`;
      const input: any = document.getElementById(id);
      if (input) {
        input.value = data.jobTitle ?? "";
        input.focus(); // Autofocus on the input field
        input.click();
        await delay(200);
      }
    }
  }
};

const fillCompany = async (applicantData) => {
  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for (const [index, data] of applicantData.employment_history.entries()) {
      const id = `NewWorkExperience_Organization${index}`;
      const input: any = document.getElementById(id);
      if (input) {
        input.value = data.employeer ?? "";
        input.focus(); // Autofocus on the input field
        input.click();
        await delay(200);
      }
    }
  }
};

const fillLocation = async (applicantData) => {
  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for (const [index, data] of applicantData.employment_history.entries()) {
      const labelledby = `NewWorkExperience_Location${index}`;

      // Corrected querySelector syntax
      const input: any = document.querySelector(
        `input[aria-labelledby="${labelledby}"]`
      );

      if (input) {
        input.value = data?.city?.label ?? "";
        input.focus(); // Autofocus on the input field
        input.click();
        // Add a delay to ensure the UI reacts accordingly
        await delay(200);
      }
    }
  }
};
const fillDescription = async (applicantData) => {
  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for (const [index, data] of applicantData.employment_history.entries()) {
      const labelledby = `NewWorkExperience_Description${index}`;

      // Corrected querySelector syntax
      const input: any = document.querySelector(
        `textarea[aria-labelledby="${labelledby}"]`
      );

      if (input) {
        const cleanedHtml = sanitizeHTML(data?.description ?? "");
        await delay(200);

        input.focus(); // Autofocus on the input field
        input.click();
        input.value = cleanedHtml;
        // Delay to simulate any asynchronous UI updates
        await delay(200);
      }
    }
  }
};

const fillDate = async (applicantData) => {
  const AllfromDate: any = document.querySelectorAll(
    'label[data-i18n="Model.WorkExperience.FromMonth.Label"]'
  );

  const AllToDate = document.querySelectorAll(
    'label[data-i18n="Model.WorkExperience.ToMonth.Label"]'
  );
  await delay(500);
  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for (const [index, data] of applicantData.employment_history.entries()) {
      if (!isEmptyArray(AllfromDate)) {
        const fromDateLabel = AllfromDate[index];
        const parentOfAll = fromDateLabel?.parentElement;
        const yearInput = parentOfAll?.querySelector("input");
        yearInput.value = getYearFromDate(data?.startDate);
        yearInput.focus(); // Autofocus on the input field
        yearInput.click();
        const monthSelect = parentOfAll?.querySelector("select");
        const month = getMonthShortForm(data?.startDate);
        Array.from(monthSelect.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase(month)
          ) {
            option.selected = true;
          }
        });
      }
      if (!isEmptyArray(AllToDate)) {
        const toDateLabel = AllToDate[index];
        const patentOfToLabel = toDateLabel?.parentElement;
        const toYearInput = patentOfToLabel?.querySelector("input");
        toYearInput.value = getYearFromDate(data?.endDate);
        toYearInput.focus(); // Autofocus on the input field
        toYearInput.click();
        const toMonthSelect = patentOfToLabel?.querySelector("select");
        const tomonth = getMonthShortForm(data?.endDate);
        Array.from(toMonthSelect.options).find((option: any) => {
          if (
            fromatStirngInLowerCase(option?.text) ===
            fromatStirngInLowerCase(tomonth)
          ) {
            option.selected = true;
          }
        });
      }
    }
  }
};

export const UltiworkExperienceDatafiller = async (
  applicantData: Applicant
) => {
  await deletePreviousWorkExpereince();
  await openWorkExperience(applicantData);
  await fillJobtitle(applicantData);
  await fillCompany(applicantData);
  await fillLocation(applicantData);
  await fillDescription(applicantData);
  await fillDate(applicantData);
};
