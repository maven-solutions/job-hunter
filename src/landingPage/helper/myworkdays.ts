import { detectInputAndFillData } from "../../autofill/helper";

export const removeMyWorkdaysAutofillButton = () => {
  const autofillButton = document.querySelector<HTMLElement>(
    '[data-automation-id="autofillWithResume"]'
  );
  if (autofillButton) {
    autofillButton.remove();
  }
};

// Function to change button text
export const changeMyWorkdaysButtonText = () => {
  const manualApplyButton = document.querySelector<HTMLElement>(
    '[data-automation-id="applyManually"]'
  );
  if (manualApplyButton) {
    manualApplyButton.textContent = "Apply with CareerAI";
  }
};

export const handleMajorDOMChangesInMyworkdays = (
  startLoading: () => void,
  stopLoading: () => void
) => {
  const localUrl = localStorage.getItem("url");
  if (localUrl === window.location.href) {
    const getUser = localStorage.getItem("userinfo");
    const applicantData = JSON.parse(getUser);
    console.log("applicant---automatic------::", applicantData);
    detectInputAndFillData(applicantData, startLoading, stopLoading);
  }
};
