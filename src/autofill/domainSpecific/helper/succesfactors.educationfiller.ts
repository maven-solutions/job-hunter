import { Applicant } from "../../data";
import {
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../../helper";

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

const degreeFiller = async (data, index, id, input) => {
  const selectOptions: any = document.querySelectorAll('li[role="option"]');
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
      input.setAttribute("ci_date_filled", index);
      element.click();
    }
  }
  await delay(1500);
};

const fieldOfStudy = async (data, index, id, input) => {
  const selectOptions: any = document.querySelectorAll('li[role="option"]');
  for (const [index, element] of selectOptions.entries()) {
    if (
      fromatStirngInLowerCase(element.textContent.trim()) ===
        fromatStirngInLowerCase(data?.major) ||
      fromatStirngInLowerCase(element.textContent.trim())?.includes(
        fromatStirngInLowerCase(data?.major)
      ) ||
      fromatStirngInLowerCase(data?.major)?.includes(
        fromatStirngInLowerCase(element.textContent.trim())
      )
    ) {
      setIdToLocalstorage(id);
      input.setAttribute("ci_date_filled", index);
      element.click();
    }
  }
  await delay(1500);
};

export const educationDatafiller = async (
  tempDiv: HTMLElement,
  applicantData: Applicant,
  data: any,
  index: number
) => {
  const textInputFields =
    tempDiv.querySelectorAll<HTMLInputElement>('input[type="text"]');

  for (const [inputIndex, input] of textInputFields.entries()) {
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: any = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    if (
      (labelText === "Educational Institution" ||
        labelText === "College/University") &&
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
      }
    }

    if (
      (labelText === "Field of Study" || labelText === "Area of Study") &&
      input.value === ""
    ) {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.click();
        await delay(1000);
        await fieldOfStudy(data, index, id, input);
      }
    }

    if (
      (labelText === "Educational Level" || labelText === "Degree") &&
      input.value === ""
    ) {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.click();
        await delay(1000);
        await degreeFiller(data, index, id, input);
      }
    }
  }

  // workDaysdateFiller(data, index);
};
