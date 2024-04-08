import { checkboxTypeDataFiller } from "./FromFiller/checkboxFiller";
import { clickEducationButton } from "./FromFiller/clickEducationButton";
import { clickWorkExperienceButton } from "./FromFiller/clickWorkExperienceButton";
import { customSelectFiller } from "./FromFiller/customSelectFiller";
import { emailTypeDataFiller } from "./FromFiller/emailTypeDataFiller";
import { fileTypeDataFiller } from "./FromFiller/fileTypeDataFiller";
import { numberTypeDataFiller } from "./FromFiller/numberTypeDataFiller";
import { selectDataExtract } from "./FromFiller/selectDataExtract";
import { telTypeDataFiller } from "./FromFiller/telTypeDataFiller";
import { textTypeDataFiller } from "./FromFiller/textTypeDataFiller";
import { urlTypeDataFiller } from "./FromFiller/urlTypeDataFiller";

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
      console.log("att::", attribute, "::--::", "val::", element);
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
export const detectInputAndFillData = async (applicantData: any) => {
  const iframeList: any = document.querySelectorAll("iframe");
  let iframe: any = "";

  // for icims  = [0]
  iframe = iframeList[0];
  if (iframe) {
    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow.document;
    // console.log("iframeDocument::", iframeDocument);

    const tempDiv = iframeDocument.querySelector("form");
    // console.log("tempDiv::", tempDiv);

    const tempDivForFile = iframeDocument.querySelector("body");
    textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    emailTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    numberTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    telTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    urlTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    checkboxTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);

    fileTypeDataFiller(tempDiv, applicantData, true);
    selectDataExtract(tempDiv ?? tempDivForFile, applicantData, true);
  } else {
    console.log("no-iframe::");
    let launchWork = true;
    let launcEducation = true;
    const tempDiv = document.querySelector("form");
    const tempDivForFile = document.querySelector("body");
    localStorage.removeItem("ci_inputid");
    // localStorage.removeItem("times");
    textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    emailTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    numberTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    telTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    urlTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    checkboxTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    fileTypeDataFiller(tempDivForFile, applicantData, false);
    selectDataExtract(tempDiv ?? tempDivForFile, applicantData, false);
    customSelectFiller(tempDiv ?? tempDivForFile, applicantData, false);

    // handling domain specific condation
    if (window.location.href.includes("smartrecruiters")) {
      launchWork = false;
      launcEducation = false;
    }

    if (launchWork) {
      await clickWorkExperienceButton(tempDiv ?? tempDivForFile, applicantData);
    }
    if (launcEducation) {
      await clickEducationButton(tempDiv ?? tempDivForFile, applicantData);
    }
  }
};

export const handleValueChanges = async (input) => {
  input.dispatchEvent(
    new Event("change", { bubbles: true, cancelable: false })
  );
  input.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));

  input.dispatchEvent(new Event("focus", { bubbles: true, cancelable: false }));

  input.dispatchEvent(new Event("click", { bubbles: true, cancelable: false }));

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
