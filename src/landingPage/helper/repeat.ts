import { detectInputAndFillData } from "../../autofill/helper";
import { LOCALSTORAGE } from "../../utils/constant";

export const repatDetectInputAndFillData = (
  startLoading: () => void,
  stopLoading: () => void
) => {
  const getUser = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_USERINFO);
  const applicantData = JSON.parse(getUser);
  detectInputAndFillData(applicantData, startLoading, stopLoading);
};