// TODO: content script
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { useDebounce } from "use-debounce";
import "./index.css";
import JobFrom from "./JobFrom";

const App: React.FC<{}> = () => {
  const [showFrom, setShowFrom] = useState<boolean>(false);

  return (
    <div className="content__script__section">
      <div
        className="job_circle_button"
        role="button"
        onClick={() => setShowFrom(!showFrom)}
      >
        <img
          src={chrome.runtime.getURL("icon.png")}
          className="job_circle_button_img"
          alt="logo"
        />
      </div>
      {showFrom && (
        <JobFrom
        // companyName={companyName}
        // setCompanyName={setCompanyName}
        // jobsTitle={jobsTitle}
        // setJobstitle={setJobstitle}
        // companyLocation={companyLocation}
        // setCompanyLocation={setCompanyLocation}
        // postUrl={postUrl}
        // setPostUrl={setPostUrl}
        // targetElementRef={targetElementRef}
        // jobDescription={jobDescription}
        // setJobDescription={setJobDescription}
        />
      )}
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
