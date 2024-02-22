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
import LockedIcon from "../component/LockedIcon";
import UnLockedIcon from "../component/UnLockedIcon";
// import Select from "@atlaskit/select";

const AllInputField = (props: any) => {
  const {
    inputErrors,
    companyName,
    setCompanyName,
    jobsTitle,
    setJobstitle,
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

  return (
    <>
      <div className="job-detail-grid-container">
        <div className="jdg-title black-title">Job Application Details</div>
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
            <div className="label-top">Company/Easy Apply</div>
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
            {/* <div className="error">{inputErrors.jobType}</div> */}

            {inputErrors.jobType.trim().length ? (
              <div className="error">{inputErrors.jobType}</div>
            ) : (
              ""
            )}
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
                  // onBlur={() => console.log("Editor lost focus")}
                  // onFocus={() => console.log("Editor gained focus")}
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
