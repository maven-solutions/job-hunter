import React, { useEffect, useState } from "react";

import { detectInputAndFillData } from "../../autofill/helper";
import "./index.css";
import { RootStore, useAppSelector } from "../../store/store";
import {
  AUTOFILL_TOKEN_FROM_CAREERAI,
  CAREERAI_TOKEN_REF,
  EXTENSION_ACTION,
  LOCALSTORAGE,
} from "../../utils/constant";
import { useDebounce } from "use-debounce";
import { getHighestEducation } from "./helper";

const extractInfo = (resumeData, applicationForm) => {
  const { pdfUrl, fields, title, name: applicantName } = resumeData;

  const {
    firstName,
    lastName,
    email,
    userGender,
    dob,
    phoneNumber,
    citizenshipStatus,
    userRace,
    portfolio,
    language,
    userVeteranStatus,
    covidVaccinationStatus,
    disabilityStatus,
    userAuthorizationUsa,
    phoneType,
    zipCode,
    city,
    state,
    country,
    education,
    expectedSalaryRange,
    willingToTravel,
    address,
    hispanicOrLatino,
  } = applicationForm;

  // Extracting full name, first name, and last name

  const fullName = firstName + " " + lastName;

  const summary = fields?.find((sec) => sec.section === "professional-summary");
  const employment_history = fields?.find(
    (sec) => sec.section === "employment-history",
  );

  const higher_education = getHighestEducation(education);

  // Returning the extracted information
  return {
    resume_title: title ?? applicantName,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email_address: email,
    phone_number: phoneNumber,
    address,
    city: city?.label,
    state: state?.label,
    country: country?.label,
    linkedin_url: portfolio.linkedin_url ?? "",
    github_url: portfolio.github_url ?? "",
    portfolio_url: portfolio.portfolio_url ?? "",
    zip_code: zipCode,
    pdf_url: pdfUrl,
    education: education,
    employment_history: employment_history.data ?? null,
    professional_summary: summary?.data?.description ?? null,
    gender: userGender?.label,
    dob,
    citizenship_status: citizenshipStatus,
    race: userRace?.label,
    language,
    veteran_status: userVeteranStatus?.value,
    covid_vaccination_status: covidVaccinationStatus,
    disability_status: Number(disabilityStatus),
    is_over_18: true,
    us_work_authoriztaion: userAuthorizationUsa,
    higher_education: higher_education,
    hispanic_or_latino: hispanicOrLatino?.value ?? false,
    phone_type: phoneType || "mobile",
    salary: expectedSalaryRange,
    sponsorship_required: false,
    willingToTravel,
  };
};

const AutofillFields = (props: any) => {
  const {
    selectedResume,
    content,
    setAutoFilling,
    setIframeUrl,
    iframeUrl,
    autoFilling,
  } = props;

  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });

  const startLoading = () => {
    setAutoFilling(true);
  };

  const stopLoading = () => {
    setAutoFilling(false);
  };

  const autofillByContentScript = () => {
    const url = window.location.href;
    const applicantData = extractInfo(
      resumeList.applicantData[selectedResume].applicant,
      resumeList.applicantData[selectedResume].applicationForm,
    );
    // console.log("applicantData::", applicantData);
    localStorage.setItem(
      LOCALSTORAGE.CI_AUTOFILL_USERINFO,
      JSON.stringify(applicantData),
    );
    localStorage.setItem(LOCALSTORAGE.CI_AUTOFILL_URL, url);

    detectInputAndFillData(
      applicantData,
      startLoading,
      stopLoading,
      setIframeUrl,
    );
  };

  const handleAutofill = () => {
    if (iframeUrl) {
      if (iframeUrl.includes(".greenhouse.")) {
        window.open(
          `${iframeUrl}&${CAREERAI_TOKEN_REF}=${AUTOFILL_TOKEN_FROM_CAREERAI}`,
          "_blank",
        );
      } else {
        window.open(iframeUrl, "_blank");
      }
    } else {
      autofillByContentScript();
    }
  };

  const [autofill, setAutofill] = useState("");
  const currentUrl = window.location.href;

  const urlObj = new URL(currentUrl);
  // Get the 'ciref' parameter
  let cirefValue = urlObj?.searchParams?.get(CAREERAI_TOKEN_REF);
  useEffect(() => {
    if (cirefValue === AUTOFILL_TOKEN_FROM_CAREERAI) {
      setAutofill(cirefValue);
    }
  }, [cirefValue]);

  const [debouncedSearchTerm] = useDebounce(autofill, 3000);

  useEffect(() => {
    if (debouncedSearchTerm === AUTOFILL_TOKEN_FROM_CAREERAI) {
      autofillByContentScript();
    }
  }, [debouncedSearchTerm]);

  const wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const captureVisibleTab = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: EXTENSION_ACTION.CAPTURE_VISIBLE_TAB },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response?.success || !response?.dataUrl) {
            reject(new Error(response?.error || "Capture failed"));
            return;
          }
          resolve(response.dataUrl);
        },
      );
    });
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image"));
      image.src = src;
    });
  };

  const handleScreenshot = async () => {
    const scrollElement =
      document.scrollingElement || document.documentElement || document.body;
    const originalX = window.scrollX;
    const originalY = window.scrollY;

    try {
      const fullWidth = Math.max(
        scrollElement.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        window.innerWidth,
      );
      const fullHeight = Math.max(
        scrollElement.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight,
      );

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const stitchedCanvas = document.createElement("canvas");
      stitchedCanvas.width = fullWidth;
      stitchedCanvas.height = fullHeight;
      const ctx = stitchedCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context unavailable");
      }

      for (let y = 0; y < fullHeight; y += viewportHeight) {
        window.scrollTo(0, y);
        await wait(350);

        const dataUrl = await captureVisibleTab();
        const screenshot = await loadImage(dataUrl);

        const sliceHeight = Math.min(viewportHeight, fullHeight - y);
        const scaleX = screenshot.width / viewportWidth;
        const scaleY = screenshot.height / viewportHeight;

        ctx.drawImage(
          screenshot,
          0,
          0,
          Math.round(viewportWidth * scaleX),
          Math.round(sliceHeight * scaleY),
          0,
          y,
          viewportWidth,
          sliceHeight,
        );
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = stitchedCanvas.toDataURL("image/png");
      downloadLink.download = `careerai-fullpage-${Date.now()}.png`;
      downloadLink.click();
    } catch (error) {
      console.error("Unable to capture full-page screenshot:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to capture full-page screenshot on this page.";
      alert(`Unable to capture full-page screenshot: ${message}`);
    } finally {
      window.scrollTo(originalX, originalY);
    }
  };

  return (
    <div className="ci_va_two_button_section">
      <span />
      <div className="ext__autofill__fields__wrapper">
        <div className="autofill__btn__wrapper">
          {!autoFilling && (
            <button
              className={`autofill__btn ${
                resumeList.res_success ? "" : "autofill__button__disable"
              }`}
              onClick={() => handleAutofill()}
              disabled={resumeList.res_success ? false : true}
            >
              {/* Auto Fill */}
              {iframeUrl ? "Proceed" : "Auto Fill"}
            </button>
          )}
          <button
            className={`screenshot__btn `}
            onClick={() => handleScreenshot()}
          >
            Screeshot
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutofillFields;
