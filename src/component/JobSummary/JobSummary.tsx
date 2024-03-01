import React from "react";
import "./index.css";
import Height from "../height/Height";

const JobSummary = () => {
  return (
    <div className="ci_job_summary_section">
      <div className="ci_job_summary_heading_section">
        <img
          className="ci_job_comapny_icon"
          src={chrome.runtime.getURL("linkedin.svg")}
          alt="company-icon"
        />
        <div className="ci_job_company_detail_section">
          <h3 className="ci_company_job_title"> Product Manager (Growth)</h3>
          <div className="ci_job_company_detail_row">
            <span className="ci_job_company_name"> Catalyst Innovators</span>
            <span className="ci_job_company_detail_separator"> . </span>
            <span className="ci_job_company_location">
              Alaska, United States
            </span>
          </div>
        </div>
        <img
          className="ci_job_website_icon"
          src={chrome.runtime.getURL("linkedin.svg")}
          alt="company-icon"
        />
      </div>
      <Height height="15" />
      <div className="ci_job_summary_bottm_section">
        <div className="ci_job_worktype_section">
          <img src={chrome.runtime.getURL("job.svg")} alt="company-icon" />
          <span>
            Remote . Full time Enter Level Remote . Full time Enter Level
          </span>
        </div>
        <Height height="10" />
        <div className="ci_job_more_info">
          <img src={chrome.runtime.getURL("company.svg")} alt="company-icon" />
          <span> 1 - 10 Employees , Technology, Information and Internet</span>
        </div>
      </div>{" "}
    </div>
  );
};

export default JobSummary;
