import { isEmptyArray } from "../../utils/helper";
import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillAdress = (applicantData: Applicant) => {
  const input: HTMLInputElement = document.querySelector("#AddressLine1");
  if (!input) {
    return;
  }
  input.value = applicantData.address;
  handleValueChanges(input);
};

const ethnicStatus = (applicantData: Applicant) => {
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
};

const veteranStatus = (applicantData: Applicant) => {
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

const fillHigherEducation = (applicantData: Applicant) => {
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
};

const fillRadioButton = (applicantData: Applicant) => {
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
};
export const ultipro = async (tempDiv: any, applicantData: Applicant) => {
  fillAdress(applicantData);
  ethnicStatus(applicantData);
  fillCheckBox(applicantData);
  fillDisabilityStatus(applicantData);
  veteranStatus(applicantData);
  fillHigherEducation(applicantData);
  fillRadioButton(applicantData);
};
