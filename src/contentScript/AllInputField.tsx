import React from "react";
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
  } = props;
  const setDescValue = (e: any) => {
    if (e.target.value) {
      setJobDescription(e.target.value);
    }
  };
  return (
    <div className="job_detail_content_section">
      <InputBox
        title="Company"
        value={companyName}
        valueSetter={setCompanyName}
        name="company"
      />
      <InputBox
        title="Job title"
        value={jobsTitle}
        valueSetter={setJobstitle}
        name="jobtitle"
      />
      <InputBox
        title="Location"
        value={companyLocation}
        valueSetter={setCompanyLocation}
        name="location"
      />
      <InputBox title="Post Url" value={postUrl} valueSetter={setPostUrl} />
      <div className="job_input_section">
        <span className="job_box_title">Description </span>
        <div className="scrollbar-container">
          <EditorProvider>
            <Editor value={jobDescription ?? ""} onChange={setDescValue}>
              <Toolbar>
                <BtnBold />
                <BtnItalic />
                <BtnUnderline />
              </Toolbar>
            </Editor>
          </EditorProvider>
        </div>
      </div>
    </div>
  );
};

export default AllInputField;
