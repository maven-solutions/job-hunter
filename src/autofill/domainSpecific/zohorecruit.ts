import { sanitizeHTML } from "../../utils/helper";
import { fieldNames } from "../FromFiller/fieldsname";
import { checkIfExist, delay, handleValueChanges } from "../helper";

const getYear = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  return year.toString();
};
const getMonth = (dateString) => {
  const date = new Date(dateString);

  // Array of month names
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get the month index (0-11) and then get the corresponding month name
  const month = monthNames[date.getMonth()];
  return month.toString();
};
const fillEducationInputBox = async (data) => {
  const textInputFields: any = document.querySelectorAll('input[type="text"]');
  for (const input of textInputFields) {
    const attributes: any = Array.from(input.attributes);

    for (const attribute of attributes) {
      if (checkIfExist(attribute.value, fieldNames.collage) && !input.value) {
        input.focus();
        input.click();
        input.value = data.school;
        handleValueChanges(input);
        // break;
      }

      if (checkIfExist(attribute.value, fieldNames.major) && !input.value) {
        input.focus();
        input.click();
        input.value = data.major;
        handleValueChanges(input);
        // break;
      }

      if (checkIfExist(attribute.value, fieldNames.degree) && !input.value) {
        input.focus();
        input.click();
        input.value = data.degree;
        handleValueChanges(input);
        // break;
      }
    }
  }
};

const educationDateFiller = async (data) => {
  const fromSelect: any = document.querySelectorAll(
    'select[aria-label="From"]'
  );

  for (const select of fromSelect) {
    if (!select.value) {
      Array.from(select.options).find((option: any) => {
        //   console.log("text::", option.textContent.trim());
        if (option.textContent.trim() === getYear(data.startDate)) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }
      });
    }
  }

  const fromMonthSelect: any = document.querySelectorAll(
    'select[aria-label="Duration From"]'
  );

  for (const select of fromMonthSelect) {
    if (!select.value) {
      Array.from(select.options).find((option: any) => {
        if (option.textContent.trim() === getMonth(data.startDate)) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }
      });
    }
  }

  const toSelect: any = document.querySelectorAll('select[aria-label="To"]');

  for (const select of toSelect) {
    if (!select.value) {
      Array.from(select.options).find((option: any) => {
        //   console.log("text::", option.textContent.trim());
        if (option.textContent.trim() === getYear(data.endDate)) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }

        if (option.textContent.trim() === getMonth(data.endDate)) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }
      });
    }
  }
};
const educationDataFiller = async (applicantData) => {
  const educationButton: any = document.querySelector(
    'a[title="Add Educational Details"]'
  );

  if (
    educationButton &&
    applicantData.education &&
    applicantData.education.length > 0
  ) {
    for (const [index, element] of applicantData.education.entries()) {
      try {
        await delay(500);
        educationButton.click();
        await delay(500);
        await fillEducationInputBox(element);
        await educationDateFiller(element);
        await delay(500);
      } catch (error) {
        console.error(
          `Error processing education entry at index ${index}:`,
          error
        );
      }
    }
  } else {
    console.warn(
      "No education details found or education button not available"
    );
  }
};

const workExperienceDatafiller = (data) => {
  const textInputFields: any = document.querySelectorAll('input[type="text"]');
  for (const input of textInputFields) {
    const attributes: any = Array.from(input.attributes);

    for (const attribute of attributes) {
      if (checkIfExist(attribute.value, ["occupation"]) && !input.value) {
        input.focus();
        input.click();
        input.value = data.jobTitle;
        handleValueChanges(input);
        // break;
      }

      if (checkIfExist(attribute.value, fieldNames.company) && !input.value) {
        input.focus();
        input.click();
        input.value = data.employeer;
        handleValueChanges(input);
        // break;
      }

      if (checkIfExist(attribute.value, ["summary"]) && !input.value) {
        input.focus();
        input.click();
        const cleanedHtml = sanitizeHTML(data.description);
        input.value = cleanedHtml;
        handleValueChanges(input);
        // break;
      }
    }
  }

  const textareaInputFields: any = document.querySelectorAll("textarea");
  for (const input of textareaInputFields) {
    const attributes: any = Array.from(input.attributes);

    for (const attribute of attributes) {
      if (checkIfExist(attribute.value, ["summary"]) && !input.value) {
        input.focus();
        input.click();
        const cleanedHtml = sanitizeHTML(data.description);
        input.value = cleanedHtml;
        handleValueChanges(input);
        // break;
      }
    }
  }
};

const workExperienceDatefiller = async (data) => {
  const fromSelect: any = document.querySelectorAll(
    'select[aria-label="From"]'
  );

  for (const select of fromSelect) {
    if (!select.value) {
      Array.from(select.options).find((option: any) => {
        //   console.log("text::", option.textContent.trim());
        if (option.textContent.trim() === getYear(data.startDate)) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }
      });
    }
  }

  const fromMonthSelect: any = document.querySelectorAll(
    'select[aria-label="Work Duration From"]'
  );

  for (const select of fromMonthSelect) {
    if (!select.value) {
      Array.from(select.options).find((option: any) => {
        if (option.textContent.trim() === getMonth(data.startDate)) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }
      });
    }
  }

  const toSelect: any = document.querySelectorAll('select[aria-label="To"]');

  for (const select of toSelect) {
    if (!select.value) {
      Array.from(select.options).find((option: any) => {
        //   console.log("text::", option.textContent.trim());
        if (option.textContent.trim() === getYear(data.endDate)) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }

        if (
          !data.isWorking &&
          option.textContent.trim() === getMonth(data.endDate)
        ) {
          option.focus(); // Autofocus on the option field
          option.click();
          option.selected = true;
          select.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: false })
          );
          option.blur();
          handleValueChanges(option);
          return true;
        }
      });
    }
  }
  await delay(500);
  if (data.isWorking) {
    const checkbox: any = document.querySelector(
      '[aria-label="I currently work here"]'
    );
    checkbox.checked = true;
    handleValueChanges(checkbox);
  }
};

const workExperience = async (applicantData) => {
  // Implementation for work experience filling if needed
  const workButton: any = document.querySelector(
    'a[title="Add Experience Details"]'
  );

  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for await (const [
      index,
      element,
    ] of applicantData.employment_history.entries()) {
      await delay(500);
      workButton.click();
      await delay(500);
      await workExperienceDatafiller(element);
      await workExperienceDatefiller(element);
      await delay(500);
      // console.log("Processed element:", index);
    }
  }
};

export const zohorecruit = async (tempDiv, applicantData) => {
  await educationDataFiller(applicantData);
  await workExperience(applicantData);
};
