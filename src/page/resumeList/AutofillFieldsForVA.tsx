import React from "react";

import { detectInputAndFillData } from "../../autofill/helper";
import "./index.css";
import { RootStore, useAppSelector } from "../../store/store";
import { LOCALSTORAGE } from "../../utils/constant";

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

  const fullName = firstName + " " + lastName;

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
    is_over_18: true,
    us_work_authoriztaion: userAuthorizationUsa,
    hispanic_or_latino: false,
    phone_type: phoneType,
    salary: expectedSalaryRange,
    sponsorship_required: false,
  };
};

const AutofillFieldsForVA = (props: any) => {
  const {
    selectedUserIndex,
    content,
    setAutoFilling,
    setShowIframeErrorWarning,
    selectResumeIndex,
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
      resumeList.applicantData[selectedUserIndex].applicants[selectResumeIndex],
      resumeList.applicantData[selectedUserIndex].applicationForm
    );
    console.log("applicant::", applicantData);
    localStorage.setItem(
      LOCALSTORAGE.CI_AUTOFILL_USERINFO,
      JSON.stringify(applicantData)
    );
    localStorage.setItem(LOCALSTORAGE.CI_AUTOFILL_URL, url);
    detectInputAndFillData(
      applicantData,
      startLoading,
      stopLoading,
      setShowIframeErrorWarning
    );
  };

  const handleAutofill = () => {
    autofillByContentScript();
  };

  return (
    <div className="ext__autofill__fields__wrapper">
      <div className="autofill__btn__wrapper">
        <button
          className={`autofill__btn ${
            resumeList.res_success ? "" : "autofill__button__disable"
          }`}
          onClick={() => handleAutofill()}
          disabled={resumeList.res_success ? false : true}
        >
          Auto Fill
        </button>
      </div>
    </div>
  );
};

export default AutofillFieldsForVA;
