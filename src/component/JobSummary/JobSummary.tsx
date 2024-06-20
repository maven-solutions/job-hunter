import React from "react";
import "./index.css";
import Height from "../height/Height";
import { RootStore, useAppSelector } from "../../store/store";
import CompanySourceLogo from "./CompanySourceLogo";

const JobSummary = () => {
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });
  ("•");
  return (
    <div className="ci_job_summary_section">
      <div className="ci_job_summary_heading_section">
        {jobDetailState.companyLogo && (
          <img
            className="ci_job_comapny_icon"
            src={jobDetailState.companyLogo}
            alt="company-icon"
          />
        )}
        <div className="ci_job_company_detail_section">
          <h3 className="ci_company_job_title"> {jobDetailState?.title}</h3>
          <div className="ci_job_company_detail_row">
            <strong className="ci_job_company_name">
              {jobDetailState?.company}
            </strong>
            <span className="ci_job_company_detail_separator"> . </span>
            <span className="ci_job_company_location">
              {jobDetailState?.location}
            </span>
          </div>
        </div>

        <CompanySourceLogo source={jobDetailState.source} />
      </div>
      <Height height="15" />
      <div className="ci_job_summary_bottm_section">
        {jobDetailState.job_related_info && (
          <div className="ci_job_worktype_section">
            <img src={chrome.runtime.getURL("job.svg")} alt="company-icon" />
            <span>{jobDetailState.job_related_info}</span>
          </div>
        )}
        {jobDetailState.addationlIfo.length > 0 && (
          <>
            <Height height="10" />
            <div className="ci_job_more_info">
              <img
                src={chrome.runtime.getURL("company.svg")}
                alt="company-icon"
              />
              <p>
                {jobDetailState.addationlIfo.map((e, i) => {
                  return (
                    <span key={i}>
                      {" "}
                      {e}{" "}
                      {jobDetailState.addationlIfo.length > i + 1 && (
                        <span className="ci_dot_seperator"> •</span>
                      )}
                    </span>
                  );
                })}
              </p>
            </div>{" "}
          </>
        )}
      </div>{" "}
    </div>
  );
};

export default JobSummary;
