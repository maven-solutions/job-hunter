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
    disabilityStatusForExtension,
    userAuthorizationUsa,
    phoneType,
    zipCode,
    city,
    state,
    country,
    education,
    expectedSalaryRange,
    willingToTravel,
  } = applicationForm;

  // console.log("education::", education);

  // Extracting full name, first name, and last name

  const fullName = firstName + " " + lastName;

  const address = `${city?.label}, ${state?.label}`;

  const summary = fields?.find((sec) => sec.section === "professional-summary");
  const employment_history = fields?.find(
    (sec) => sec.section === "employment-history"
  );

  const isOver18: boolean = isAdult(dob);
  // Returning the extracted information

  const password = generatePassword(selectedUserId);
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
    disability_status: disabilityStatusForExtension,
    is_over_18: true,
    us_work_authoriztaion: userAuthorizationUsa,
    hispanic_or_latino: false,
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
    const userdetails = getUserDetailsById(selectedUserId);
    const applicantData = extractInfo(
      userdetails.applicants[selectResumeIndex],
      userdetails.applicationForm,
      selectedUserId
    );
    console.log("vadata::", applicantData);
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
  };

  const handleAutofill = (addMissingLink) => {
    console.log("addMissingLink::", addMissingLink);
    if (iframeUrl) {
      window.open(
        `${iframeUrl}&${CAREERAI_TOKEN_REF}=${AUTOFILL_TOKEN_FROM_CAREERAI}`,
        "_blank"
      );
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
      {!iframeUrl && cirefValue !== AUTOFILL_TOKEN_FROM_CAREERAI ? (
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

      <AutofillButton
        onClick={handleAutofill}
        iframeUrl={iframeUrl}
        resumeList={resumeList}
        text={iframeUrl ? "Proceed" : "Auto Fill"}
      />
    </div>
  );
};

export default AutofillFieldsForVA;
