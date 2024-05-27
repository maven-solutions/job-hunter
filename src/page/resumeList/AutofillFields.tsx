import React, { useEffect, useState } from "react";

import {
  clearLocalStorageData,
  detectInputAndFillData,
} from "../../autofill/helper";
import "./index.css";
import { RootStore, useAppSelector } from "../../store/store";

const extractInfo = (resumeData, applicationForm) => {
  const { pdfUrl, fields, title, name: applicantName } = resumeData;

  const {
    firstName,
    lastName,
    email,
    gender,
    dob,
    phoneNumber,
    citizenshipStatus,
    race,
    portfolio,
    language,
    veteranStatus,
    covidVaccinationStatus,
    disabilityStatusForExtension,
    userAuthorizationUsa,
    userAuthorizationCanada,
    phoneType,
    zipCode,
    city,
    state,
    country,
    education,
    expectedSalaryRange,
  } = applicationForm;

  // console.log("applicationForm::", applicationForm);

  // Extracting full name, first name, and last name

  const fullName = firstName + lastName;

  const address = `${city?.label}, ${state?.label}`;

  const summary = fields?.find((sec) => sec.section === "professional-summary");
  const employment_history = fields?.find(
    (sec) => sec.section === "employment-history"
  );

  const isAdult = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) {
      return false;
    }
    const dob: Date = new Date(dateOfBirth);
    const today: Date = new Date();
    const age: number = today.getFullYear() - dob.getFullYear();
    const monthDiff: number = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  const isOver18: boolean = isAdult(dob);
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
    gender,
    dob,
    citizenship_status: citizenshipStatus,
    race,
    language,
    veteran_status: veteranStatus,
    covid_vaccination_status: covidVaccinationStatus,
    disability_status: disabilityStatusForExtension,
    is_over_18: isOver18,
    us_work_authoriztaion: userAuthorizationUsa,
    canada_work_authoriztaion: userAuthorizationCanada,
    phone_type: phoneType,
    salary: expectedSalaryRange,
    sponsorship_required: false,
  };
};

const AutofillFields = (props: any) => {
  const { selectedResume, content, setAutoFilling } = props;

  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });

  const startLoading = () => {
    setAutoFilling(true);
  };

  const stopLoading = () => {
    setAutoFilling(false);
  };
  const autofillByPopUp = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {
        message: "updateFields",
        data: extractInfo(
          resumeList.applicantData[selectedResume].applicant,
          resumeList.applicantData[selectedResume].applicationForm
        ),
      });
    });
  };

  const logoutUser = () => {
    clearLocalStorageData("login_token");
    // updateUserLoginState(false);
  };

  const autofillByContentScript = () => {
    const applicantData = extractInfo(
      resumeList.applicantData[selectedResume].applicant,
      resumeList.applicantData[selectedResume].applicationForm
    );
    console.log("applicantData---", applicantData);
    detectInputAndFillData(applicantData, startLoading, stopLoading);
  };

  const handleAutofill = () => {
    if (content) {
      autofillByContentScript();
    } else {
      autofillByPopUp();
    }
  };

  return (
    <div className={`ext__autofill__fields__wrapper `}>
      <div className={`autofill__btn__wrapper  `}>
        <button
          className={`autofill__btn ${resumeList.res_success ? "" : "disable"}`}
          onClick={() => handleAutofill()}
          disabled={resumeList.res_success ? false : true}
        >
          Auto Fill
        </button>
      </div>
    </div>
  );
};

export default AutofillFields;
