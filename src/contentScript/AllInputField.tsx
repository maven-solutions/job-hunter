import React, { useState } from "react";
import {
  BtnBold,
  BtnItalic,
  Editor,
  EditorProvider,
  Toolbar,
  BtnUnderline,
} from "react-simple-wysiwyg";

import InputBox from "../component/InputBox";

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
    source,
    setSource,
  } = props;

  const setDescValue = (e: any) => {
    if (e.target.value) {
      setJobDescription(e.target.value);
    }
  };

  return (
    <>
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
