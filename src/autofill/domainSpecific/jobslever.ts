import { Applicant } from "../data";
import {
  checkIfExist,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";

const fillName = (applicantData: Applicant) => {
  const nameEle: any = document.querySelector(
    '[name="eeo[disabilitySignature]"]'
  );
  if (!nameEle) {
    return;
  }
  nameEle.focus(); // Autofocus on the nameEle field
  nameEle.click();
  nameEle.select();
  nameEle.value = applicantData.full_name;
  handleValueChanges(nameEle);
};

const fillDate = (applicantData: Applicant) => {
  const nameEle: any = document.querySelector(
    '[name="eeo[disabilitySignatureDate]"]'
  );
  if (!nameEle) {
    return;
  }
  nameEle.focus(); // Autofocus on the nameEle field
  nameEle.click();
  nameEle.select();
  const currentDate = new Date();

  // Format the date as MM/DD/YYYY
  const formattedDate =
    ("0" + (currentDate.getMonth() + 1)).slice(-2) +
    "/" +
    ("0" + currentDate.getDate()).slice(-2) +
    "/" +
    currentDate.getFullYear();
  nameEle.value = formattedDate;
  handleValueChanges(nameEle);
};

const fillRace = (applicantData: Applicant) => {
  const textInputFields = document.querySelectorAll('input[type="radio"]');

  textInputFields.forEach((input) => {
    const labelElement = input.nextElementSibling;
    const labelText = labelElement?.textContent?.trim() ?? "";

    if (
      fromatStirngInLowerCase(labelText)?.includes(
        fromatStirngInLowerCase(applicantData.race)
      )
    ) {
      input.parentElement.click();
      handleValueChanges(input);
      return;
    }
    // for veteran

    if (
      (applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 3 ||
        applicantData.veteran_status === 4) &&
      fromatStirngInLowerCase(labelText)?.includes(
        fromatStirngInLowerCase("I identify as one or more")
      )
    ) {
      input.parentElement.click();
      handleValueChanges(input);
      return;
    }

    if (
      applicantData.veteran_status === 2 &&
      fromatStirngInLowerCase(labelText)?.includes(
        fromatStirngInLowerCase("I am not a protected")
      )
    ) {
      input.parentElement.click();
      handleValueChanges(input);
      return;
    }
  });
};
const fillRace2 = (applicantData: Applicant) => {
  const textInputFields = document.querySelectorAll('input[type="checkbox"]');

  textInputFields.forEach((input) => {
    const labelElement = input.nextElementSibling;
    const labelText = labelElement?.textContent?.trim() ?? "";

    if (
      fromatStirngInLowerCase(labelText)?.includes(
        fromatStirngInLowerCase(applicantData.race)
      )
    ) {
      input.parentElement.click();
      handleValueChanges(input);
      return;
    }
  });
};

const fillUSA = (applicantData: Applicant) => {
  const radioParnetAll = document.querySelectorAll(
    ".application-question.custom-question"
  );
  if (!radioParnetAll || radioParnetAll.length === 0) {
    return;
  }
  for (const radio of radioParnetAll) {
    const qn = radio.querySelector(".text");

    if (
      fromatStirngInLowerCase(qn?.textContent)?.includes("legallyauthorized") ||
      fromatStirngInLowerCase(qn?.textContent)?.includes("authorized") ||
      fromatStirngInLowerCase(qn?.textContent)?.includes("authorizedtowork") ||
      fromatStirngInLowerCase(qn?.textContent)?.includes("eligibletowork") ||
      fromatStirngInLowerCase(qn?.textContent)?.includes("towork")
    ) {
      const ul: any = radio?.querySelector("ul") ?? "";
      if (!ul) {
        return;
      }
      const yes: any = ul.children[0]?.querySelector("label") ?? "";
      const no: any = ul.children[1]?.querySelector("label") ?? "";

      if (applicantData.us_work_authoriztaion) {
        yes?.click();
        handleValueChanges(yes);
      } else {
        no?.click();
        handleValueChanges(no);
      }
    }

    // sponshership

    if (
      fromatStirngInLowerCase(qn?.textContent)?.includes("sponsorship") ||
      fromatStirngInLowerCase(qn?.textContent)?.includes("visa")
    ) {
      const ul: any = radio?.querySelector("ul") ?? "";
      const yes: any = ul.children[0]?.querySelector("label") ?? "";
      const no: any = ul.children[1]?.querySelector("label") ?? "";

      if (applicantData.sponsorship_required) {
        yes?.click();
        handleValueChanges(yes);
      } else {
        no?.click();
        handleValueChanges(no);
      }
    }
  }
};

const fillSelectData = async (applicantData: Applicant) => {
  const allLabelForSelect: NodeListOf<HTMLLabelElement> =
    document.querySelectorAll("label");
  if (!allLabelForSelect || allLabelForSelect.length === 0) {
    return;
  }
  for (const label of allLabelForSelect) {
    const question = label?.querySelector(".text") as HTMLSpanElement | null;
    const select = label?.querySelector("select") as HTMLSelectElement | null;
    if (question && select) {
      // for visa
      if (
        fromatStirngInLowerCase(question?.textContent)?.includes(
          "sponsorship"
        ) ||
        fromatStirngInLowerCase(question?.textContent)?.includes("visa")
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text) === "yes"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }

          if (
            !applicantData.sponsorship_required &&
            fromatStirngInLowerCase(option?.text) === "no"
          ) {
            handleValueChanges(select);
            return true;
          }
        });
      }

      // for work authorization
      if (
        fromatStirngInLowerCase(question?.textContent)?.includes(
          "legallyeligible"
        ) ||
        fromatStirngInLowerCase(question?.textContent)?.includes("toworkin")
      ) {
        Array.from(select.options).find((option: any) => {
          if (
            applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(option?.text) === "yes"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }

          if (
            !applicantData.us_work_authoriztaion &&
            fromatStirngInLowerCase(option?.text) === "no"
          ) {
            option.selected = true;
            handleValueChanges(select);
            return true;
          }
        });
      }
    }
  }
};
export const jobsLever = (tempDiv: any, applicantData: Applicant) => {
  fillName(applicantData);
  fillDate(applicantData);
  fillRace(applicantData);
  fillRace2(applicantData);
  fillUSA(applicantData);
  fillSelectData(applicantData);
};
