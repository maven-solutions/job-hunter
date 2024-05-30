import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillAdress = (applicantData: Applicant) => {
  const input: HTMLInputElement = document.querySelector("#AddressLine1");
  if (!input) {
    return;
  }
  input.value = applicantData.address;
  handleValueChanges(input);
};

const veteranStatus = (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector(
    "#USFederalContractor"
  );
  // for veteran
  Array.from(select.options).find((option: any) => {
    //for yes
    if (
      (applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 3 ||
        applicantData.veteran_status === 4) &&
      fromatStirngInLowerCase(option?.text).includes("yes")
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }

    if (
      (applicantData.veteran_status === 2 ||
        applicantData.veteran_status === 5) &&
      fromatStirngInLowerCase(option?.text).includes("no")
    ) {
      option.selected = true;
      handleValueChanges(select);
      return;
    }
  });
};

const fillCheckBox = (applicantData: Applicant) => {
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
      label?.textContent?.trim()?.includes("legally") ||
      label?.textContent?.trim()?.includes("authorized to work")
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
          fromatStirngInLowerCase(radioLabel?.textContent.trim()).includes(
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
          fromatStirngInLowerCase(radioLabel?.textContent.trim()).includes("no")
        ) {
          radioLabel.click();
          handleValueChanges(radioLabel);
        }
      }
    }
  }
};

const fillDisabilityStatus = (applicantData: Applicant) => {
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
};
export const ultipro = async (tempDiv: any, applicantData: Applicant) => {
  fillAdress(applicantData);
  fillCheckBox(applicantData);
  fillDisabilityStatus(applicantData);
  veteranStatus(applicantData);
};
