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
  return null;
};

export default CompanySourceLogo;
