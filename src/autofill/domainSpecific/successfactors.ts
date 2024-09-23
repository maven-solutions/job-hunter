import { isEmptyArray } from "../../utils/helper";
import { fieldNames } from "../FromFiller/fieldsname";
import {
  createFile,
  fileTypeDataFiller,
} from "../FromFiller/fileTypeDataFiller";
import { Applicant } from "../data";
import {
  checkIfExist,
  delay,
  fromatStirngInLowerCase,
  handleValueChanges,
} from "../helper";
import {
  fillAllRadioButtton,
  fillBasicInfo,
  fillCheckBox,
  fillPreferrelLocation,
  fillSapsfDisability,
  fillSapsfVeteran,
  openAllTab,
  selectGender,
} from "./helper/helper.successfactors";
import { educationDatafiller } from "./helper/succesfactors.educationfiller";
import { workExperienceDatafiller } from "./helper/succesfactors.workexperienceFiller";

const uploadResume = async (applicantData) => {
  const acceptButton: any = document.querySelector(
    ".attachmentLabel.attachmentText"
  );
  if (acceptButton) {
    acceptButton.click();
  }

  await delay(1000);
  const resumeInput: any = document.querySelector('input[type="file"]');

  if (resumeInput && applicantData.pdf_url) {
    // Create file asynchronously
    const designFile = await createFile(
      applicantData.pdf_url,
      applicantData.resume_title
    );
    // Set file to input field only for the first file input field found
    const dt = new DataTransfer();
    dt.items.add(designFile);
    resumeInput.files = dt.files;
    // Trigger input change event
    resumeInput.dispatchEvent(
      new Event("change", { bubbles: true, cancelable: false })
    );
    await delay(5000);
  }
};

const fillAge = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");

  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    // for age
    if (text?.includes("18 years")) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      if (!select) {
        return;
      }

      select.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (isEmptyArray(allOption)) return;

      for (const option of allOption) {
        const answertext = option?.textContent;
        if (!answertext) return;

        if (
          applicantData.is_over_18 &&
          fromatStirngInLowerCase(answertext) === "yes"
        ) {
          option.click();
          // handleValueChanges(option);
          break;
        }

        if (
          !applicantData.is_over_18 &&
          fromatStirngInLowerCase(answertext) === "no"
        ) {
          option.click();
          // handleValueChanges(option);
          break;
        }
      }
      await delay(1500);
      break;
    }
  }
};

const fillVisa = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (text?.includes("sponsorship") || text?.includes("visa")) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      if (!select) {
        return;
      }

      select?.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (isEmptyArray(allOption)) return;
      for (const option of allOption) {
        const answertext = option?.textContent;
        if (!answertext) return;
        if (
          applicantData.sponsorship_required &&
          fromatStirngInLowerCase(answertext)?.includes("yes")
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          !applicantData.sponsorship_required &&
          !fromatStirngInLowerCase(answertext)?.includes(
            fromatStirngInLowerCase("No Selection")
          ) &&
          fromatStirngInLowerCase(answertext)?.includes("no")
        ) {
          option.click();

          handleValueChanges(option);
        }
      }
      await delay(1500);
    }
  }
};

const willingToRelocate = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (text?.includes("relocate") || text?.includes("travell")) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      if (!select) {
        return;
      }

      select?.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (isEmptyArray(allOption)) return;
      for (const option of allOption) {
        const answertext = option?.textContent;
        if (!answertext) return;
        if (
          Number(applicantData.willingToTravel) > 0 &&
          fromatStirngInLowerCase(answertext) === "yes"
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          (!applicantData.willingToTravel ||
            Number(applicantData.willingToTravel) < 1) &&
          fromatStirngInLowerCase(answertext) === "no"
        ) {
          option.click();
          handleValueChanges(option);
        }
      }
      await delay(1500);
    }
  }
};

const fillWorkAuthorization = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (text?.includes("legally authorized") || text?.includes("legally")) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      if (!select) {
        return;
      }

      select.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (!allOption || allOption.length === 0) {
        return;
      }
      for (const option of allOption) {
        const answertext = option?.textContent;
        if (!answertext) {
          return;
        }
        if (
          applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(answertext) === "yes"
        ) {
          option.click();
          // handleValueChanges(option);
          break;
        }

        if (
          !applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(answertext) === "no"
        ) {
          option.click();
          // handleValueChanges(option);
          break;
        }
      }
      await delay(1500);
      break;
    }
  }
};

const fillGender = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (text?.toLowerCase()?.includes("gender")) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      if (!select) {
        return;
      }

      select.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (isEmptyArray(allOption)) return;
      for (const option of allOption) {
        const answertext = option.textContent;
        if (!answertext) {
          return;
        }
        if (
          fromatStirngInLowerCase(answertext) ===
          fromatStirngInLowerCase(applicantData.gender)
        ) {
          option.click();
          // handleValueChanges(option);
          break;
        }
      }
      await delay(1500);
      break;
    }
  }
};

const fillRace = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (
      text.toLowerCase()?.includes("race") ||
      text.toLowerCase()?.includes("ethnicity")
    ) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      if (!select) {
        return;
      }

      select.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (isEmptyArray(allOption)) return;
      for (const option of allOption) {
        const answertext = option.textContent;
        if (!answertext) return;
        if (
          fromatStirngInLowerCase(answertext)?.includes(
            fromatStirngInLowerCase(applicantData.race)
          )
        ) {
          option.click();
          break;
          // handleValueChanges(option);
        }
      }
      await delay(1500);
      break;
    }
  }
};

const fillVeteran = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (
      fromatStirngInLowerCase(text)?.includes("veteran") ||
      fromatStirngInLowerCase(text) === "pleaseselect"
    ) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      if (!select) {
        return;
      }
      select.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (!allOption || allOption.length === 0) {
        return;
      }
      for (const option of allOption) {
        const answertext = option?.textContent;

        // for veteran

        if (
          (applicantData.veteran_status === 1 ||
            applicantData.veteran_status === 3 ||
            applicantData.veteran_status === 4) &&
          fromatStirngInLowerCase(answertext)?.includes(
            fromatStirngInLowerCase("I identify as one or more")
          )
        ) {
          option.click();
          break;
        }

        if (
          applicantData.veteran_status === 2 &&
          fromatStirngInLowerCase(answertext)?.includes(
            fromatStirngInLowerCase("I am not a")
          )
        ) {
          option.click();
          break;
        }

        if (
          applicantData.veteran_status === 5 &&
          fromatStirngInLowerCase(answertext) === "ichoosenottoselfidentify"
        ) {
          option.click();
          break;
        }
      }
      await delay(1500);
      break;
    }
  }
};

const fillDisablity = async (applicantData: Applicant) => {
  console.log("disablity fired-----------------");
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();
    console.log("text-----------------", text);

    if (fromatStirngInLowerCase(text)?.includes("disability")) {
      const labelId = label.getAttribute("for");
      const select = document.getElementById(labelId);
      console.log("select fired-----------------", select);

      if (!select) {
        return;
      }
      select.click();
      handleValueChanges(select);
      await delay(1500);
      const allOption: any = document.querySelectorAll('li[role="option"]');
      if (!allOption || allOption.length === 0) {
        return;
      }
      for (const option of allOption) {
        const answertext = option?.textContent;
        console.log("answertext::", answertext);
        // for disability
        if (
          (!applicantData.disability_status ||
            !fromatStirngInLowerCase(answertext)?.includes(
              fromatStirngInLowerCase("No Selection")
            )) &&
          (fromatStirngInLowerCase(answertext)?.includes(
            fromatStirngInLowerCase("No, I don't have a disability")
          ) ||
            fromatStirngInLowerCase(answertext) === "nodisability")
        ) {
          console.log("no disabliry");
          option.click();
          break;
        }

        if (
          applicantData.disability_status &&
          (fromatStirngInLowerCase(answertext)?.includes(
            fromatStirngInLowerCase("Yes, I have a disability")
          ) ||
            fromatStirngInLowerCase(answertext) ===
              "yeswithadisabilityorpreviouslyhadadisability")
        ) {
          console.log("yes disabliry");
          option.click();
          break;
        }
      }
      await delay(1500);
      break;
    }
  }
};

const findEducationButtonId = async () => {
  const allButton = document.querySelectorAll("button");
  let educationButtonId: any = "";
  if (isEmptyArray(allButton)) return;
  for (const button of allButton) {
    const text = button?.textContent;
    if (text && fromatStirngInLowerCase(text)?.includes("education")) {
      const id = button?.getAttribute("id");
      if (id) {
        const arr = id?.split(":");
        if (isEmptyArray(arr)) return;
        educationButtonId = arr[0];
        break;
      }
    }
  }
  return educationButtonId;
};

const findWorkExperienceButtonId = async () => {
  const allButton = document.querySelectorAll("button");
  let educationButtonId: any = "";
  if (isEmptyArray(allButton)) return;
  for (const button of allButton) {
    const text = button?.textContent;
    if (text && fromatStirngInLowerCase(text)?.includes("previousemployment")) {
      const id = button?.getAttribute("id");
      if (id) {
        const arr = id?.split(":");
        if (isEmptyArray(arr)) return;
        educationButtonId = arr[0];
        break;
      }
    }
  }
  return educationButtonId;
};

const fillEducation = async (applicantData: Applicant) => {
  const educationButtonId = await findEducationButtonId();
  const addEducationButtonId = `${educationButtonId}:_addRowBtn`;

  const educationContentSectionId = `${educationButtonId}:sectionContent`;

  const educationContentSection: any = document.querySelector(
    `[id="${educationContentSectionId}"]`
  );
  if (!educationContentSection) return;

  const addEducationButton: any = document.querySelector(
    `[id="${addEducationButtonId}"]`
  );

  if (!addEducationButton) return;

  if (applicantData.education && applicantData.education.length > 0) {
    for await (const [index, element] of applicantData.education.entries()) {
      addEducationButton.click();
      await delay(500);
      await educationDatafiller(
        educationContentSection,
        applicantData,
        element,
        index
      );
    }
  }
};

const fillWorkExperience = async (applicantData: Applicant) => {
  const workButtonId = await findWorkExperienceButtonId();
  const addWorkButtonId = `${workButtonId}:_addRowBtn`;

  const workContentSectionId = `${workButtonId}:sectionContent`;

  const workContentSection: any = document.querySelector(
    `[id="${workContentSectionId}"]`
  );
  if (!workContentSection) return;
  const addworkButton: any = document.querySelector(
    `[id="${addWorkButtonId}"]`
  );

  if (!addworkButton) return;

  if (
    applicantData.employment_history &&
    applicantData.employment_history.length > 0
  ) {
    for await (const [
      index,
      element,
    ] of applicantData.employment_history.entries()) {
      addworkButton.click();
      await delay(500);
      await workExperienceDatafiller(
        workContentSection,
        applicantData,
        element,
        index
      );
    }
  }
};

export const successfactors = async (
  tempDivs: any,
  applicantData: Applicant
) => {
  await openAllTab();
  await uploadResume(applicantData);
  await fillBasicInfo(applicantData);

  // for apply through registration page
  await fillPreferrelLocation(applicantData);
  // for apply through registration page
  await fillAllRadioButtton(applicantData);

  //  for .sapsf website
  if (window.location.href.includes(".sapsf.")) {
    await fillSapsfVeteran(applicantData);
    await fillSapsfDisability(applicantData);
  }

  await fillAge(applicantData);
  await fillWorkAuthorization(applicantData);
  await fillVisa(applicantData);
  await willingToRelocate(applicantData);
  await fillRace(applicantData);
  // for apply through registration page
  //  radio gender
  await selectGender(applicantData);
  // select gender
  await fillGender(applicantData);

  await fillDisablity(applicantData);

  if (window.location.href.includes(".successfactors.")) {
    await fillVeteran(applicantData);
  }

  fillCheckBox();

  await fillWorkExperience(applicantData);
  await delay(1000);
  await fillEducation(applicantData);
};
