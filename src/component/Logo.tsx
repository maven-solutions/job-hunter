import React from "react";

const Logo = (props: any) => {
  const { showFrom, setShowFrom, jobFound } = props;
  return (
    <div
      className="job_circle_button ci-shake-logo"
      role="button"
      onClick={() => setShowFrom(!showFrom)}
    >
      <span className="job__post__detected">1</span>
      <img src={chrome.runtime.getURL("logo.svg")} alt="logo-icon" />
    </div>
  );
};

export default Logo;
