import {
  getAllinputId,
  isEmptyArray,
  sanitizeHTML,
  setIdToLocalstorage,
} from "../../../utils/helper";
import { Applicant } from "../../data";
import { countryHandler } from "../../FromFiller/selectDataExtract";
import {
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
  await delay(1500);
  // console.log("entered::;");
  const textInputFields =
    document.querySelectorAll<HTMLInputElement>('input[type="text"]');

  // console.log("textInputFields::", textInputFields);

  const endDate: any = document.querySelector('[label="End Date"]');
  if (endDate) {
    const label = endDate?.querySelector("label");
    if (data?.isWorking) label?.click();
  }

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
        // console.log("jobTitle::", data?.jobTitle ?? "");

        await delay(100);
        handleValueChanges(input);
      }
    }
  }
  await delay(1000);

  let country = false;
  // find country for job
  if (data.country && data?.country?.hasOwnProperty("label")) {
    const allSelectFieldsForCountry: any =
      document.querySelectorAll<HTMLInputElement>("select");
    if (!isEmptyArray(allSelectFieldsForCountry)) {
      for (const input of allSelectFieldsForCountry) {
        const inputId = input?.getAttribute("id") ?? "";
        const labelElement: Element = document.querySelector(
          `[for="${inputId}"]`
        );
        const labelText = labelElement?.textContent?.trim() ?? "";

        if (
          fromatStirngInLowerCase(labelText)?.includes(
            fromatStirngInLowerCase("country")
          )
        ) {
          const countrydata = { country: data.country.label };
          Array.from(input.options).find((option: any) => {
            if (countryHandler(option, countrydata, country)) {
              option.selected = true;
              input.dispatchEvent(
                new Event("change", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("input", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("focus", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("click", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("blur", { bubbles: true, cancelable: false })
              );
              input.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
              country = true;
              // return true;
            }
          });
        }
      }
      await delay(1000);
    }
  }
  // find state for job

  if (data.state && data?.state?.hasOwnProperty("label")) {
    await delay(500);
    const allSelectFieldsForCountry: any =
      document.querySelectorAll<HTMLInputElement>("select");
    if (!isEmptyArray(allSelectFieldsForCountry)) {
      for (const input of allSelectFieldsForCountry) {
        const inputId = input?.getAttribute("id") ?? "";
        const labelElement: Element = document.querySelector(
          `[for="${inputId}"]`
        );
        const labelText = labelElement?.textContent?.trim() ?? "";
        if (
          fromatStirngInLowerCase(labelText)?.includes(
            fromatStirngInLowerCase("state")
          ) ||
          fromatStirngInLowerCase(labelText)?.includes(
            fromatStirngInLowerCase("region")
          )
        ) {
          Array.from(input.options).find((option: any) => {
            if (
              fromatStirngInLowerCase(option?.text) ===
              fromatStirngInLowerCase(data?.state?.label)
            ) {
              option.selected = true;
              input.dispatchEvent(
                new Event("change", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("input", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("focus", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("click", { bubbles: true, cancelable: false })
              );
              input.dispatchEvent(
                new Event("blur", { bubbles: true, cancelable: false })
              );
              input.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
              // return true;
            }
          });
        }
      }
      await delay(100);
    }
    await delay(1000);
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
        await delay(1000);
        handleValueChanges(input);
        break;
      }
      await delay(1000);
    }
  }

  const doneButton = getDoneButton();
  if (doneButton) {
    doneButton?.click();
    await delay(2000);
  }
};
