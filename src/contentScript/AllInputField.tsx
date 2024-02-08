import React, { useState } from "react";
import {
  BtnBold,
  BtnItalic,
  Editor,
  EditorProvider,
  Toolbar,
  BtnUnderline,
} from "react-simple-wysiwyg";
import Select from "react-select";

import InputBox from "../component/InputBox";
import { getUsaCityList, getUsaStateList } from "../constants/usaCountryData";
// import Select from "@atlaskit/select";

const AllInputField = (props: any) => {
  const {
    inputErrors,
    companyName,
    setCompanyName,
    jobsTitle,
    setJobstitle,
    companyLocation,
    setCompanyLocation,
    postUrl,
    setPostUrl,
    jobDescription,
    setJobDescription,
    postedDate,
    setPostedDate,
    jobType,
    setJobType,
    category,
    setCategory,
    source,
    setSource,
    locked,
    setLocked,
    jobDetails,
    setJobDetails,
    companyInfo,
    setCompanyInfo,
    skills,
    setSkills,
    employment,
    setEmployment,
    state,
    setState,
    city,
    setCity,
    easyApply,
    setEasyApply,
  } = props;

  const setDescValue = (e: any) => {
    if (e.target.value) {
      setJobDescription(e.target.value);
    }
  };
  const options = [
    { value: "Product Owner", label: "Product Owner" },
    { value: "Scrum Master", label: "Scrum Master" },
    { value: "Project Manager", label: "Project Manager" },
    { value: "Business Analyst", label: "Business Analyst" },
  ];
  const employmentOptions = [
    { value: "part-time", label: "Part-time" },
    { value: "full-time", label: "Full-time" },
    { value: "contract", label: "Contract" },
  ];
  const stateOptions = [
    { value: "Omaha", label: "Omaha" },
    { value: "Naperville", label: "Naperville" },
    { value: "New York", label: "New York" },
  ];
  const cityOptions = [
    { value: "Milbury", label: "Milbury" },
    { value: "Newville", label: "Newville" },
    { value: "Huntsville", label: "Huntsville" },
  ];
  const jobTypeOptions = [
    { value: "remote", label: "Remote" },
    { value: "on-site", label: "On-site" },
    { value: "hybrid", label: "Hybrid" },
  ];

  const easyApplyOptions = [
    { value: 1, label: "Easy Apply" },
    { value: 0, label: "Company" },
  ];
  const LockedIcon = () => {
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.11111 4.55667H1.88889C1.39797 4.55667 1 4.95464 1 5.44556V8.55667C1 9.04759 1.39797 9.44556 1.88889 9.44556H8.11111C8.60203 9.44556 9 9.04759 9 8.55667V5.44556C9 4.95464 8.60203 4.55667 8.11111 4.55667Z"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M2.77789 4.55668V2.7789C2.77734 2.22781 2.98157 1.69618 3.35095 1.2872C3.72032 0.878223 4.22849 0.621083 4.77678 0.565699C5.32508 0.510315 5.8744 0.660639 6.3181 0.987488C6.7618 1.31434 7.06823 1.79439 7.17789 2.33446"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    );
  };
  const UnLockedIcon = () => {
    return (
      <svg
        width="10"
        height="11"
        viewBox="0 0 10 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.11111 5H1.88889C1.39797 5 1 5.39797 1 5.88889V9C1 9.49092 1.39797 9.88889 1.88889 9.88889H8.11111C8.60203 9.88889 9 9.49092 9 9V5.88889C9 5.39797 8.60203 5 8.11111 5Z"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M2.77777 5V3.22222C2.77777 2.63285 3.0119 2.06762 3.42864 1.65087C3.84539 1.23413 4.41062 1 4.99999 1C5.58936 1 6.15459 1.23413 6.57134 1.65087C6.98809 2.06762 7.22222 2.63285 7.22222 3.22222V5"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    );
  };
  return (
    <>
      <div className="job-detail-grid-container">
        <div className="jdg-title">Job Application Details</div>
        <div className="job-detail-grid">
          <label htmlFor="category">
            <div className="label-top">
              Category<span className="star">*</span>
              {locked ? (
                <div
                  onClick={() => {
                    setLocked(!locked);
                    localStorage.setItem(
                      "lock_status",
                      JSON.stringify(!locked)
                    );
                  }}
                  className="lock locked"
                >
                  <LockedIcon />
                </div>
              ) : (
                <div
                  onClick={() => {
                    setLocked(!locked);
                    localStorage.setItem(
                      "lock_status",
                      JSON.stringify(!locked)
                    );
                  }}
                  className="lock unlocked"
                >
                  <UnLockedIcon />
                </div>
              )}
            </div>
            <Select
              options={options}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  fontSize: 14,
                  padding: "-2px 10px",
                  borderRadius: "5px",
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: 14,
                  background: state.isSelected ? "#4339f2" : "#white",
                }),
              }}
              value={category}
              defaultValue={null}
              placeholder="Select category"
              onChange={(option) => {
                setLocked(false);
                setCategory(option);
                localStorage.setItem("categoryOption", JSON.stringify(option));
              }}
            />
            {inputErrors.category.trim().length ? (
              <div className="error">{inputErrors.category}</div>
            ) : (
              ""
            )}
          </label>
          <label htmlFor="category">
            <div className="label-top">
              Easy Apply<span className="star">*</span>
            </div>
            <Select
              options={easyApplyOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  fontSize: 14,
                  padding: "-2px 10px",
                  borderRadius: "5px",
                  width: "100%",
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: 14,
                  background: state.isSelected ? "#4339f2" : "#white",
                  border: state.isFocused ? "1px solid #4339f2" : "none",
                }),
              }}
              value={easyApply}
              defaultValue={{ label: "Select Dept", value: 1 }}
              placeholder="Select easy apply"
              onChange={(option) => {
                setEasyApply(option);
                // localStorage.setItem("stateOption", JSON.stringify(option));
              }}
            />
            {inputErrors.easyApply.trim().length ? (
              <div className="error">{inputErrors.easyApply}</div>
            ) : (
              ""
            )}
          </label>
          <label htmlFor="category">
            <div className="label-top">State</div>
            <Select
              options={getUsaStateList()}
              isSearchable={true}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,

                  fontSize: 14,
                  padding: "-2px 10px",
                  borderRadius: "5px",
                  width: "100%",
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: 14,
                  background: state.isSelected ? "#4339f2" : "#white",
                  border: state.isFocused ? "1px solid #4339f2" : "none",
                }),
              }}
              value={state}
              placeholder="Select a state"
              onChange={(option) => {
                console.log({ option });
                setState(option);
                // localStorage.setItem("stateOption", JSON.stringify(option));
              }}
            />
          </label>
          <label htmlFor="category">
            <div className="label-top">City</div>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              isSearchable={true}
              filterOption={(option, inputValue) =>
                option.label.toLowerCase().includes(inputValue.toLowerCase())
              }
              options={getUsaCityList(state?.value)}
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  fontSize: 14,

                  padding: "-2px 10px",
                  borderRadius: "5px",
                  width: "100%",
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: 14,
                  background: state.isSelected ? "#4339f2" : "#white",
                }),
              }}
              value={city}
              defaultValue={null}
              placeholder="Select a city"
              onChange={(option) => {
                setCity(option);
                // localStorage.setItem("stateOption", JSON.stringify(option));
              }}
            />
          </label>
          <label htmlFor="category">
            <div className="label-top">
              Employment<span className="star">*</span>
            </div>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={employmentOptions}
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  fontSize: 14,

                  padding: "-2px 10px",
                  borderRadius: "5px",
                  width: "100%",
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: 14,
                  background: state.isSelected ? "#4339f2" : "#white",
                }),
              }}
              value={employment}
              defaultValue={null}
              placeholder="Select employment"
              onChange={(option) => {
                setEmployment(option);
                localStorage.setItem(
                  "employmentOption",
                  JSON.stringify(option)
                );
              }}
            />
            <div className="error">{inputErrors.employment}</div>
          </label>
          <label htmlFor="category">
            <div className="label-top">
              Job Type<span className="star">*</span>
            </div>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={jobTypeOptions}
              isSearchable={true}
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,

                  fontSize: 14,
                  padding: "-2px 10px",
                  borderRadius: "5px",
                  width: "100%",
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: 14,
                  background: state.isSelected ? "#4339f2" : "#white",
                  border: "none",
                }),
              }}
              value={jobType}
              defaultValue={null}
              placeholder="Select job type"
              onChange={(option) => {
                setJobType(option);
                localStorage.setItem("jobTypeOption", JSON.stringify(option));
              }}
            />
            <div className="error">{inputErrors.jobType}</div>
          </label>
        </div>
      </div>
      <div style={{ height: "5px" }} />
      <div className="job-detail-grid-container">
        <div className="jdg-title">Job Listing Details</div>
        <div className="job-detail-grid">
          <InputBox
            title="Job title"
            value={jobsTitle}
            valueSetter={setJobstitle}
            name="jobtitle"
          />
          <InputBox
            title="Company"
            value={companyName}
            valueSetter={setCompanyName}
            name="company"
          />

          <InputBox
            title="Source"
            value={source}
            valueSetter={setSource}
            name="source"
          />
          <InputBox
            title="Posted On"
            value={postedDate}
            valueSetter={setPostedDate}
            name="posteddate"
          />
          <div className="full">
            <InputBox
              title="Post Url"
              value={postUrl}
              valueSetter={setPostUrl}
              name="posturl"
            />
          </div>
          <div className="full">
            <label>
              <div className="label-top">Description</div>
              <EditorProvider>
                <Editor
                  value={jobDescription ?? ""}
                  onChange={setDescValue}
                  onBlur={() => console.log("Editor lost focus")}
                  onFocus={() => console.log("Editor gained focus")}
                >
                  {/* <Toolbar /> */}
                  <Toolbar>
                    <BtnBold />
                    <BtnItalic />
                    <BtnUnderline />
                  </Toolbar>
                </Editor>
              </EditorProvider>
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default AllInputField;
