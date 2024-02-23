import React from "react";

const Logo = () => {
  return <img src={chrome.runtime.getURL("logo.svg")} alt="logo-icon" />;
};

export default Logo;
