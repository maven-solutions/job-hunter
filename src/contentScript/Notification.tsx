import React from "react";

const Notification = (props: any) => {
  const {
    notification,
    savedNotification,
    setSavedNotification,
    alreadySavedStatus,
    alreadySavedInfo,
    SetAlreadySavedInfo,
  } = props;
  return (
    <>
      {" "}
      {/* {notification && (
        <div className="jobs-notification">
          <div className="jobs-notification-inner">
            <img src={chrome.runtime.getURL("info.svg")} alt="info-icon" />
            <div className="text">
              Your job details are being saved, thank you for your patience!
            </div>
            <img src={chrome.runtime.getURL("x.svg")} alt="x-icon" />
            <button type="button"></button>
          </div>
        </div>
      )} */}
      {alreadySavedInfo && (
        <div className="jobs-notification">
          <div className="jobs-notification-inner">
            <img src={chrome.runtime.getURL("info.svg")} alt="info-icon" />
            <div className="text">
              This job is alreay saved, please try another one!
            </div>
            <button type="button" onClick={() => SetAlreadySavedInfo(false)}>
              {" "}
              <img src={chrome.runtime.getURL("x.svg")} alt="x-icon" />
            </button>
          </div>
        </div>
      )}
      {!alreadySavedInfo && savedNotification && (
        <div className="jobs-notification">
          <div className="jobs-notification-inner jobs-notification-inner-saved">
            <img
              src={chrome.runtime.getURL("success.svg")}
              alt="success-icon"
            />
            <div className="text">
              Your job details have been saved successfully!
            </div>
            <button type="button" onClick={() => setSavedNotification(false)}>
              <img src={chrome.runtime.getURL("x.svg")} alt="x-icon" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Notification;
