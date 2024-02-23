import React from "react";

const UnLockedIcon = () => {
  return (
    <img src={chrome.runtime.getURL("unlockicon.svg")} alt="unlockicon-icon" />
  );
};

export default UnLockedIcon;
