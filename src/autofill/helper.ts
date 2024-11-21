import { buttonFilder } from "./FromFiller/buttonFinder";
import { checkboxTypeDataFiller } from "./FromFiller/checkboxFiller";
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
import { taleo } from "./domainSpecific/taleo";
import { talemetry } from "./domainSpecific/talemetry";

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
  stopLoading: any,
  setIframeUrl?: any
) => {
  const iframeList: any = document.querySelectorAll("iframe");
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
    if (window.location.href.includes("careers-eimagine.icims")) {
      iframe = iframeList[1];
    }
    if (window.location.href.includes("careers-adspipe.icims")) {
      iframe = iframeList[2];
    }
  }
  if (iframeList.length > 0) {
    for (const iframe of iframeList) {
      const src = iframe?.src;

      const splitted = src?.split("/");

      if (splitted && splitted.length >= 2) {
        const currentWebURL = splitted[2];
        if (
          currentWebURL?.includes(".greenhouse.") ||
          currentWebURL?.includes(".ashbyhq.") ||
          currentWebURL?.includes(".talemetry.") ||
          currentWebURL?.includes("jobs.jobvite.") ||
          currentWebURL?.includes("comeet.")
        ) {
          setIframeUrl(src);
          break;
        }
      }
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

    // console.log("iframe::");

    buttonFilder();
    textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    passwordTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
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
    // console.log("no-iframe::");
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
      window.location.href.includes("paycomonline.") ||
      window.location.href.includes(".amazon.jobs")
    ) {
      tempDiv = document.querySelector("body");
    }

    localStorage.removeItem("ci_inputid");

    if (window.location.href.includes(".myworkdayjobs.")) {
      await myworkDays(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes("zimmerbiomet")) {
      await zimmerbiomet(tempDiv ?? tempDivForFile, applicantData);
      stopLoading();
      return;
    }

    if (
      window.location.href.includes(".ultipro.") &&
      !window.location.href.toLocaleLowerCase().includes("signin") &&
      !window.location.href.toLocaleLowerCase().includes("register")
    ) {
      await ultipro(tempDiv ?? tempDivForFile, applicantData);
      stopLoading();
      return;
    }
    buttonFilder();
    textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    passwordTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    emailTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    numberTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    telTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    urlTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    radioTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    fancyRadiotypeFiller(tempDiv ?? tempDivForFile, applicantData);
    dateTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    checkboxTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
    fileTypeDataFiller(tempDivForFile, applicantData, false);
    await selectDataExtract(tempDiv ?? tempDivForFile, applicantData, false);
    customSelectFiller(tempDiv ?? tempDivForFile, applicantData, false);
    customSelectFiller2(tempDiv ?? tempDivForFile, applicantData, false);

    // handling domain specific condation
    if (
      window.location.href.includes("smartrecruiters") ||
      window.location.href.includes(".ultipro.")
    ) {
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

    // if (launchWork) {
    //   await clickWorkExperienceButton(tempDiv ?? tempDivForFile, applicantData);
    // }
    // if (launcEducation) {
    //   await clickEducationButton(tempDiv ?? tempDivForFile, applicantData);
    // }

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

    if (window.location.href.includes("paycomonline.")) {
      await paycomonline(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".concentrix.")) {
      await concentrix(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".rippling.")) {
      await rippling(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".bamboohr.")) {
      await bamboohr(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".applicantpro.")) {
      await applicantpro(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".cornerstonebuildingbrands.")) {
      await cornerstonebuildingbrands(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".silkroad.")) {
      await silkroad(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".app.loxo.")) {
      await apploxo(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".myomo.")) {
      await myomo(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".sephora.")) {
      await sephora(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".brassring.")) {
      await brassring(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes("jobs.abbott")) {
      await jobsabbott(tempDiv ?? tempDivForFile, applicantData);
    }
    if (window.location.href.includes(".taleo.")) {
      await taleo(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".talemetry.")) {
      await talemetry(tempDiv ?? tempDivForFile, applicantData);
    }

    // careers.gehealthcare a reasearch needed
    if (
      window.location.href.includes(".gehealthcare.") ||
      window.location.href.includes(".fisglobal.") ||
      window.location.href.includes(".ebayinc.") ||
      window.location.href.includes(".freedommortgage.") ||
      window.location.href.includes(".regions.") ||
      window.location.href.includes(".icf.")
    ) {
      await fisglobal(tempDiv ?? tempDivForFile, applicantData);
    }

    if (window.location.href.includes(".ashbyhq.")) {
      // re calling to fill the entire from

      textTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      emailTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      numberTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      telTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      urlTypeDataFiller(tempDiv ?? tempDivForFile, applicantData);
      ashbyhq(tempDiv ?? tempDivForFile, applicantData);
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
