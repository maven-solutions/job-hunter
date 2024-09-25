import React from "react";
import Height from "../../component/height/Height";

const IframError = (props: any) => {
  const { setIframeUrl } = props;
  return (
    <>
      <Height height="10" />
      <div className="ci_autofill_iframe_error_wrapper">
        <img src={chrome.runtime.getURL("error.svg")} alt="error-icon" />
        <span className="ci_autofill_iframe_error_title">
          Our autofill functionality is not supported on this page
        </span>

        <img
          src={chrome.runtime.getURL("x.svg")}
          className="ci_autfill_error_noit_button"
          alt="x-icon"
          onClick={() => setIframeUrl("")}
        />
      </div>
      <Height height="10" />
    </>
  );
};

export default IframError;
