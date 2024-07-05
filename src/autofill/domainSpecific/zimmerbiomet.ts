import { Applicant } from "../data";
import { fileTypeDataFiller } from "../FromFiller/fileTypeDataFiller";
import { fromatStirngInLowerCase, handleValueChanges } from "../helper";

const fillAuthorization = async (applicantData: Applicant) => {
  const select: any = document.querySelector("#areYouLegallyAuthorizedToWork");
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) === "yes" &&
      applicantData.us_work_authoriztaion
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }

    if (
      fromatStirngInLowerCase(option?.text) === "no" &&
      !applicantData.us_work_authoriztaion
    ) {
      option.selected = true;
      handleValueChanges(select);

      return true;
    }
  });
};

const fillSposership = async (applicantData: Applicant) => {
  const select: any = document.querySelector("#sponsorshipFromZimmerBiomet");
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) === "yes" &&
      applicantData.sponsorship_required
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }

    if (
      fromatStirngInLowerCase(option?.text) === "no" &&
      !applicantData.sponsorship_required
    ) {
      option.selected = true;
      handleValueChanges(select);

      return true;
    }
  });
};

const isAdult = async (applicantData: Applicant) => {
  const select: any = document.querySelector("#areYou18YearsOfAgeOrOlder");
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) === "yes" &&
      applicantData.is_over_18
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }

    if (
      fromatStirngInLowerCase(option?.text) === "no" &&
      !applicantData.is_over_18
    ) {
      option.selected = true;
      handleValueChanges(select);

      return true;
    }
  });
};
export const zimmerbiomet = async (tempDiv: any, applicantData: Applicant) => {
  let tempDivForFile = document.querySelector("body");
  await fileTypeDataFiller(tempDivForFile, applicantData, false);
  await fillAuthorization(applicantData);
  await fillSposership(applicantData);
  await isAdult(applicantData);
};
