import React from "react";
import { SUPPORTED_WEBSITE } from "../../utils/constant";

const CompanySourceLogo = (props: any) => {
  const { source } = props;
  if (source.toLowerCase() === SUPPORTED_WEBSITE.linkedin) {
    return (
      <img
        className="ci_job_website_icon"
        src={chrome.runtime.getURL("linkedin.svg")}
        alt="company-icon"
      />
    );
  }
  if (source.toLowerCase() === SUPPORTED_WEBSITE.simplyhired) {
    return (
      <img
        className="ci_job_website_icon"
        src={chrome.runtime.getURL("simplyhired.svg")}
        alt="company-icon"
      />
    );
  }
  if (source.toLowerCase() === SUPPORTED_WEBSITE.indeed) {
    return (
      <img
        className="ci_job_website_icon"
        src={chrome.runtime.getURL("indeed.svg")}
        alt="indeed-icon"
      />
    );
  }

  if (source.toLowerCase() === SUPPORTED_WEBSITE.ziprecruiter) {
    return (
      <img
        className="ci_job_website_icon"
        src={chrome.runtime.getURL("ziprecruiter.svg")}
        alt="ziprecruiter-icon"
      />
    );
  }
  if (source.toLowerCase() === SUPPORTED_WEBSITE.dice) {
    return (
      <img
        className="ci_job_website_icon"
        src={chrome.runtime.getURL("dice.svg")}
        alt="dice-icon"
      />
    );
  }
  if (source.toLowerCase() === SUPPORTED_WEBSITE.builtin) {
    return (
      <img
        className="ci_job_website_icon"
        src={chrome.runtime.getURL("builtin.svg")}
        alt="builtin-icon"
      />
    );
  }
  if (source.toLowerCase() === SUPPORTED_WEBSITE.glassdoor) {
    return (
      <img
        className="ci_job_website_icon"
        src={chrome.runtime.getURL("glassdoor.svg")}
        alt="glassdoor-icon"
      />
    );
  }
  return null;
};

export default CompanySourceLogo;