import {
  getAllinputId,
  isEmptyArray,
  sanitizeHTML,
  setIdToLocalstorage,
} from "../../../utils/helper";
import { Applicant } from "../../data";
import { fieldNames } from "../../FromFiller/fieldsname";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../../helper";

const getDoneButton = () => {
  const buttons = document?.querySelectorAll("button");
  if (isEmptyArray(buttons)) return;
  // Filter buttons to find the ones whose textContent is exactly "Yes"
  const doneButton = Array.from(buttons)?.find((button) =>
    button?.textContent?.trim()?.toLowerCase().includes("done")
  );
  if (doneButton) {
    return doneButton;
  }
  return null;
};

export const talemetryWorkExperienceDatafiller = async (
  tempDiv: HTMLElement,
  applicantData: Applicant,
  data: any,
  index: number
) => {
  await delay(2000);
  console.log("entered::;");
  const textInputFields =
    document.querySelectorAll<HTMLInputElement>('input[type="text"]');

  console.log("textInputFields::", textInputFields);

  for (const [inputIndex, input] of textInputFields.entries()) {
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: any =
      document.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    if (
      fromatStirngInLowerCase(labelText)?.includes(
        fromatStirngInLowerCase("company")
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
      fromatStirngInLowerCase(labelText)?.includes(
        fromatStirngInLowerCase("city")
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
      fromatStirngInLowerCase(labelText)?.includes(
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
        console.log("jobTitle::", data?.jobTitle ?? "");

        await delay(100);
        handleValueChanges(input);
      }
    }
  }

  const textareaFields =
    document.querySelectorAll<HTMLInputElement>("textarea");
  for (const [inputIndex, input] of textareaFields.entries()) {
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: Element = document.querySelector(`[for="${inputId}"]`);
    const labelText = labelElement?.textContent?.trim() ?? "";

    if (
      fromatStirngInLowerCase(labelText)?.includes(
        fromatStirngInLowerCase("description")
      ) &&
      input.value === ""
    ) {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        const cleanedHtml = sanitizeHTML(data?.description ?? "");
        input.value = cleanedHtml;
        await delay(100);
        handleValueChanges(input);
        break;
      }
    }
  }

  const doneButton = getDoneButton();
  //   if (doneButton) {
  //     doneButton?.click();
  //     await delay(3000);
  //   }
};
