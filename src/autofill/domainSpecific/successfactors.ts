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
  fillPreferrelLocation,
  openAllTab,
  selectGender,
} from "./helper/helper.successfactors";

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

const fillCheckBox = () => {
  const allcheckobx: any = document.querySelectorAll('input[type="CHECKBOX"]');
  if (!allcheckobx && allcheckobx.length === 0) {
    return;
  }
  for (const checkobx of allcheckobx) {
    checkobx.checked;
    checkobx.click();
  }
};

const fillSapsfVeteran = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let veteran = false;
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (!veteran && fromatStirngInLowerCase(text) === "protectedveteran") {
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
          fromatStirngInLowerCase(answertext) ===
            "iidentifyasoneormoreoftheclassificationsofprotectedveteranlistedabove"
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          applicantData.veteran_status === 2 &&
          fromatStirngInLowerCase(answertext) === "iamnotaprotectedveteran"
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          applicantData.veteran_status === 5 &&
          fromatStirngInLowerCase(answertext) === "idontwishtoanswer"
        ) {
          option.click();
          handleValueChanges(option);
        }
      }
    }
  }
};

const fillSapsfDisability = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (
      fromatStirngInLowerCase(text)?.includes(
        "pleaseselectoneoftheoptionsbelow"
      )
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
        // for disability

        if (
          !applicantData.disability_status &&
          fromatStirngInLowerCase(answertext) ===
            "noidonthaveadisabilityorahistoryrecordofhavingadisability"
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          applicantData.disability_status &&
          fromatStirngInLowerCase(answertext) ===
            "yesihaveadisabilityorhaveahistoryrecordofhavingadisability"
        ) {
          option.click();
          handleValueChanges(option);
        }
      }
    }
  }
};

const findEducationButtonId = async () => {
  const allButton = document.querySelectorAll("button");
  let educationButtonId: any = "";
  if (isEmptyArray(allButton)) return;
  for (const button of allButton) {
    const text = button?.textContent;
    if (text && fromatStirngInLowerCase(text).includes("education")) {
      const id = button.getAttribute("id");
      if (id) {
        const arr = id.split(":");
        if (isEmptyArray(arr)) return;
        educationButtonId = arr[0];
        break;
      }
    }
  }
  return educationButtonId;
};

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

const educationDatafiller = async (
  tempDiv: HTMLElement,
  applicantData: Applicant,
  data: any,
  index: number
) => {
  const textInputFields =
    tempDiv.querySelectorAll<HTMLInputElement>('input[type="text"]');
  console.log("textInputFields::", textInputFields);

  // console.log("inputid", localStorage.getItem("ci_inputid"));
  for (const [inputIndex, input] of textInputFields.entries()) {
    // console.log("input::", input);
    // Log all attributes
    const inputId = input?.getAttribute("id") ?? "";
    const labelElement: any = tempDiv.querySelector(`[for="${inputId}"]`) ?? "";
    const labelText = labelElement?.textContent?.trim() ?? "";

    if (labelText === "Educational Institution" && input.value === "") {
      console.log("labelText::", labelText);
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        console.log("schoolna name 1");
        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.click();
        input.select();
        input.value = data.school;
        await delay(100);
        handleValueChanges(input);
        console.log("schoolna name fired");
        // await delay(100);
        // break;
      }
    }

    if (labelText === "Field of Study" && input.value === "") {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        console.log("schoolna level fired 1");

        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.click();
        console.log("schoolna level fired");
        await delay(1000);
        await fieldOfStudy(data, index, id, input);
      }
    }

    if (labelText === "Educational Level" && input.value === "") {
      const id = input.getAttribute("id");
      const allInputId = getAllinputId();
      if (!allInputId?.includes(id)) {
        console.log("schoolna level fired 1");

        setIdToLocalstorage(id);
        input.focus(); // Autofocus on the input field
        input.click();
        console.log("schoolna level fired");
        await delay(1000);
        await degreeFiller(data, index, id, input);
      }
    }
  }

  // workDaysdateFiller(data, index);
};

const fillEducation = async (applicantData: Applicant) => {
  const educationButtonId = await findEducationButtonId();
  const addEducationButtonId = `${educationButtonId}:_addRowBtn`;
  console.log("addEducationButtonId::", addEducationButtonId);

  const educationContentSectionId = `${educationButtonId}:sectionContent`;

  const educationContentSection: any = document.querySelector(
    `[id="${educationContentSectionId}"]`
  );
  console.log("educationContentSection::", educationContentSection);
  const addEducationButton: any = document.querySelector(
    `[id="${addEducationButtonId}"]`
  );

  console.log("addEducationButton::", addEducationButton);

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

export const successfactors = async (
  tempDivs: any,
  applicantData: Applicant
) => {
  await openAllTab();
  // await uploadResume(applicantData);
  // await fillBasicInfo(applicantData);

  // // for apply through registration page
  // await fillPreferrelLocation(applicantData);
  // // for apply through registration page
  // await fillAllRadioButtton(applicantData);

  // //  for .sapsf website
  // if (window.location.href.includes(".sapsf.")) {
  //   await fillSapsfVeteran(applicantData);
  //   await fillSapsfDisability(applicantData);
  // }

  // await fillAge(applicantData);
  // await fillWorkAuthorization(applicantData);
  // await fillVisa(applicantData);
  // await willingToRelocate(applicantData);
  // await fillRace(applicantData);
  // // for apply through registration page
  // //  radio gender
  // await selectGender(applicantData);
  // // select gender
  // await fillGender(applicantData);

  // await fillDisablity(applicantData);

  // if (window.location.href.includes(".successfactors.")) {
  //   await fillVeteran(applicantData);
  // }

  // fillCheckBox();

  // await fillEducation(applicantData);
};
