import { Applicant } from "../data";
import { fromatStirngInLowerCase } from "../helper";

const fillEligibe = (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector(
    "#id_are_you_eligible_to_work_in_the_united_states"
  );
  if (!select) {
    return;
  }
  Array.from(select.options).find((option: any) => {
    if (
      applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(option?.text) === "yes"
    ) {
      option.selected = true;
      return;
    }

    if (
      !applicantData.us_work_authoriztaion &&
      fromatStirngInLowerCase(option?.text) === "no"
    ) {
      option.selected = true;
      return;
    }
  });
};

const fillVisa = (applicantData: Applicant) => {
  const select: HTMLSelectElement = document.querySelector(
    "#id_will_you_now_or_in_the_future_require_visa_sponsorship"
  );
  if (!select) {
    return;
  }
  Array.from(select.options).find((option: any) => {
    if (
      applicantData.sponsorship_required &&
      fromatStirngInLowerCase(option?.text) === "yes"
    ) {
      option.selected = true;
      return;
    }

    if (
      !applicantData.sponsorship_required &&
      fromatStirngInLowerCase(option?.text) === "no"
    ) {
      option.selected = true;
      return;
    }
  });
};

export const hiretrakstar = async (tempDiv: any, applicantData: Applicant) => {
  fillEligibe(applicantData);
  fillVisa(applicantData);
};
