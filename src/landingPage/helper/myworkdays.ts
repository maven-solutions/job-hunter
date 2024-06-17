import { detectInputAndFillData } from "../../autofill/helper";
import { LOCALSTORAGE } from "../../utils/constant";

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
  const localUrl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
  if (localUrl === window.location.href) {
    const getUser = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_USERINFO);
    const applicantData = JSON.parse(getUser);
    detectInputAndFillData(applicantData, startLoading, stopLoading);
  }
};
