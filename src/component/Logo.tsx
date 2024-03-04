import React from "react";
import { SHOW_PAGE } from "../utils/constant";

const Logo = (props: any) => {
  const { setShowPage, jobFound } = props;
  return (
    <div
      className={`job_circle_button ${jobFound && "ci-shake-logo"}`}
      role="button"
      onClick={() => setShowPage(SHOW_PAGE.summaryPage)}
    >
      {jobFound && <span className="job__post__detected">1</span>}
      <img src={chrome.runtime.getURL("logo.svg")} alt="logo-icon" />
    </div>
  );
};

export default Logo;
