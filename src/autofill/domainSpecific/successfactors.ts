import { fileTypeDataFiller } from "../FromFiller/fileTypeDataFiller";
import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const uploadResume = async (applicantData) => {
  const acceptButton: any = document.querySelector(
    ".attachmentLabel.attachmentText"
  );
  if (acceptButton) {
    acceptButton.click();
  }
  await delay(500);
  let tempDivForFile = document.querySelector("body");
  fileTypeDataFiller(tempDivForFile, applicantData, false);
  await delay(5000);
};

const fillBasicInfo = async (applicantData: Applicant) => {
  const firstName: HTMLInputElement =
    document.querySelector('[name="firstName"]');
  if (firstName) {
    firstName.value = applicantData.first_name;
    handleValueChanges(firstName);
  }

  const lastName: HTMLInputElement =
    document.querySelector('[name="lastName"]');
  if (lastName) {
    lastName.value = applicantData.last_name;
    handleValueChanges(lastName);
  }

  const contactEmail: HTMLInputElement = document.querySelector(
    '[name="contactEmail"]'
  );
  if (contactEmail) {
    contactEmail.value = applicantData.email_address;
    handleValueChanges(contactEmail);
  }

  const adress: HTMLInputElement = document.querySelector('[name="address"]');
  if (adress) {
    adress.value = applicantData.address;
    handleValueChanges(adress);
  }

  const city: HTMLInputElement = document.querySelector('[name="city"]');
  if (city) {
    city.value = applicantData.city;
    handleValueChanges(city);
  }

  const zipcode: any = document.querySelector('[name="zip"]');
  if (zipcode) {
    zipcode.value = applicantData.zip_code;
    handleValueChanges(zipcode);
  }

  const cellPhone: any = document.querySelector('[name="cellPhone"]');
  if (cellPhone) {
    cellPhone.value = applicantData.phone_number;
    handleValueChanges(cellPhone);
  }

  await delay(1000);
};

const openAllTab = () => {
  const div = document.querySelector(".rcmResumeElement");
  if (!div) {
    return;
  }
  const button = div.querySelector("a");
  if (!button) {
    return;
  }
  button.click();
};

const fillAge = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");

  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    // for age
    if (text.includes("18 years")) {
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
        const answertext = option.textContent;
        if (!answertext) {
          return;
        }
        if (
          applicantData.is_over_18 &&
          fromatStirngInLowerCase(answertext) === "yes"
        ) {
          option.click();
          handleValueChanges(option);
          return;
        }

        if (
          !applicantData.is_over_18 &&
          fromatStirngInLowerCase(answertext) === "no"
        ) {
          option.click();
          handleValueChanges(option);
          return;
        }
      }
    }
  }
};

const fillVisa = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (text.includes("sponsorship") || text.includes("visa")) {
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
        const answertext = option.textContent;
        if (!answertext) {
          return;
        }
        if (
          applicantData.sponsorship_required &&
          fromatStirngInLowerCase(answertext) === "yes"
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          !applicantData.sponsorship_required &&
          fromatStirngInLowerCase(answertext) === "no"
        ) {
          option.click();
          handleValueChanges(option);
        }
      }
    }
  }
};

const fillWorkAuthorization = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (text.includes("legally authorized") || text.includes("legally")) {
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
        const answertext = option.textContent;
        if (!answertext) {
          return;
        }
        if (
          applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(answertext) === "yes"
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          !applicantData.us_work_authoriztaion &&
          fromatStirngInLowerCase(answertext) === "no"
        ) {
          option.click();
          handleValueChanges(option);
        }
      }
    }
  }
};

const fillGender = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (text.toLowerCase()?.includes("gender")) {
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
        const answertext = option.textContent;
        if (!answertext) {
          return;
        }
        if (fromatStirngInLowerCase(answertext) === applicantData.gender) {
          option.click();
          handleValueChanges(option);
        }
      }
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
      if (!allOption || allOption.length === 0) {
        return;
      }
      for (const option of allOption) {
        const answertext = option.textContent;
        if (!answertext) {
          return;
        }
        if (
          fromatStirngInLowerCase(answertext)?.includes(
            fromatStirngInLowerCase(applicantData.race)
          )
        ) {
          option.click();
          handleValueChanges(option);
        }
      }
    }
  }
};

const fillVeteran = async (applicantData: Applicant) => {
  const allLabel = document.querySelectorAll("label");
  let veteran = false;
  let disability = false;
  for (const label of allLabel) {
    const text = label?.textContent?.trim();

    if (!veteran && fromatStirngInLowerCase(text) === "pleaseselect") {
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
          fromatStirngInLowerCase(answertext) === "ichoosenottoselfidentify"
        ) {
          option.click();
          handleValueChanges(option);
        }

        // for disability

        if (
          !applicantData.disability_status &&
          fromatStirngInLowerCase(answertext) === "nodisability"
        ) {
          option.click();
          handleValueChanges(option);
        }

        if (
          applicantData.disability_status &&
          fromatStirngInLowerCase(answertext) ===
            "yeswithadisabilityorpreviouslyhadadisability"
        ) {
          option.click();
          handleValueChanges(option);
        }
      }
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

export const successfactors = async (
  tempDivs: any,
  applicantData: Applicant
) => {
  openAllTab();
  await uploadResume(applicantData);
  await fillBasicInfo(applicantData);
  await fillAge(applicantData);
  await fillVisa(applicantData);
  await fillWorkAuthorization(applicantData);
  await fillGender(applicantData);
  await fillRace(applicantData);
  if (window.location.href.includes(".successfactors.")) {
    await fillVeteran(applicantData);
  }
  if (window.location.href.includes(".sapsf.")) {
    await fillSapsfVeteran(applicantData);
    await fillSapsfDisability(applicantData);
  }
  fillCheckBox();
};
