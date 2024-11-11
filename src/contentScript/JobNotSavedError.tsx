import React from "react";

const JobNotSavedError = (props: any) => {
  const { setShowJobTrackedAlert } = props;
  return (
    <div
      className="jobs-notification 
          jobs-notification-padding-top-0"
    >
      <div
        className="jobs-notification-inner jobs-notification-inner-saved "
        style={{
          border: "1px solid #ff3a29",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        }}
      >
        {/* <img src={chrome.runtime.getURL("waring.svg")} alt="success-icon" /> */}
        <div className="text" style={{ display: "block", marginRight: "10px" }}>
          Autofill completed, but your applied job details could not be saved.
        </div>
        <button type="button" onClick={() => setShowJobTrackedAlert(false)}>
          <img src={chrome.runtime.getURL("x.svg")} alt="x-icon" />
        </button>
      </div>
    </div>
  );
};

export default JobNotSavedError;
