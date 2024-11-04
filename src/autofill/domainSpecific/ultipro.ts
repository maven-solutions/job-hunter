import { isEmptyArray } from "../../utils/helper";
import { Applicant } from "../data";
import { createFile } from "../FromFiller/fileTypeDataFiller";
import { countryHandler } from "../FromFiller/selectDataExtract";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";
import {
  UltiEducationDatafiller,
  UltiworkExperienceDatafiller,
} from "./helper/helper.ultipro";

const fillAdress = async (applicantData: Applicant) => {
  const input: HTMLInputElement = document.querySelector("#AddressLine1");
  if (!input) {
    return;
  }
  input.value = applicantData.address;
  handleValueChanges(input);
  await delay(200);
};

const fillCity = async (applicantData: Applicant) => {
  const input: HTMLInputElement = document.querySelector("#City");
  if (!input) {
    return;
  }
  input.value = applicantData.address;
  handleValueChanges(input);
  await delay(200);
};

const ethnicStatus = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector("#HispanicOrigin");
  if (!select) {
    return;
  }
  // for veteran
  Array.from(select.options).find((option: any) => {
    //for yes
    if (
      applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(option?.text) ===
        fromatStirngInLowerCase("Hispanic/Latino")
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }

    if (
      !applicantData.hispanic_or_latino &&
      fromatStirngInLowerCase(option?.text) ===
        fromatStirngInLowerCase("Not Hispanic/Latino")
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }
  });

  await delay(200);
};

const fillGender = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector("#Gender");
  if (!select) {
    return;
  }
  // for veteran
  Array.from(select.options).find((option: any) => {
    //for yes
    if (
      fromatStirngInLowerCase(option?.text)?.includes(
        fromatStirngInLowerCase(applicantData.gender)
      ) ||
      fromatStirngInLowerCase(applicantData.gender)?.includes(
        fromatStirngInLowerCase(option?.text)
      )
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }
  });

  await delay(200);
};

const fillRace = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector("#EthnicOrigin");
  if (!select) {
    return;
  }
  // for veteran
  Array.from(select.options).find((option: any) => {
    //for yes
    if (
      fromatStirngInLowerCase(option?.text)?.includes(
        fromatStirngInLowerCase(applicantData.race)
      ) ||
      fromatStirngInLowerCase(applicantData.race)?.includes(
        fromatStirngInLowerCase(option?.text)
      )
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }
  });

  await delay(200);
};

const veteranStatus = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector(
    "#USFederalContractor"
  );
  if (!select) {
    return;
  }
  // for veteran
  Array.from(select.options).find((option: any) => {
    //for yes
    if (
      (applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 3 ||
        applicantData.veteran_status === 4) &&
      fromatStirngInLowerCase(option?.text)?.includes("yes")
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }

    if (
      (applicantData.veteran_status === 2 ||
        applicantData.veteran_status === 5) &&
      fromatStirngInLowerCase(option?.text)?.includes("no")
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }
  });

  await delay(200);
};

const fillCheckBox = async (applicantData: Applicant) => {
  const allLabel: NodeListOf<HTMLLabelElement> = document.querySelectorAll(
    'label[data-automation="question-title"]'
  );
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    if (!label) {
      return;
    }
    // for work authorization
    if (
      (label?.textContent?.trim()?.includes("legally") ||
        label?.textContent?.trim()?.includes("authorized to work")) &&
      applicantData.us_work_authoriztaion
    ) {
      const parentElement = label.parentElement;
      if (!parentElement) {
        return;
      }

      const labelElement: NodeListOf<HTMLLabelElement> =
        parentElement.querySelectorAll('label[class="radio"]');
      if (!labelElement) {
        return;
      }

      for (const radioLabel of labelElement) {
        if (!radioLabel) {
          return;
        }

        if (
          fromatStirngInLowerCase(radioLabel?.textContent.trim())?.includes(
            "yes"
          )
        ) {
          radioLabel.click();
          handleValueChanges(radioLabel);
        }
      }
    }

    //for visa
    if (
      label?.textContent?.trim()?.includes("sponsorship") ||
      label?.textContent?.trim()?.includes("visa")
    ) {
      const parentElement = label.parentElement;
      if (!parentElement) {
        return;
      }

      const labelElement: NodeListOf<HTMLLabelElement> =
        parentElement.querySelectorAll('label[class="radio"]');
      if (!labelElement) {
        return;
      }

      for (const radioLabel of labelElement) {
        if (!radioLabel) {
          return;
        }

        if (
          fromatStirngInLowerCase(radioLabel?.textContent.trim())?.includes(
            "no"
          ) &&
          !applicantData.sponsorship_required
        ) {
          radioLabel.click();
          handleValueChanges(radioLabel);
        }
        if (
          fromatStirngInLowerCase(radioLabel?.textContent.trim())?.includes(
            "yes"
          ) &&
          applicantData.sponsorship_required
        ) {
          radioLabel.click();
          handleValueChanges(radioLabel);
        }
      }
    }
  }
  await delay(200);
};

const fillDisabilityStatus = async (applicantData: Applicant) => {
  const disabilityLabel: HTMLLabelElement = document.querySelector(
    'label[data-automation="disability-status-question-label"]'
  );
  if (!disabilityLabel) {
    return;
  }
  const parentElement = disabilityLabel?.nextElementSibling;
  if (!parentElement) {
    return;
  }
  const allRadioLabel = parentElement?.querySelectorAll("label");
  if (!allRadioLabel || allRadioLabel?.length === 0) {
    return;
  }
  for (const radioLabel of allRadioLabel) {
    if (
      radioLabel?.textContent?.trim()?.toLowerCase()?.includes("yes") &&
      applicantData.disability_status
    ) {
      radioLabel.click();
      handleValueChanges(radioLabel);
      return;
    }
    if (
      radioLabel?.textContent?.trim()?.toLowerCase()?.includes("no") &&
      !applicantData.disability_status
    ) {
      radioLabel.click();
      handleValueChanges(radioLabel);
      return;
    }
  }
  await delay(200);
};

const fillHigherEducation = async (applicantData: Applicant) => {
  const allhigherEducationLabel: NodeListOf<HTMLSpanElement> =
    document.querySelectorAll(".radio-text");
  if (!allhigherEducationLabel || allhigherEducationLabel.length === 0) {
    return;
  }
  for (const span of allhigherEducationLabel) {
    const text = span?.textContent;
    if (
      text &&
      fromatStirngInLowerCase(text)?.includes(
        fromatStirngInLowerCase(applicantData?.higher_education)
      )
    ) {
      const label = span?.parentElement as HTMLLabelElement;
      label.click();
      handleValueChanges(label);
    }
  }
  await delay(200);
};

const fillRadioButton = async (applicantData: Applicant) => {
  const allLabels: NodeListOf<HTMLLabelElement> =
    document.querySelectorAll("label");

  if (isEmptyArray(allLabels)) {
    return;
  }
  for (const label of allLabels) {
    const text = label?.textContent;

    // for work authorization
    if (
      text &&
      (fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase("eligible to work")
      ) ||
        fromatStirngInLowerCase(text).includes(
          fromatStirngInLowerCase("authorized to work")
        ) ||
        fromatStirngInLowerCase(text).includes(
          fromatStirngInLowerCase("authorize to work")
        ))
    ) {
      const parentElement: HTMLElement = label?.parentElement;
      if (parentElement) {
        const allRadioLabel: NodeListOf<HTMLLabelElement> =
          parentElement.querySelectorAll("label.radio");
        if (isEmptyArray(allRadioLabel)) {
          return;
        }
        const yesButton: HTMLLabelElement = allRadioLabel[0];
        const noButton: HTMLLabelElement = allRadioLabel[1];
        if (applicantData.us_work_authoriztaion) {
          yesButton?.click();
        } else {
          noButton?.click();
        }
      }
    }

    // for visa
    if (
      text &&
      (fromatStirngInLowerCase(text).includes(
        fromatStirngInLowerCase("visa")
      ) ||
        fromatStirngInLowerCase(text).includes(
          fromatStirngInLowerCase("sponsorship")
        ))
    ) {
      const parentElement: HTMLElement = label?.parentElement;
      if (parentElement) {
        const allRadioLabel: NodeListOf<HTMLLabelElement> =
          parentElement.querySelectorAll("label.radio");
        if (isEmptyArray(allRadioLabel)) {
          return;
        }
        const yesButton: HTMLLabelElement = allRadioLabel[0];
        const noButton: HTMLLabelElement = allRadioLabel[1];
        if (applicantData.sponsorship_required) {
          yesButton?.click();
        } else {
          noButton?.click();
        }
      }
    }

    // for 18 years
    if (text && text.toLowerCase().includes("18 year")) {
      const parentElement: HTMLElement = label?.parentElement;
      if (parentElement) {
        const allRadioLabel: NodeListOf<HTMLLabelElement> =
          parentElement.querySelectorAll("label.radio");
        if (isEmptyArray(allRadioLabel)) {
          return;
        }
        const yesButton: HTMLLabelElement = allRadioLabel[0];
        const noButton: HTMLLabelElement = allRadioLabel[1];
        if (applicantData.is_over_18) {
          yesButton?.click();
        } else {
          noButton?.click();
        }
      }
    }
  }
  await delay(200);
};

const fileFiller = async (applicantData: Applicant) => {
  let textInputField: any = document.querySelector('input[type="file"]');

  try {
    if (applicantData.pdf_url) {
      textInputField.setAttribute("ci-aria-file-uploaded", "true");
      // Create file asynchronously
      const designFile = await createFile(
        applicantData.pdf_url,
        applicantData.resume_title
      );
      // Set file to input field only for the first file input field found
      const dt = new DataTransfer();
      dt.items.add(designFile);
      textInputField.files = dt.files;
      // Trigger input change event
      textInputField.dispatchEvent(
        new Event("change", { bubbles: true, cancelable: false })
      );
      await delay(6000);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const fillCountry = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector("#Country");
  if (!select) {
    return;
  }
  let country = false;
  Array.from(select.options).find((option: any) => {
    if (countryHandler(option, applicantData, country)) {
      option.selected = true;
      handleValueChanges(select);
      // handleValueChanges(option);
      country = true;
      return true;
    }
  });

  await delay(500);
};

const fillState = async (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector("#State");
  if (!select) {
    return;
  }
  // filling state data
  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase(applicantData.state)
    ) {
      option.selected = true;
      handleValueChanges(select);

      return true;
    }
  });

  await delay(200);
};

const fillZipcode = async (applicantData: Applicant) => {
  const input: HTMLInputElement = document.querySelector("#PostalCode");
  if (!input) {
    return;
  }
  input.value = String(applicantData.zip_code);
  handleValueChanges(input);
  await delay(200);
};

export const ultipro = async (tempDiv: any, applicantData: Applicant) => {
  await fileFiller(applicantData);
  await fillCountry(applicantData);
  await fillAdress(applicantData);
  await fillCity(applicantData);
  await fillState(applicantData);
  await fillZipcode(applicantData);

  // us work auth and visa check
  await fillCheckBox(applicantData);

  await ethnicStatus(applicantData);
  //
  await fillGender(applicantData);
  await fillRace(applicantData);

  await veteranStatus(applicantData);

  await fillDisabilityStatus(applicantData);
  await fillHigherEducation(applicantData);
  await fillRadioButton(applicantData);

  await UltiworkExperienceDatafiller(applicantData);
  await UltiEducationDatafiller(applicantData);
};
