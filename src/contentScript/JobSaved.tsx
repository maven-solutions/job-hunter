import React from "react";

const JobSavedNotification = (props: any) => {
  const { setShowJobTrackedAlert } = props;
  return (
    <div
      className="jobs-notification 
          jobs-notification-padding-top-0"
    >
      <div className="jobs-notification-inner jobs-notification-inner-saved">
        <img src={chrome.runtime.getURL("success.svg")} alt="success-icon" />
        <div className="text">
          Your applied job details have been saved successfully!
        </div>
        <button type="button" onClick={() => setShowJobTrackedAlert(false)}>
          <img src={chrome.runtime.getURL("x.svg")} alt="x-icon" />
        </button>
      </div>
    </div>
  );
};

export default JobSavedNotification;
