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
const fillGender = async (applicantData: Applicant) => {
  const select: any = document.querySelector(
    '[aria-describedby="identityContent.custgender"]'
  );
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) ===
      fromatStirngInLowerCase(applicantData.gender)
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }
  });
};
const hispanic = async (applicantData: Applicant) => {
  const select: any = document.querySelector(
    '[aria-describedby="identityContent.ethnicity"]'
  );
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) === "hispanicorlatino" &&
      applicantData.hispanic_or_latino
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }

    if (
      fromatStirngInLowerCase(option?.text) === "nothispaniceorlatino" &&
      !applicantData.hispanic_or_latino
    ) {
      option.selected = true;
      handleValueChanges(select);

      return true;
    }
  });
};

const fillRace = async (applicantData: Applicant) => {
  const select: any = document.querySelector(
    '[aria-describedby="identityContent.race"]'
  );
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text) &&
      fromatStirngInLowerCase(option?.text).includes(
        fromatStirngInLowerCase(applicantData?.race)
      )
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }
  });
};

const FillDisability = async (applicantData: Applicant) => {
  const select: any = document.querySelector(
    '[aria-describedby="identityContent.custVetStatus]'
  );
  console.log("dis::", select);
  if (!select) {
    return;
  }

  Array.from(select.options).find((option: any) => {
    if (
      fromatStirngInLowerCase(option?.text).includes("yes") &&
      applicantData.disability_status
    ) {
      option.selected = true;
      handleValueChanges(select);
      return true;
    }

    if (
      fromatStirngInLowerCase(option?.text).includes("no") &&
      !applicantData.disability_status
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
  await fillGender(applicantData);
  await hispanic(applicantData);
  await fillRace(applicantData);
  await FillDisability(applicantData);
};
