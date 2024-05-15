import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import { dateFiller } from "./clickWorkExperienceButton";
import { fieldNames } from "./fieldsname";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const clickEducationButton = async (tempDiv, applicantData) => {
  let educationFound = false;
  let delte = false;
  const buttonFields = tempDiv.querySelectorAll("button");
  for await (const button of buttonFields) {
    const attributes: any = Array.from(button.attributes);
    attributes.some((attribute) => {
      if (checkIfExist(attribute.value, fieldNames.education_button)) {
        educationFound = true;
        return true; // Stop iterating
      }
      return false; // Continue iterating
    });

    if (
      educationFound &&
      applicantData.education &&
      applicantData.education.length > 0
    ) {
      for await (const [index, element] of applicantData.education.entries()) {
        // console.log("Processing employment history element:", element);

        await delay(500);
        button.click();
        if (window.location.href.includes("leidos.wd5.myworkdayjobs")) {
          if (!delte) {
            await delay(2000);
            const delteButton: any = document.querySelector(
              'button[aria-label="Delete Education 1"]'
            );
            if (!delteButton) {
              return;
            }

            delteButton.click();
            delte = true;
            await delay(1000);
          }
        }

        // console.log("Button clicked");
        // Attach click event handler instead of directly invoking click()
        await new Promise((resolve) => {
          button.addEventListener("click", resolve, { once: true });
          button.dispatchEvent(new MouseEvent("click"));
        });

        await delay(1000);
        // console.log("educationDatafiller called");
        await educationDatafiller(tempDiv, applicantData, element, index);

        await delay(1000);
        // console.log("Processed element:", index);
      }
      educationFound = false;
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
  dateFiller(data, index);
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
  // console.log("degree:", data);

  // console.log("ee::", e);

  let degree = false;
  const tempDiv = document.querySelector("body");

  let selectButtonFields: any = tempDiv.querySelectorAll(
    'button[aria-haspopup="listbox"]'
  );
  if (window.location.href.includes("autodesk.wd1.myworkdayjobs.")) {
    selectButtonFields = tempDiv.querySelectorAll(
      'button[data-automation-id="degree"]'
    );
  }
  if (selectButtonFields && selectButtonFields.length > 0) {
    // console.log("selectButtonFields::", selectButtonFields);
    // console.log("selectButtonFields::", selectButtonFields);
    for (const [selectIndex, select] of selectButtonFields.entries()) {
      // console.log("select::", select);

      const selectid = select.getAttribute("id");
      const labelElement = tempDiv.querySelector(`[for="${selectid}"]`);
      if (!labelElement) {
        return;
      }
      const labelText = labelElement.textContent.trim();
      console.log("labelText::", labelText);

      // for degree
      if (
        checkIfExist(labelText, fieldNames.degree) &&
        !select.hasAttribute("ci_date_filled")
      ) {
        const id = select.getAttribute("id");
        const allInputId = getAllinputId();

        // console.log("degree::fired");

        if (
          !allInputId?.includes(id) &&
          !select.hasAttribute("ci_date_filled")
        ) {
          select.click();
          await delay(200);
          // console.log("degree::fired22");

          const selectOptions: any =
            document.querySelectorAll('[role="option"]');
          for (const [index, element] of selectOptions.entries()) {
            // console.log("option--", element?.textContent?.trim());
            if (
              fromatStirngInLowerCase(element.textContent.trim()) ===
                fromatStirngInLowerCase(data?.degree) ||
              fromatStirngInLowerCase(element.textContent.trim()).includes(
                fromatStirngInLowerCase(data?.degree)
              ) ||
              fromatStirngInLowerCase(data?.degree).includes(
                fromatStirngInLowerCase(element.textContent.trim())
              )
            ) {
              // console.log("options::--", element);
              // console.log("text--", element?.textContent?.trim());

              // console.log("educationField::--", data.field);
              setIdToLocalstorage(id);
              select.setAttribute("ci_date_filled", index);
              degree = true;
              element.focus();
              element.click();
              await delay(300);
              await delay(200);
              return true;
            }
          }
        }
      }
    }
  }
  const selectButtonFields2: any = tempDiv.querySelectorAll("select");
  if (selectButtonFields || selectButtonFields.length > 0) {
    ///
  } else {
    return;
  }
  for (const select of selectButtonFields2) {
    const selectid = select.getAttribute("id");
    const labelElement = tempDiv.querySelector(`[for="${selectid}"]`);

    const labelText = labelElement?.textContent?.trim();
    const attributes: any = Array.from(select.attributes);
    // for degree
    attributes.some((attribute) => {
      if (
        checkIfExist(labelText, fieldNames.degree) ||
        (checkIfExist(attribute.value, fieldNames.degree) &&
          !select.hasAttribute("ci_date_filled"))
      ) {
        const id = select.getAttribute("id");
        const allInputId = getAllinputId();
        if (
          !allInputId?.includes(id) &&
          !select.hasAttribute("ci_date_filled")
        ) {
          Array.from(select.options).find((option: any) => {
            if (
              fromatStirngInLowerCase(option?.text) ===
                fromatStirngInLowerCase(data?.degree) ||
              fromatStirngInLowerCase(option?.text).includes(
                fromatStirngInLowerCase(data?.degree)
              ) ||
              fromatStirngInLowerCase(data?.degree).includes(
                fromatStirngInLowerCase(option?.text)
              )
            ) {
              option.focus(); // Autofocus on the option field
              option.click();
              option.selected = true;
              select.setAttribute("ci_date_filled", index);
              select.dispatchEvent(
                new Event("change", { bubbles: true, cancelable: false })
              );
              option.blur();
              handleValueChanges(option);
              // gender = true;
              return true;
            }
          });
        }
      }
    });

    // for field of study
    attributes.some((attribute) => {
      if (
        checkIfExist(labelText, fieldNames.field_of_study) ||
        (checkIfExist(attribute.value, fieldNames.field_of_study) &&
          !select.hasAttribute("ci_date_filled"))
      ) {
        const id = select.getAttribute("id");
        const allInputId = getAllinputId();

        if (
          !allInputId?.includes(id) &&
          !select.hasAttribute("ci_date_filled")
        ) {
          Array.from(select.options).find((option: any) => {
            if (
              fromatStirngInLowerCase(option?.text) ===
                fromatStirngInLowerCase(data.major) ||
              fromatStirngInLowerCase(option?.text).includes(
                fromatStirngInLowerCase(data.major)
              ) ||
              fromatStirngInLowerCase(data.major).includes(
                fromatStirngInLowerCase(option?.text)
              )
            ) {
              option.focus(); // Autofocus on the option field
              option.click();
              option.selected = true;
              select.setAttribute("ci_date_filled", index);
              handleValueChanges(option);
              // gender = true;
              return true;
            }
          });
        }
      }
    });
  }
};
