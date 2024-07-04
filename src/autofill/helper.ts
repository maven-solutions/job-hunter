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
  applicantData: any,

  startLoading: any,
  stopLoading: any
) => {
  const iframeList: any = document.querySelectorAll("iframe");
  // console.log("iframeList::", iframeList);
  let iframe: any = "";

  // for icims  = [0]
  if (iframeList.length > 0 && window.location.href.includes("icims")) {
    iframe = iframeList[0];
    if (window.location.href.includes("careers-virginpulse.icims.com")) {
      iframe = iframeList[4];
    }
    if (window.location.href.includes("careers-berrydunn.icims.com")) {
      iframe = iframeList[0];
    }
  }
  if (iframe) {
    startLoading();

    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow.document;
    // console.log("iframeDocument::", iframeDocument);

    const tempDiv = iframeDocument.querySelector("form");
    // console.log("tempDiv::", tempDiv);

    const tempDivForFile = iframeDocument.querySelector("body");
    // console.log("tempDivForFile::", tempDivForFile);

    console.log("iframe::");

    buttonFilder();
    textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    emailTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    numberTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    telTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    urlTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    radioTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    fancyRadiotypeFiller(tempDiv ?? tempDivForFile, applicantData);
    dateTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    checkboxTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    fileTypeDataFiller(tempDivForFile, applicantData, true);
    selectDataExtract(tempDiv ?? tempDivForFile, applicantData, false);
    customSelectFiller(tempDiv ?? tempDivForFile, applicantData, false);
    customSelectFiller2(tempDiv ?? tempDivForFile, applicantData, false);

    if (window.location.href.includes(".icims.")) {
      await icims(tempDiv ?? tempDivForFile, applicantData);
    }
    stopLoading();
    // console.log("ended::");
  } else {
    startLoading();
    console.log("no-iframe::");
    let launchWork = true;
    let launcEducation = true;
    let tempDiv: any = document.querySelector("form");
    // console.log("tempvid::", tempDiv);
    let tempDivForFile = document.querySelector("body");
    // console.log("tempDivForFile::", tempDivForFile);

    if (
      window.location.href.includes(".peoplehr.") ||
      window.location.href.includes(".tal.") ||
      window.location.href.includes(".zohorecruit.") ||
      window.location.href.includes(".hire.") ||
      window.location.href.includes(".rec.pro.") ||
      window.location.href.includes(".successfactors.") ||
      window.location.href.includes("paycomonline.")
    ) {
      tempDiv = document.querySelector("body");
    }

    localStorage.removeItem("ci_inputid");
    localStorage.removeItem("times");
    if (window.location.href.includes(".myworkdayjobs.")) {
      await myworkDays(tempDiv ?? tempDivForFile, applicantData);
    }

    buttonFilder();
    textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    emailTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    numberTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    telTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    urlTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    radioTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    fancyRadiotypeFiller(tempDiv ?? tempDivForFile, applicantData);
    dateTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    checkboxTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    fileTypeDataFiller(tempDivForFile, applicantData, false);
    selectDataExtract(tempDiv ?? tempDivForFile, applicantData, false);
    customSelectFiller(tempDiv ?? tempDivForFile, applicantData, false);
    customSelectFiller2(tempDiv ?? tempDivForFile, applicantData, false);

    // handling domain specific condation
    if (window.location.href.includes("smartrecruiters")) {
      launchWork = false;
      launcEducation = false;
    }

    if (window.location.href.includes(".ebayinc.")) {
      launchWork = false;
    }
    if (window.location.href.includes(".paylocity.")) {
      launchWork = false;
      launcEducation = false;
      await paylocity(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".myworkdayjobs.")) {
      launchWork = false;
      launcEducation = false;
    }

    if (launchWork) {
      await clickWorkExperienceButton(tempDiv ?? tempDivForFile, applicantData);
    }
    if (launcEducation) {
      await clickEducationButton(tempDiv ?? tempDivForFile, applicantData);
    }

    // for domain specific
    if (window.location.href.includes(".greenhouse.")) {
      greenHouse(tempDiv ?? tempDivForFile, applicantData);
    }
    // for domain specific
    if (window.location.href.includes(".lever.")) {
      jobsLever(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".eightfold.")) {
      eightFold(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".adp.")) {
      adp(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".autheo.")) {
      autheo(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".careers-page.")) {
      careersPage(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".pinpointhq.")) {
      await pinpointhq(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".zohorecruit.")) {
      await zohorecruit(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".jobvite.")) {
      await jobvite(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".csod.")) {
      await csod(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".avature.")) {
      await avature(tempDiv ?? tempDivForFile, applicantData);
    }

    if (
      window.location.href.includes(".successfactors.") ||
      window.location.href.includes(".sapsf.")
    ) {
      await successfactors(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".battelle.")) {
      await battelle(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".oraclecloud.")) {
      await oraclecloud(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".ultipro.")) {
      await ultipro(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".workable.")) {
      await workable(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".hire.trakstar.")) {
      await hiretrakstar(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".jcat.")) {
      await jcat(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".applytojob.")) {
      await applytojob(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".magellanhealth.")) {
      await magellanhealth(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".rec.pro.")) {
      await recpro(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".hpe.")) {
      await hpe(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".ashbyhq.")) {
      // re calling to fill the entire from
      ashbyhq(tempDiv ?? tempDivForFile, applicantData);
      textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      emailTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      numberTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      telTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      urlTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    }

    stopLoading();
  }
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
