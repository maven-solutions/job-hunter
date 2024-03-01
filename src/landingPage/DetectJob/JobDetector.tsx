import React, { useEffect, useState } from "react";
import "./index.css";
import {
  glassDoorNotiification,
  simplyHiredNotiification,
} from "../../component/InfoNotification";
import {
  addButtonToGlassdoorWebsite,
  addButtonToSimplyHired,
} from "../../component/CareerAibutton";
import Logo from "../../component/Logo";
import JobFrom from "../../contentScript/JobFrom";
import LoginFrom from "../../auth/LoginForm/LoginFrom";
import SignupForm from "../../auth/signup/Signup";
import DisplayJob from "../../page/displayJob/DisplayJob";

const JobDetector = () => {
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
        <Logo showFrom={showFrom} setShowFrom={setShowFrom} jobFound />
      ) : null}
      {/* {showFrom && <JobFrom setShowForm={setShowFrom} />} */}
      {/* <LoginFrom setShowForm={setShowFrom} /> */}
      {/* <SignupForm setShowForm={setShowFrom} /> */}
      <DisplayJob />
    </div>
  );
};

export default JobDetector;
