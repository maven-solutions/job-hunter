import { fieldNames } from "../FromFiller/fieldsname";
import { Applicant } from "../data";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import { workDaysdateFiller } from "./myworkdayWork";

export const clickWorkdayEducationButton = async (applicantData) => {
  const tempDiv = document.querySelector("body");
  let delte = false;
  let button: any = "";
  button = document.querySelector('[aria-label="Add Education"]');
  if (window.location.href.includes("jda.wd5.myworkdayjobs.")) {
    button = document.querySelector(
      '[aria-label="Add Education and Training"]'
    );
  }
  if (!button) {
    button = document.querySelector('[aria-label="Add Another Education"]');
    if (window.location.href.includes("jda.wd5.myworkdayjobs.")) {
      button = document.querySelector(
        '[aria-label="Add Another Education and Training"]'
      );
    }
  }

  if (window.location.href.includes("ferguson.wd1.myworkdayjobs.com")) {
    const parentdiv = document.querySelector(
      '[aria-labelledby="Education-section"]'
    );
    if (parentdiv) {
      button = parentdiv?.querySelector("button");
    }
  }

  if (window.location.href.includes("dentsuaegis.wd3.myworkdayjobs.com")) {
    let parentdiv = document.querySelector(
      '[aria-labelledby="Education-section"]'
    );
    if (!parentdiv) {
      parentdiv = document.querySelector(
        '[aria-labelledby="Education-(Optional)-section"]'
      );
    }
    if (parentdiv) {
      button = parentdiv?.querySelector("button");
    }
  }

  if (window.location.href.includes("sourcewell.wd1.myworkdayjobs.com")) {
    const parentdiv = document.querySelector(
      '[aria-labelledby="Education-section"]'
    );

    if (parentdiv) {
      button = parentdiv?.querySelector('[data-automation-id="add-button"]');
    }
  }

  if (!button) {
    return;
  }

  if (applicantData.education && applicantData.education.length > 0) {
    let degreeDected = document.querySelector('[data-automation-id="degree"]');

    if (window.location.href.includes("sourcewell.wd1.myworkdayjobs.com")) {
      degreeDected = document.querySelector('[name="degree"]');
    }

    for await (const [index, element] of applicantData.education.entries()) {
      // console.log("Processing employment history element:", element);

      await delay(500);
      button.click();
      if (degreeDected) {
        if (!delte) {
          await delay(500);
          let delteButton: any = document.querySelector(
            'button[aria-label="Delete Education 1"]'
          );

          if (
            window.location.href.includes("sourcewell.wd1.myworkdayjobs.com")
          ) {
            const delteButtonParent = document.querySelector(
              '[aria-labelledby="Education-2-panel"]'
            );
            delteButton = delteButtonParent?.querySelector("button");
          }
          if (!delteButton) {
            return;
          }

          delteButton.click();
          delte = true;
          // await delay(500);
        }
      }

      // console.log("ed -- Button clicked");
      // Attach click event handler instead of directly invoking click()
      await new Promise((resolve) => {
        button.addEventListener("click", resolve, { once: true });
        button.dispatchEvent(new MouseEvent("click"));
      });

      await delay(500);
      // console.log("educationDatafiller called");
      await educationDatafiller(tempDiv, applicantData, element, index);

      // await delay(500);
      // console.log("Processed element:", index);
    }
  }
};
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
const educationDatafiller = async (
  tempDiv: HTMLElement,
  applicantData: Applicant,
  data: any,
  index: number
) => {
  const textInputFields =
    tempDiv.querySelectorAll<HTMLInputElement>('input[type="text"]');
  // console.log("data::", index, "::", data);
  // console.log("inputid", localStorage.getItem("ci_inputid"));
  for (const [inputIndex, input] of textInputFields.entries()) {
    const attributes: any = Array.from(input.attributes);
    // console.log("input::", input);
    // Log all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: any = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    for (const attribute of attributes) {
      if (
        (checkIfExist(labelText, fieldNames.collage) ||
          checkIfExist(attribute.value, fieldNames.collage)) &&
        input.value === ""
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          setIdToLocalstorage(id);
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          input.value = data.school;
          await delay(100);
          handleValueChanges(input);
          // await delay(100);
          break;
        }
      }

      //
      if (
        checkIfExist(labelText, fieldNames.gpa) ||
        (checkIfExist(attribute.value, fieldNames.gpa) && input.value === "")
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          setIdToLocalstorage(id);
          input.focus(); // Autofocus on the input field
          input.click();
          input.select();
          input.value = data.gpa;
          await delay(100);
          handleValueChanges(input);
          // await delay(100);
          break;
        }
      }
    }
  }

  degreeFiller(data, index);
  workDaysdateFiller(data, index);
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

const degreeFiller = async (data, index) => {
  const tempDiv = document.querySelector("body");

  const selectButtonFields: any = tempDiv.querySelectorAll(
    'button[data-automation-id="degree"]'
  );

  if (selectButtonFields && selectButtonFields.length > 0) {
    for (const [selectIndex, select] of selectButtonFields.entries()) {
      // for degree
      if (!select.hasAttribute("ci_date_filled")) {
        const id = select.getAttribute("id");
        const allInputId = getAllinputId();

        if (
          !allInputId?.includes(id) &&
          !select.hasAttribute("ci_date_filled")
        ) {
          select.click();
          await delay(1000);

          const selectOptions: any =
            document.querySelectorAll('[role="option"]');
          for (const [index, element] of selectOptions.entries()) {
            if (
              fromatStirngInLowerCase(element.textContent.trim()) ===
                fromatStirngInLowerCase(data?.degree) ||
              fromatStirngInLowerCase(element.textContent.trim())?.includes(
                fromatStirngInLowerCase(data?.degree)
              ) ||
              fromatStirngInLowerCase(data?.degree)?.includes(
                fromatStirngInLowerCase(element.textContent.trim())
              )
            ) {
              setIdToLocalstorage(id);
              select.setAttribute("ci_date_filled", index);
              element.focus();
              element.click();
            }
          }
        }
      }
    }
  }
  await delay(500);
};
