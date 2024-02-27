import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import JobFrom from "./JobFrom";
import Logo from "../component/Logo";

import {
  glassDoorNotiification,
  simplyHiredNotiification,
} from "../component/InfoNotification";
import {
  addButtonToGlassdoorWebsite,
  addButtonToSimplyHired,
} from "../component/CareerAibutton";

const App: React.FC<{}> = () => {
  const [showFrom, setShowFrom] = useState<boolean>(false);
  const [showIcon, setShowIcon] = useState<boolean>(false);

  useEffect(() => {
    if (
      [
        "linkedin",
        "indeed",
        "dice",
        "ziprecruiter",
        "glassdoor",
        "simplyhired",
        "builtin",
      ].some((domain) => window.location.href.includes(domain))
    ) {
      setShowIcon(true);
    }
  }, []);

  useEffect(() => {
    let intervalId: any = "";

    if (
      window.location.href.includes("glassdoor") &&
      !window.location.href.includes("job-listing")
    ) {
      glassDoorNotiification();
      // Clear any existing intervals before setting a new one
      intervalId = setInterval(addButtonToGlassdoorWebsite, 3000);
    }

    if (window.location.href === "https://www.simplyhired.com/") {
      simplyHiredNotiification();
      intervalId = setInterval(addButtonToSimplyHired, 3000);
    }
    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="content__script__section">
      {showIcon ? (
        <div
          className="job_circle_button"
          role="button"
          onClick={() => setShowFrom(!showFrom)}
        >
          <Logo />
        </div>
      ) : null}
      {showFrom && <JobFrom setShowForm={setShowFrom} />}
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
