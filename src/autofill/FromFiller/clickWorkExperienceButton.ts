// import sanitizeHtml from "sanitize-html";

import { Applicant } from "../data";
import { checkIfExist, handleValueChanges } from "../helper";
import { fieldNames } from "./fieldsname";
import { getMonthFromDate, getYearFromDate } from "./helper";

export function sanitizeHTML(htmlString) {
  // Remove inline styles
  htmlString = htmlString.replace(/<[^>]+? style="[^"]*?"/gi, "");

  // Remove all tags except 'p'
  htmlString = htmlString.replace(/<(\/)?(?!p\b)\w+[^>]*?>/g, "");

  htmlString = htmlString.replace(/&nbsp;/g, "");

  return htmlString;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const getAllinputId = () => {
  const ids = localStorage.getItem("ci_inputid");
  return ids;
};
const setIdToLocalstorage = (id: any) => {
  let allInputId = [];
  const ids = localStorage.getItem("ci_inputid");
  if (ids) {
    const allIds = JSON.parse(ids);
    allInputId = [...allIds, id];
  } else {
    allInputId[id];
  }
  localStorage.setItem("ci_inputid", JSON.stringify(allInputId));
};

const checkobxFiller = () => {
  const textInputFields = document.querySelectorAll('input[type="checkbox"]');
  // console.log("text::", textInputFields);
  textInputFields.forEach((input: any) => {
    // console.log(input);
    // Extract all attributes
    const attributes: any = Array.from(input.attributes);
    // Log all attributes
    attributes.some((attribute) => {
      if (checkIfExist(attribute.value, fieldNames.currently_work_here)) {
        input.setAttribute("aria-checked", "true");
        input.checked = true;
        handleValueChanges(input);
        return true; // Stop iterating
      }
      return false; // Continue iterating
    });
    // You can do whatever you want with each input field here
  });
};

export const dateFiller = async (data, index) => {
  // console.log("date:::", index, "::", data);
  let fromMonthFiled = false;
  let fromYearFiled = false;
  const allDateInput = document.querySelectorAll<HTMLInputElement>("input");

  for (const [inputIndex, input] of allDateInput.entries()) {
    const attributes: any = Array.from(input.attributes);

    for (const attribute of attributes) {
      if (
        checkIfExist(attribute.value, fieldNames.month) &&
        input.value === "" &&
        !input.hasAttribute("ci_date_filled") // Ensure this condition is not true
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        // console.log("MM::", getMonthFromDate(data.startDate));
        if (
          !allInputId?.includes(id) &&
          !input.hasAttribute("ci_date_filled") &&
          !fromMonthFiled
        ) {
          setIdToLocalstorage(id);
          input.setAttribute("ci_date_filled", index);
          input.value = getMonthFromDate(data.startDate);
          fromMonthFiled = true;
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          handleValueChanges(input);
          // break;
        }
      }

      if (
        checkIfExist(attribute.value, fieldNames.year) &&
        input.value === "" &&
        !input.hasAttribute("ci_date_filled") // Ensure this condition is not true
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        // console.log("yy::", getYearFromDate(data.startDate));
        if (
          !allInputId?.includes(id) &&
          !input.hasAttribute("ci_date_filled") &&
          !fromYearFiled
        ) {
          setIdToLocalstorage(id);
          input.setAttribute("ci_date_filled", index);
          input.value = getYearFromDate(data.startDate);
          fromYearFiled = true;
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          handleValueChanges(input);
          // break;
        }
      }

      if (
        checkIfExist(attribute.value, fieldNames.month) &&
        input.value === "" &&
        !input.hasAttribute("ci_date_filled") // Ensure this condition is not true
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        // console.log("MMe::", getMonthFromDate(data.endDate));
        if (
          !allInputId?.includes(id) &&
          !input.hasAttribute("ci_date_filled")
        ) {
          setIdToLocalstorage(id);
          input.setAttribute("ci_date_filled", index);
          input.value = getMonthFromDate(data.endDate);
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          handleValueChanges(input);
          break;
        }
      }

      if (
        checkIfExist(attribute.value, fieldNames.year) &&
        input.value === "" &&
        !input.hasAttribute("ci_from_year") // Ensure this condition is not true
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        // console.log("yye::", getYearFromDate(data.endDate));
        if (!allInputId?.includes(id) && !input.hasAttribute("ci_to_year")) {
          setIdToLocalstorage(id);
          input.setAttribute("ci_to_year", index);
          input.value = getYearFromDate(data?.endDate);
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          handleValueChanges(input);
          break;
        }
      }
    }
  }
};

export const clickWorkExperienceButton = async (tempDiv, applicantData) => {
  let delte = false;
  let button: any = "";
  button = document.querySelector('button[aria-label="Add Work Experience"]');
  if (!button) {
    button = document.querySelector(
      'button[aria-label="Add Another Work Experience"]'
    );
  }
  if (!button) {
    return;
  }

  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    const jobtitle = document.querySelector('[data-automation-id="jobTitle"]');
    for await (const [
      index,
      element,
    ] of applicantData.employment_history.entries()) {
      // console.log("Processing employment history element:", element);

      await delay(500);
      button.click();

      if (jobtitle) {
        if (!delte) {
          await delay(500);
          const delteButton: any = document.querySelector(
            'button[aria-label="Delete Work Experience 1"]'
          );
          if (delteButton) {
            delteButton.click();
            delte = true;
            // await delay(500);
          }
        }
      }

      // Attach click event handler instead of directly invoking click()
      await new Promise((resolve) => {
        button.addEventListener("click", resolve, { once: true });
        button.dispatchEvent(new MouseEvent("click"));
      });

      await delay(500);
      console.log("workExperienceDatafiller called");
      await workExperienceDatafiller(tempDiv, applicantData, element, index);

      // await delay(500);
      // console.log("Processed element:", index);
    }
  }
};

const workExperienceDatafiller = async (
  tempDiv: HTMLElement,
  applicantData: Applicant,
  data: any,
  index: number
) => {
  const textInputFields =
    tempDiv.querySelectorAll<HTMLInputElement>('input[type="text"]');
  // console.log("index::", index, "::", data);

  for (const [inputIndex, input] of textInputFields.entries()) {
    const attributes: any = Array.from(input.attributes);
    // console.log("input::", input);

    for (const attribute of attributes) {
      if (
        checkIfExist(attribute.value, fieldNames.job_title) &&
        input.value === ""
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          input.value = data?.jobTitle ?? "";
          setIdToLocalstorage(id);
          input.focus(); // Autofocus on the input field
          input.click();

          input.select();
          await delay(100);

          handleValueChanges(input);
          // await delay(100);
          break;
        }
      }

      if (
        checkIfExist(attribute.value, fieldNames.company) &&
        input.value === ""
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          setIdToLocalstorage(id);

          input.value = data?.employeer ?? "";
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          await delay(100);
          handleValueChanges(input);
          // await delay(100);
          break;
        }
      }

      if (
        checkIfExist(attribute.value, fieldNames.company_location) &&
        input.value === ""
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          setIdToLocalstorage(id);
          input.value = data?.city?.label ?? "";
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();

          await delay(100);

          handleValueChanges(input);
          // await delay(100);
          break;
        }
      }
    }

    if (data.isWorking) {
      checkobxFiller();
    }
  }

  ///
  const textareaFields = tempDiv.querySelectorAll<HTMLInputElement>("textarea");
  // console.log("data::", index, "::", data);
  // console.log("inputid", localStorage.getItem("ci_inputid"));
  for (const [inputIndex, input] of textareaFields.entries()) {
    const attributes: any = Array.from(input.attributes);
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: Element = tempDiv.querySelector(`[for="${inputId}"]`);
    const labelText = labelElement?.textContent?.trim() ?? "";
    // console.log("input::", input);
    for (const attribute of attributes) {
      if (
        checkIfExist(labelText, fieldNames.role_description) ||
        (checkIfExist(attribute.value, fieldNames.role_description) &&
          input.value === "")
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          setIdToLocalstorage(id);
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          const cleanedHtml = sanitizeHTML(data?.description ?? "");
          input.value = cleanedHtml;
          await delay(100);
          handleValueChanges(input);
          // await delay(100);
          break;
        }
      }
    }
  }

  dateFiller(data, index);
};
