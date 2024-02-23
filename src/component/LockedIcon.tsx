import React from "react";

const LockedIcon = () => {
  return (
    <img src={chrome.runtime.getURL("lockedicon.svg")} alt="locked-icon" />
  );
};

export default LockedIcon;
