import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const textfieldFiller = async (applicantData: Applicant) => {
  const lastname: any = document.getElementById("actionItem.lastName.idTag");
  lastname.value = applicantData.last_name;
  //
  const email: any = document.getElementById("actionItem.email.idTag");
  email.value = applicantData.email_address;
};

const selectFiller = async (applicantData: Applicant) => {
  let veteran = false;
  const veteranSelect: any = document.getElementById("EEOQuestion--2");
  Array.from(veteranSelect.options).find((option: any) => {
    //for yes
    if (
      applicantData.veteran_status === 1 &&
      !veteran &&
      (fromatStirngInLowerCase(option?.text).includes("amaveteran") ||
        fromatStirngInLowerCase(option?.text).includes("amveteran"))
    ) {
      option.selected = true;
      handleValueChanges(option);
      veteran = true;
    }

    if (
      applicantData.veteran_status === 2 &&
      !veteran &&
      fromatStirngInLowerCase(option?.text).includes("iamnot")
    ) {
      option.selected = true;
      handleValueChanges(option);
      veteran = true;
    }

    // for yes
    if (
      applicantData.veteran_status === 3 &&
      !veteran &&
      fromatStirngInLowerCase(option?.text).includes("identifyasaveteran")
    ) {
      option.selected = true;
      handleValueChanges(option);
      veteran = true;
    }

    // for yes
    if (
      applicantData.veteran_status === 3 &&
      !veteran &&
      fromatStirngInLowerCase(option?.text).includes("identifyasoneormore")
    ) {
      option.selected = true;
      handleValueChanges(option);
    }

    //for one or more
    if (
      applicantData.veteran_status === 4 &&
      !veteran &&
      fromatStirngInLowerCase(option?.text).includes("identifyasoneormore")
    ) {
      option.selected = true;
      handleValueChanges(option);
      veteran = true;
    }
    // for yes---

    if (
      applicantData.veteran_status === 1 &&
      !veteran &&
      fromatStirngInLowerCase(option?.text).includes("identifyasoneormore")
    ) {
      option.selected = true;
      handleValueChanges(option);
      veteran = true;
    }

    //for decline
    if (
      applicantData.veteran_status === 5 &&
      !veteran &&
      (fromatStirngInLowerCase(option?.text).includes("selfidentify") ||
        fromatStirngInLowerCase(option?.text).includes("dontwish") ||
        fromatStirngInLowerCase(option?.text).includes("decline") ||
        fromatStirngInLowerCase(option?.text).includes("notwish"))
    ) {
      option.selected = true;
      handleValueChanges(option);
      veteran = true;
    }
  });
  const disability: any = document.getElementById("EEOQuestion--3");
  Array.from(disability.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text).includes("yes") &&
      applicantData.disability_status
    ) {
      option.selected = true;
      handleValueChanges(option);
      return true;
    }

    if (
      fromatStirngInLowerCase(option?.text).includes("no") &&
      !applicantData.disability_status
    ) {
      option.selected = true;
      handleValueChanges(option);
      return true;
    }
  });

  const gender: any = document.getElementById("EEOQuestion-1");

  Array.from(gender.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase(applicantData.gender)
    ) {
      option.selected = true;
      handleValueChanges(option);
      return true;
    }
  });
};

const radiotypefiller = async (applicantData: Applicant) => {
  const usawork: any = document.querySelector('[aria-labelledby="25"]');
  if (!usawork) {
    return;
  }
  const list = usawork.children ?? "";
  const yes: any = list[0];
  const no: any = list[1];
  if (applicantData.us_work_authoriztaion) {
    yes.click();
  }
  if (!applicantData.us_work_authoriztaion) {
    no.click();
  }

  const isAdult = document.querySelector('[aria-labelledby="11"]');
  const raidoList = isAdult.children ?? "";
  const radioyes: any = raidoList[0];
  const radiono: any = raidoList[1];
  if (applicantData.is_over_18) {
    radioyes.click();
  }
  if (!applicantData.is_over_18) {
    radiono.click();
  }
};
export const csod = async (tempDiv: any, applicantData: Applicant) => {
  await delay(3000);
  await textfieldFiller(applicantData);
  await radiotypefiller(applicantData);
  await delay(2000);
  await selectFiller(applicantData);
};
