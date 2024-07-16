import { Applicant } from "../data";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const filltexttype = (applicantData: Applicant) => {
  const firstName: HTMLInputElement =
    document.querySelector('[name="firstName"]');
  if (firstName) {
    firstName.value = applicantData.first_name;
    handleValueChanges(firstName);
  }
  const lastname: HTMLInputElement =
    document.querySelector('[name="lastName"]');
  if (lastname) {
    lastname.value = applicantData.last_name;
    handleValueChanges(lastname);
  }

  const fullName: HTMLInputElement =
    document.querySelector('[name="fullName"]');
  if (fullName) {
    fullName.value = applicantData.full_name;
    handleValueChanges(fullName);
  }

  const preferedname: HTMLInputElement =
    document.querySelector('[name="knownAs"]');
  if (preferedname) {
    preferedname.value = applicantData.full_name;
    handleValueChanges(preferedname);
  }

  const adress: HTMLInputElement = document.querySelector(
    '[name="addressLine1"]'
  );
  if (adress) {
    adress.value = applicantData.address;
    handleValueChanges(adress);
  }

  const postalCode: any = document.querySelector('[name="postalCode"]');
  if (postalCode) {
    postalCode.value = applicantData.zip_code;
    handleValueChanges(postalCode);
  }
};

const fillRadioButton = (applicantData: Applicant) => {
  const allRadioLabelDiv: NodeListOf<HTMLLabelElement> =
    document.querySelectorAll('div[role="radiogroup"]');

  if (!allRadioLabelDiv || allRadioLabelDiv.length === 0) {
    return;
  }
  for (const radioLabelSection of allRadioLabelDiv) {
    if (!radioLabelSection) {
      return;
    }
    const labelQuestion = radioLabelSection.querySelector(".input-row__label");
    if (!labelQuestion) {
      return;
    }

    // for visa or sponsership
    if (
      labelQuestion.textContent
        .trim()
        .toLocaleLowerCase()
        .includes("sponsorship") ||
      labelQuestion.textContent.trim().toLocaleLowerCase().includes("visa")
    ) {
      const radioLabelAnswerParent: NodeListOf<HTMLLabelElement> =
        radioLabelSection.querySelectorAll(".apply-flow-input-radio");

      if (!radioLabelAnswerParent || radioLabelAnswerParent.length === 0) {
        return;
      }

      for (const radioAnswer of radioLabelAnswerParent) {
        if (
          radioAnswer.textContent.trim().toLocaleLowerCase().includes("yes") &&
          applicantData.sponsorship_required
        ) {
          radioAnswer.click();
        }

        if (
          radioAnswer.textContent.trim().toLocaleLowerCase().includes("no") &&
          !applicantData.sponsorship_required
        ) {
          radioAnswer.click();
        }
      }
    }

    //  for 18 years
    if (
      labelQuestion.textContent.trim().toLocaleLowerCase().includes("18 year")
    ) {
      const radioLabelAnswerParent: NodeListOf<HTMLLabelElement> =
        radioLabelSection.querySelectorAll(".apply-flow-input-radio");

      if (!radioLabelAnswerParent || radioLabelAnswerParent.length === 0) {
        return;
      }

      for (const radioAnswer of radioLabelAnswerParent) {
        if (
          radioAnswer.textContent.trim().toLocaleLowerCase().includes("yes") &&
          applicantData.is_over_18
        ) {
          radioAnswer.click();
        }

        if (
          radioAnswer.textContent.trim().toLocaleLowerCase().includes("no") &&
          !applicantData.is_over_18
        ) {
          radioAnswer.click();
        }
      }
    }

    // for legally authorized
    if (
      labelQuestion.textContent
        .trim()
        .toLocaleLowerCase()
        .includes("legally") ||
      labelQuestion.textContent
        .trim()
        .toLocaleLowerCase()
        .includes("authorized to work")
    ) {
      const radioLabelAnswerParent: NodeListOf<HTMLLabelElement> =
        radioLabelSection.querySelectorAll(".apply-flow-input-radio");

      if (!radioLabelAnswerParent || radioLabelAnswerParent.length === 0) {
        return;
      }

      for (const radioAnswer of radioLabelAnswerParent) {
        if (
          radioAnswer.textContent.trim().toLocaleLowerCase().includes("yes") &&
          applicantData.us_work_authoriztaion
        ) {
          radioAnswer.click();
        }

        if (
          radioAnswer.textContent.trim().toLocaleLowerCase().includes("no") &&
          !applicantData.us_work_authoriztaion
        ) {
          radioAnswer.click();
        }
      }
    }
  }
};

const raceFiller = (applicantData: Applicant) => {
  const allCheckBoxParentDiv: NodeListOf<HTMLLabelElement> =
    document.querySelectorAll('div[role="group"]');

  if (!allCheckBoxParentDiv || allCheckBoxParentDiv.length === 0) {
    return;
  }

  for (const checkboxLabelSection of allCheckBoxParentDiv) {
    if (!checkboxLabelSection) {
      return;
    }
    const labelQuestion =
      checkboxLabelSection.querySelector(".input-row__label");
    if (!labelQuestion) {
      return;
    }

    // for racea
    if (
      labelQuestion.textContent.trim().toLocaleLowerCase().includes("races")
    ) {
      const radioLabelAnswerParent: NodeListOf<HTMLLabelElement> =
        checkboxLabelSection.querySelectorAll(".apply-flow-input-checkbox");

      if (!radioLabelAnswerParent || radioLabelAnswerParent.length === 0) {
        return;
      }

      for (const radioAnswer of radioLabelAnswerParent) {
        if (
          fromatStirngInLowerCase(radioAnswer.textContent.trim()).includes(
            fromatStirngInLowerCase(applicantData.race)
          )
        ) {
          radioAnswer.click();
        }
      }
    }
  }
};

export const oraclecloud = async (tempDiv: any, applicantData: Applicant) => {
  filltexttype(applicantData);
  fillRadioButton(applicantData);
  raceFiller(applicantData);
};
