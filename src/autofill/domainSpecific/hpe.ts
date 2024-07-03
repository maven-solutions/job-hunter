import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase, handleValueChanges } from "../helper";

const handleDisabiblit = (applicantData: Applicant) => {
  const disabilityEle: HTMLElement = document.getElementById(
    "disability_heading_self_identity.disabilityStatus"
  );

  console.log("disabilityEle::", disabilityEle);
  if (!disabilityEle) {
    return;
  }
  const allLabel = disabilityEle.querySelectorAll("label");
  if (!allLabel || allLabel.length === 0) {
    return;
  }
  for (const label of allLabel) {
    console.log("label::", label);

    if (
      label &&
      applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("yesihave")
    ) {
      label.click();
    }

    if (
      label &&
      !applicantData.disability_status &&
      fromatStirngInLowerCase(label.textContent).includes("idonothave")
    ) {
      label.click();
    }
  }
};

const handleAgreement = () => {
  const agreementEle: any = document.getElementById("agreementCheck");
  if (agreementEle) {
    agreementEle.ariaChecked;
    agreementEle.checked;
    handleValueChanges(agreementEle);
  }

  const agreement2: any = document.getElementById(
    "Additional Fields.noticeAgreement"
  );
  if (agreement2) {
    agreement2.ariaChecked;
    agreement2.checked;
    handleValueChanges(agreement2);
  }
};

const fillUrl = (applicantData: Applicant) => {
  const likedin: any = document.querySelector(
    '[label="Please provide your LinkedIn profile"]'
  );
  if (likedin) {
    likedin.value = applicantData.linkedin_url;
  }
  handleValueChanges(likedin);
};
export const hpe = async (tempDiv: any, applicantData: Applicant) => {
  handleDisabiblit(applicantData);
  fillUrl(applicantData);
  handleAgreement();
};
