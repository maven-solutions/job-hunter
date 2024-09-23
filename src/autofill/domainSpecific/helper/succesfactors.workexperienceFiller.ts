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

export const workExperienceDatafiller = async (
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
      fromatStirngInLowerCase(labelText).includes(
        fromatStirngInLowerCase("Employer")
      ) &&
      input.value === ""
    ) {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.value = data?.employeer ?? "";
        await delay(100);
        handleValueChanges(input);
      }
    }

    if (
      fromatStirngInLowerCase(labelText).includes(
        fromatStirngInLowerCase("City/State")
      ) &&
      input.value === ""
    ) {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.value = data?.city?.label ?? "";
        await delay(100);
        handleValueChanges(input);
      }
    }

    if (
      fromatStirngInLowerCase(labelText).includes(
        fromatStirngInLowerCase("Job Title")
      ) &&
      input.value === ""
    ) {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.value = data?.jobTitle ?? "";
        await delay(100);
        handleValueChanges(input);
      }
    }
  }
};
