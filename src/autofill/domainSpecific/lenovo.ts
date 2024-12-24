import { getAllinputId, setIdToLocalstorage } from "../../utils/helper";
import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillWorkExperience = async (applicantData: Applicant) => {
  const workExpTitle = document.querySelector('[aria-label="Work Experience"]');

  if (!workExpTitle) return;
  const addButton: any = document.querySelector(
    '[aria-label="add new entry to Work history"]'
  );
  if (!addButton) return;
  await delay(1000);

  for await (const [
    index,
    element,
  ] of applicantData.employment_history.entries()) {
    if (index > 0) {
      await delay(1000);
      addButton.click();
    }

    await workExperienceDatafiller(applicantData, element, index);
  }
};

function formatDateToYYYYMM(dateString: Date): string {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Adding 1 since months are 0-indexed
  return `${year}-${month}`;
}

const workExperienceDatafiller = async (
  applicantData: Applicant,
  data: any,
  index: number
) => {
  const labelFields = document.querySelectorAll<HTMLLabelElement>("label");

  for (const label of labelFields) {
    const text = label?.textContent;
    // for compay
    if (text && fromatStirngInLowerCase(text)?.includes("company")) {
      const inputId = label.getAttribute("for");
      if (inputId) {
        const input: any = document.getElementById(inputId);
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          if (input) {
            input.value = data?.employeer ?? "";
            input.focus(); // Autofocus on the input field
            input.click();
            input.click();
            await delay(1000);
            handleValueChanges(input);
            setIdToLocalstorage(inputId);
          }
        }
      }
    }

    // for posotion
    if (text && fromatStirngInLowerCase(text)?.includes("title")) {
      const inputId = label.getAttribute("for");
      if (inputId) {
        const input: any = document.getElementById(inputId);
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          if (input) {
            input.value = data?.jobTitle ?? "";
            input.focus(); // Autofocus on the input field
            input.click();
            input.click();
            await delay(1000);
            handleValueChanges(input);
            setIdToLocalstorage(inputId);
          }
        }
      }
    }

    // for currenty working

    if (text && fromatStirngInLowerCase(text)?.includes("current")) {
      const inputId = label.getAttribute("for");
      if (inputId) {
        const select: any = document.getElementById(inputId);
        const id = select.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          if (select) {
            // filling state data
            Array.from(select.options).find((option: any) => {
              if (
                data.isWorking &&
                fromatStirngInLowerCase(option?.text) === "yes"
              ) {
                option.selected = true;
                handleValueChanges(select);
              }

              if (
                !data.isWorking &&
                fromatStirngInLowerCase(option?.text) === "no"
              ) {
                option.selected = true;
                handleValueChanges(select);
              }
            });
            await delay(1000);
            handleValueChanges(select);
            setIdToLocalstorage(inputId);
          }
        }
      }
    }

    // for start date
    if (text && fromatStirngInLowerCase(text)?.includes("start")) {
      const inputId = label.getAttribute("for");
      if (inputId) {
        const input: any = document.getElementById(inputId);
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          if (input) {
            input.value = formatDateToYYYYMM(data.startDate);
            input.focus(); // Autofocus on the input field
            input.click();
            input.click();
            await delay(1000);
            handleValueChanges(input);
            setIdToLocalstorage(inputId);
          }
        }
      }
    }

    // end data

    // for start date
    if (
      !data.isWorking &&
      text &&
      fromatStirngInLowerCase(text)?.includes("end")
    ) {
      const inputId = label.getAttribute("for");
      if (inputId) {
        const input: any = document.getElementById(inputId);
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          if (input) {
            input.value = formatDateToYYYYMM(data.endDate);
            input.focus(); // Autofocus on the input field
            input.click();
            input.click();
            await delay(1000);
            handleValueChanges(input);
            setIdToLocalstorage(inputId);
          }
        }
      }
    }
  }
};

export const lenovo = async (tempDiv: any, applicantData: Applicant) => {
  //
  await fillWorkExperience(applicantData);
};
