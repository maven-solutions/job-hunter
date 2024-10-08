import { buttonFilder } from "./FromFiller/buttonFinder";
import { checkboxTypeDataFiller } from "./FromFiller/checkboxFiller";
import { clickEducationButton } from "./FromFiller/clickEducationButton";
import { clickWorkExperienceButton } from "./FromFiller/clickWorkExperienceButton";
import { customSelectFiller } from "./FromFiller/customSelectFiller";
import { customSelectFiller2 } from "./FromFiller/customSelectFiller2";
import { dateTypeDataFiller } from "./FromFiller/dateTypeFiller";
import { emailTypeDataFiller } from "./FromFiller/emailTypeDataFiller";
import { fancyRadiotypeFiller } from "./FromFiller/fancyRadiotypeFiller";
import { fileTypeDataFiller } from "./FromFiller/fileTypeDataFiller";
import { numberTypeDataFiller } from "./FromFiller/numberTypeDataFiller";
import { radioTypeDataFiller } from "./FromFiller/radiotypefiller";
import { selectDataExtract } from "./FromFiller/selectDataExtract";
import { telTypeDataFiller } from "./FromFiller/telTypeDataFiller";
import { textTypeDataFiller } from "./FromFiller/textTypeDataFiller";
import { urlTypeDataFiller } from "./FromFiller/urlTypeDataFiller";
import { adp } from "./domainSpecific/adp";
import { ashbyhq } from "./domainSpecific/ashbyhq";
import { autheo } from "./domainSpecific/autheo";
import { careersPage } from "./domainSpecific/careers-page";
import { csod } from "./domainSpecific/csod";
import { avature } from "./domainSpecific/avature";
import { eightFold } from "./domainSpecific/eightFold";
import { greenHouse } from "./domainSpecific/greenhouse";
import { jobsLever } from "./domainSpecific/jobslever";
import { jobvite } from "./domainSpecific/jobvite";
import { myworkDays } from "./domainSpecific/myworkdays";
import { pinpointhq } from "./domainSpecific/pinpointhq";
import { zohorecruit } from "./domainSpecific/zohorecruit";
import { icims } from "./domainSpecific/icims";
import { successfactors } from "./domainSpecific/successfactors";
import { battelle } from "./domainSpecific/battelle";
import { oraclecloud } from "./domainSpecific/oraclecloud";
import { ultipro } from "./domainSpecific/ultipro";
import { workable } from "./domainSpecific/workable";
import { hiretrakstar } from "./domainSpecific/hiretrakstar";
import { jcat } from "./domainSpecific/jcat";
import { applytojob } from "./domainSpecific/applytojob";
import { magellanhealth } from "./domainSpecific/magellanhealth";
import { paylocity } from "./domainSpecific/paylocity";
import { recpro } from "./domainSpecific/recpro";
import { hpe } from "./domainSpecific/hpe";
import { paycomonline } from "./domainSpecific/paycomonline";
import { zimmerbiomet } from "./domainSpecific/zimmerbiomet";
import { concentrix } from "./domainSpecific/concentrix";
import { rippling } from "./domainSpecific/rippling";
import { bamboohr } from "./domainSpecific/bamboohr";
import { fisglobal } from "./domainSpecific/fisglobal";
import { applicantpro } from "./domainSpecific/applicantpro";
import { cornerstonebuildingbrands } from "./domainSpecific/cornerstonebuildingbrands";
import { silkroad } from "./domainSpecific/silkroad";
import { apploxo } from "./domainSpecific/apploxo";
import { myomo } from "./domainSpecific/myomo";
import { sephora } from "./domainSpecific/sephora";
import { passwordTypeDataFiller } from "./FromFiller/passwordTypeDataFiller";
import { brassring } from "./domainSpecific/brassring";
import { jobsabbott } from "./domainSpecific/jobsabbott";
import { LOCALSTORAGE } from "../utils/constant";
import { taleo } from "./domainSpecific/taleo";
import { isEmptyArray } from "../utils/helper";
import { talemetry } from "./domainSpecific/talemetry";
import { fillImmersity } from "./immersity";
import { mailinator } from "./mailinator";

export const setLocalStorageData = (key: any, value: any): void => {
  chrome.storage.local.set({
    [`careerhub_${key}`]: value,
  });
};

export const getLocalStorageData = (key: any): Promise<any> => {
  return new Promise((resolve) => {
    const storageKey = `careerhub_${key}`;

    chrome.storage.local.get(storageKey, (result) => {
      const value = result[storageKey];
      resolve(value);
    });
  });
};

export const clearLocalStorageData = (key: string): void => {
  const storageKey = `careerhub_${key}`;

  chrome.storage.local.remove(storageKey, () => {});
};

export const checkIfExist = (attribute, valueOfArr): boolean => {
  let res = false;
  valueOfArr.forEach((element) => {
    // attribute = .replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    attribute = fromatStirngInLowerCase(attribute);
    if (attribute?.includes(element)) {
      res = true;
    }
  });
  return res;
};

export const checkNationForWorkDays = (attribue, valueOfArr) => {
  if (
    fromatStirngInLowerCase(attribue) === fromatStirngInLowerCase(valueOfArr[0])
  ) {
    return true;
  }
  return false;
};

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export const detectInputAndFillData = async (
  startLoading: any,
  stopLoading: any
) => {
  startLoading(true);
  if (window.location.href.includes("immersity")) {
    await fillImmersity();
  }
  if (window.location.href.includes("mailinator")) {
    await mailinator();
  }
  stopLoading(false);
};

export const handleValueChanges = async (input) => {
  input.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false })
  );
  input.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
  input.dispatchEvent(new Event("focus", { bubbles: true, cancelable: false }));
  input.dispatchEvent(new Event("click", { bubbles: true, cancelable: false }));
  input.dispatchEvent(new Event("blur", { bubbles: true, cancelable: false }));

  input.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
};

export const fromatStirngInLowerCase = (name: any) => {
  if (!name) {
    return null;
  }
  return name
    .replace(/[\d\(\)\[\]\{\}]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
};
