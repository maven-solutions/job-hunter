import React, { useEffect, useState } from "react";

import {
  clearLocalStorageData,
  detectInputAndFillData,
} from "../../autofill/helper";
import "./index.css";
import { RootStore, useAppSelector } from "../../store/store";

const extractInfo = (resumeData, applicationForm) => {
  const {
    name,
    emailAddress,
    // phoneNumber,
    city,
    state,
    country,
    webLinks,
    zipCode,
    pdfUrl,
    fields,
  } = resumeData;

  const {
    gender,
    dob,
    phoneNumber,
    citizenshipStatus,
    race,
    language,
    veteranStatus,
    covidVaccinationStatus,
    disabilityStatusForExtension,
    userAuthorizationUsa,
    userAuthorizationCanada,
    phoneType,
    degree,
    fieldOfStudy,
    education,
    expectedSalaryRange,
  } = applicationForm;

  // console.log("applicationForm::", applicationForm);

  // Extracting full name, first name, and last name
  const [first_name, last_name] =
    name && typeof name === "string" && name.includes(" ")
      ? name.split(" ")
      : [name, ""];

  const full_name = name;

  // Extracting website and LinkedIn URL
  const linkedin_url =
    webLinks?.find((link) => link.name.includes("linkedin"))?.name || "";

  // Extracting address
  const address = `${city?.label}, ${state?.label}`;
  // const education = fields?.find((sec) => sec.section === "education");
  const summary = fields?.find((sec) => sec.section === "professional-summary");
  const employment_history = fields?.find(
    (sec) => sec.section === "employment-history"
  );

  const isAdult = (dateOfBirth: string): boolean => {
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
    full_name,
    first_name,
    last_name,
    email_address: emailAddress,
    phone_number: phoneNumber,
    address,
    city: city?.label,
    state: state?.label,
    country: country?.label,
    linkedin_url,
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
  };
};

const AutofillFields = (props: any) => {
  const { selectedResume, content } = props;
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });

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
    // console.log("applicantData---", applicantData);
    detectInputAndFillData(applicantData);
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
        {/* <button className="logout__btn" onClick={logoutUser}>
          <LogOut /> Logout
        </button> */}
      </div>
    </div>
  );
};

export default AutofillFields;
