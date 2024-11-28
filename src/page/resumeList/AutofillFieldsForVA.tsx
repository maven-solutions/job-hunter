import React, { useEffect, useState } from "react";

import { detectInputAndFillData } from "../../autofill/helper";
import "./index.css";
import { RootStore, useAppSelector } from "../../store/store";
import {
  AUTOFILL_TOKEN_FROM_CAREERAI,
  CAREERAI_TOKEN_REF,
  LOCALSTORAGE,
} from "../../utils/constant";
import { generatePassword, getHighestEducation, isAdult } from "./helper";
import { useDebounce } from "use-debounce";
import AutofillButton from "./AutofillButton";
import { getDomainName } from "../../utils/helper";
import { saveAudofillJob } from "../../utils/autofillJobSavApi";
import { dataTrackerHandler } from "../../autofill/data.tracker";

const extractInfo = (resumeData, applicationForm, selectedUserId) => {
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
    password,
    address,
    hispanicOrLatino,
  } = applicationForm;

  // Extracting full name, first name, and last name

  const fullName = firstName + " " + lastName;

  const summary = fields?.find((sec) => sec.section === "professional-summary");
  const employment_history = fields?.find(
    (sec) => sec.section === "employment-history"
  );

  // const password = generatePassword(selectedUserId);
  const higher_education = getHighestEducation(education);

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
    hispanic_or_latino: hispanicOrLatino?.value ?? false,
    higher_education: higher_education,
    phone_type: phoneType || "mobile",
    salary: expectedSalaryRange,
    sponsorship_required: false,
    willingToTravel,
    password,
  };
};

const AutofillFieldsForVA = (props: any) => {
  const {
    selectedUserId,
    getUserDetailsById,
    setAutoFilling,
    setIframeUrl,
    selectResumeIndex,
    iframeUrl,
    setShowAddWebsite,
    setShowJobTrackedAlert,
    setErrorINCountSave,
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

  const autofillByContentScript = async () => {
    const url = window.location.href;
    const userdetails = getUserDetailsById(selectedUserId);
    const applicantData = extractInfo(
      userdetails.applicants[selectResumeIndex],
      userdetails.applicationForm,
      selectedUserId
    );
    // console.log("vadata::", applicantData);
    localStorage.setItem(
      LOCALSTORAGE.CI_AUTOFILL_USERINFO,
      JSON.stringify(applicantData)
    );

    localStorage.setItem(LOCALSTORAGE.CI_AUTOFILL_URL, url);
    detectInputAndFillData(
      applicantData,
      startLoading,
      stopLoading,
      setIframeUrl
    );

    let executeDataTracker = true;
    const iframeList: any = document.querySelectorAll("iframe");
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
            executeDataTracker = false;
          }
        }
      }
    }
    if (executeDataTracker) {
      await dataTrackerHandler(setShowJobTrackedAlert, setErrorINCountSave);
    }
  };

  const handleAutofill = () => {
    if (iframeUrl) {
      if (iframeUrl.includes(".greenhouse.")) {
        window.open(
          `${iframeUrl}&${CAREERAI_TOKEN_REF}=${AUTOFILL_TOKEN_FROM_CAREERAI}`,
          "_blank"
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

  const openMissngLink = () => {
    setShowAddWebsite(true);
  };

  return (
    <div className="ci_va_two_button_section">
      {!autoFilling &&
      !iframeUrl &&
      cirefValue !== AUTOFILL_TOKEN_FROM_CAREERAI ? (
        <AutofillButton
          onClick={openMissngLink}
          iframeUrl={iframeUrl}
          resumeList={resumeList}
          addMissingLink
          text="Add Site to Autofill"
        />
      ) : (
        <span />
      )}

      {!autoFilling && (
        <AutofillButton
          onClick={handleAutofill}
          iframeUrl={iframeUrl}
          resumeList={resumeList}
          text={iframeUrl ? "Proceed" : "Auto Fill"}
        />
      )}
    </div>
  );
};

export default AutofillFieldsForVA;
