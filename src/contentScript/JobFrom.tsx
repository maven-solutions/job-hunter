import React, { useMemo, useRef } from "react";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import InputBox from "../component/InputBox";

const JobFrom = (props: any) => {
  const modules = {
    toolbar: [["bold", "italic", "underline"]],
  };

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

  const style = {
    height: "150px",
  };
  return (
    <div className="job__detail__container">
      <div className="job_detail_header"> Jobs Hunter </div>
      <div className="job_detail_content_section">
        <InputBox
          title="Company"
          value={companyName}
          valueSetter={setCompanyName}
        />
        <InputBox
          title="Job title"
          value={jobsTitle}
          valueSetter={setJobstitle}
        />
        <InputBox
          title="Location"
          value={companyLocation}
          valueSetter={setCompanyLocation}
        />
        <InputBox title="Post Url" value={postUrl} valueSetter={setPostUrl} />
        <div className="job_input_section">
          <span className="job_box_title">Description </span>

          <div className="scrollbar-container">
            <ReactQuill
              theme="snow"
              value={jobDescription}
              onChange={setJobDescription}
              modules={modules}
            />
          </div>
        </div>
      </div>
      <div className="job__detail__footer">
        <button className="job_save_button">Save</button>
      </div>
    </div>
  );
};

export default JobFrom;
