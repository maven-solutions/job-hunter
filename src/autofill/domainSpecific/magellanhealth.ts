import { fieldNames } from "../FromFiller/fieldsname";
import { getYearFromDate } from "../FromFiller/helper";
import { Applicant } from "../data";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const handleDisabiblit = (applicantData: Applicant) => {
  const disabilityEle: HTMLElement = document.getElementById(
    "disability_heading_self_identity.disabilityStatus"
  );

  if (!disabilityEle) {
    return;
  }
  const allLabel = disabilityEle.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    if (
      label &&
      applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("yesihave")
    ) {
      label.click();
    }

    if (
      label &&
      !applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("idonothave")
    ) {
      label.click();
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

const degreeFiller = async (data, index) => {
  const selectButtonFields: any = document.querySelectorAll("select");

  if (selectButtonFields && selectButtonFields.length > 0) {
    for (const [selectIndex, select] of selectButtonFields.entries()) {
      if (!select.hasAttribute("ci_date_filled")) {
        const id = select.getAttribute("id");
        const allInputId = getAllinputId();

        if (
          !allInputId?.includes(id) &&
          !select.hasAttribute("ci_date_filled")
        ) {
          // for degree
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
              setIdToLocalstorage(id);
              select.setAttribute("ci_date_filled", index);
              option.selected = true;
              handleValueChanges(select);
              return true;
            }
          });

          // for major

          Array.from(select.options).find((option: any) => {
            if (
              fromatStirngInLowerCase(option?.text) ===
                fromatStirngInLowerCase(data?.major) ||
              fromatStirngInLowerCase(option?.text).includes(
                fromatStirngInLowerCase(data?.major)
              ) ||
              fromatStirngInLowerCase(data?.major).includes(
                fromatStirngInLowerCase(option?.text)
              )
            ) {
              setIdToLocalstorage(id);
              select.setAttribute("ci_date_filled", index);
              option.selected = true;
              handleValueChanges(select);
              return true;
            }
          });
        }
      }
    }
  }
  await delay(500);
};

const educationDataFiller = async (
  applicantData: Applicant,
  data: any,
  index: number
) => {
  const body: any = document.getElementsByTagName("body");
  const textInputFields =
    document.querySelectorAll<HTMLInputElement>('input[type="text"]');
  console.log("data::", index, "::", data);
  // console.log("inputid", localStorage.getItem("ci_inputid"));
  for (const [inputIndex, input] of textInputFields.entries()) {
    const attributes: any = Array.from(input.attributes);
    // console.log("input::", input);
    // Log all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: any =
      document.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    for await (const attribute of attributes) {
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
          input.value = data.school;
          await delay(500);
          handleValueChanges(input);
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
          input.value = data.gpa;
          await delay(500);
          handleValueChanges(input);
        }
      }

      //
      if (
        checkIfExist(labelText, ["startdate"]) ||
        (checkIfExist(attribute.value, ["startdate"]) && input.value === "")
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          setIdToLocalstorage(id);
          input.focus(); // Autofocus on the input field
          await delay(500);
          const allDate: any = document.querySelectorAll(
            ".react-datepicker__year-text"
          );

          for await (const date of allDate) {
            if (date.textContent == getYearFromDate(data.startDate)) {
              date.click();
              handleValueChanges(date);
            }
          }
        }
      }

      //
      if (
        checkIfExist(labelText, ["enddate"]) ||
        (checkIfExist(attribute.value, ["enddate"]) && input.value === "")
      ) {
        const id = input.getAttribute("id");
        const allInputId = getAllinputId();
        if (!allInputId?.includes(id)) {
          setIdToLocalstorage(id);
          input.focus(); // Autofocus on the input field
          await delay(500);
          const allDate: any = document.querySelectorAll(
            ".react-datepicker__year-text"
          );
          for await (const date of allDate) {
            if (date.textContent == getYearFromDate(data.endDate)) {
              date.click();
              handleValueChanges(date);
            }
          }
        }
      }
    }
  }
  await delay(1000);
  degreeFiller(data, index);
  await delay(1000);
};

const handleEducation = async (applicantData: Applicant) => {
  localStorage.removeItem("ci_inputid");
  const educationButton = document.getElementById(
    "array-button-add-educationData"
  );
  if (!educationButton) {
    return;
  }
  const deleteEducationButton: any = document.querySelectorAll(
    '[aria-label="Remove education"]'
  );
  if (!deleteEducationButton || deleteEducationButton.length == 0) {
    return;
  }
  for await (const deleteButton of deleteEducationButton) {
    deleteButton.click();
    console.log("delete button clicked");
    await new Promise((resolve) => {
      deleteButton.addEventListener("click", resolve, { once: true });
      deleteButton.dispatchEvent(new MouseEvent("click"));
    });
    await delay(1000);
  }

  if (applicantData.education && applicantData.education.length > 0) {
    for await (const [index, element] of applicantData.education.entries()) {
      await delay(1000);
      educationButton.click();
      console.log("education button clicked");
      await new Promise((resolve) => {
        educationButton.addEventListener("click", resolve, { once: true });
        educationButton.dispatchEvent(new MouseEvent("click"));
      });
      await delay(1000);
      await educationDataFiller(applicantData, element, index);
      await delay(1000);
    }
  }
};

export const magellanhealth = async (
  tempDiv: any,
  applicantData: Applicant
) => {
  await handleDisabiblit(applicantData);

  await handleEducation(applicantData);
};
