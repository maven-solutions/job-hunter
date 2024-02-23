import React from "react";

const CloseIcon = () => {
  return <img src={chrome.runtime.getURL("closeicon.svg")} alt="close-icon" />;
};

export default CloseIcon;
