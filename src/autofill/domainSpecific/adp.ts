import { Applicant } from "../data";
import { delay, fromatStirngInLowerCase } from "../helper";

// const fillIsAdult = async (applicantData: Applicant) => {
//   const radioEle = document.querySelector("#question_row_10532307");
//   if (!radioEle) {
//     return;
//   }
//   const spanListContainer = radioEle.querySelector(".element");
//   if (!spanListContainer) {
//     return;
//   }
//   const spanList = spanListContainer.children;
//   const yes: any = spanList[1];
//   const No: any = spanList[2];
//   if (applicantData.is_over_18) {
//     yes.click();
//   }
//   if (!applicantData.is_over_18) {
//     No.click();
//   }
//   await delay(500);
// };

// const isAuthorizedToWorkInUs = (applicantData: Applicant) => {
//   const radioEle = document.querySelector("#question_row_10532807");
//   if (!radioEle) {
//     return;
//   }
//   const spanListContainer = radioEle.querySelector(".element");

//   if (!spanListContainer) {
//     return;
//   }
//   const spanList = spanListContainer.children;
//   const yes: any = spanList[1];
//   const No: any = spanList[2];

//   if (applicantData.us_work_authoriztaion) {
//     yes.click();
//   }
//   if (!applicantData.us_work_authoriztaion) {
//     No.click();
//   }
// };
const fillGender = (applicantData: Applicant) => {
  const genderTag = document.querySelector('[for="eeoGender"]');
  if (!genderTag) {
    return;
  }
  const allLabel = genderTag.querySelectorAll("label");
  if (allLabel && allLabel.length > 0)
    for (const label of allLabel) {
      if (fromatStirngInLowerCase(label.textContent) === applicantData.gender) {
        label.click();
      }
    }
};
const fillRace = (applicantData: Applicant) => {
  const allFieldset = document.querySelectorAll(".radio");
  if (!allFieldset || allFieldset.length === 0) {
    return;
  }
  // for hispanico
  const hispanio = allFieldset[0];
  const allLabel = hispanio.querySelectorAll("label");
  if (allLabel && allLabel.length > 0)
    for (const label of allLabel) {
      if (
        fromatStirngInLowerCase(label.textContent) === "yes" &&
        applicantData.hispanic_or_latino
      ) {
        label.click();
      }

      if (
        fromatStirngInLowerCase(label.textContent) === "no" &&
        !applicantData.hispanic_or_latino
      ) {
        label.click();
      }

      if (
        fromatStirngInLowerCase(label.textContent).includes(
          fromatStirngInLowerCase(applicantData.race)
        )
      ) {
        label.click();
      }
    }
};

const fillVeteran = (applicantData: Applicant) => {
  const allFieldset = document.querySelectorAll(".radio");
  if (!allFieldset || allFieldset.length === 0) {
    return;
  }

  // for veteran
  const veratanTag = allFieldset[2];
  if (!veratanTag) {
    return;
  }
  const allVetaranLabel = veratanTag.querySelectorAll("label");

  for (const vlabel of allVetaranLabel) {
    if (
      (applicantData.veteran_status === 1 ||
        applicantData.veteran_status === 3) &&
      (fromatStirngInLowerCase(vlabel?.textContent).includes("amaveteran") ||
        fromatStirngInLowerCase(vlabel?.textContent).includes("amveteran") ||
        fromatStirngInLowerCase(vlabel?.textContent).includes("amaprotected"))
    ) {
      vlabel.click();
    }
    if (
      applicantData.veteran_status === 2 &&
      fromatStirngInLowerCase(vlabel?.textContent).includes("iamnot")
    ) {
      vlabel.click();
    }

    if (
      applicantData.veteran_status === 5 &&
      (fromatStirngInLowerCase(vlabel?.textContent).includes("selfidentify") ||
        fromatStirngInLowerCase(vlabel?.textContent).includes("dontwish") ||
        fromatStirngInLowerCase(vlabel?.textContent).includes("dontwish") ||
        fromatStirngInLowerCase(vlabel?.textContent).includes("notwish"))
    ) {
      vlabel.click();
    }
  }
};

const fillDisability = (applicantData: Applicant) => {
  const allFieldset = document.querySelectorAll(".radio");
  if (!allFieldset || allFieldset.length === 0) {
    return;
  }

  const disabilityTag = allFieldset[3];
  const allLabel = disabilityTag.querySelectorAll("label");
  if (allLabel && allLabel.length > 0)
    for (const label of allLabel) {
      if (
        fromatStirngInLowerCase(label.textContent).includes("yes") &&
        applicantData.disability_status
      ) {
        label.click();
        return;
      }

      if (
        fromatStirngInLowerCase(label.textContent).includes("no") &&
        !applicantData.disability_status
      ) {
        label.click();
        return;
      }
    }
};

const handleAllQuestion = async (applicantData: Applicant) => {
  const allQuestion = document.querySelectorAll(".questionRow");
  for (const question of allQuestion) {
    const label = question.querySelector("label");
    if (label) {
      const qn = label.textContent.trim();

      // for 18 years
      if (qn.includes("18 years")) {
        const allAnswer = question.querySelectorAll("label");
        if (!allAnswer || allAnswer.length === 0) {
          return;
        }
        const optionYes = allAnswer[1];
        const optionNo = allAnswer[2];
        if (applicantData.is_over_18) {
          optionYes.click();
        } else {
          optionNo.click();
        }
      }
      await delay(500);

      // for us work auth

      if (qn.includes("eligible to work")) {
        const allAnswer = question.querySelectorAll("label");
        if (!allAnswer || allAnswer.length === 0) {
          return;
        }
        const optionYes = allAnswer[1];
        const optionNo = allAnswer[2];
        if (applicantData.us_work_authoriztaion) {
          optionYes.click();
        } else {
          optionNo.click();
        }
      }
      await delay(500);

      // for sponshirship
      if (qn.includes("sponsorship") || qn.includes("visa")) {
        const allAnswer = question.querySelectorAll("label");
        if (!allAnswer || allAnswer.length === 0) {
          return;
        }
        const optionYes = allAnswer[1];
        const optionNo = allAnswer[2];
        if (applicantData.sponsorship_required) {
          optionYes.click();
        } else {
          optionNo.click();
        }
      }
    }
  }
};

export const adp = async (tempDiv: any, applicantData: Applicant) => {
  // fillIsAdult(applicantData);
  // isAuthorizedToWorkInUs(applicantData);
  fillGender(applicantData);
  fillRace(applicantData);
  fillVeteran(applicantData);
  fillDisability(applicantData);
  handleAllQuestion(applicantData);
};
