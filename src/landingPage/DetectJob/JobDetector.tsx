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
import Profile from "../../page/profile/Profile";
import JobDetail from "../../page/jobDetail/JobDetail";
import MenuPopUp from "../../component/menuPopup/MenuPopUp";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import Linkedin from "../../jobExtractor/Linkedin";

const JobDetector = () => {
  const [showFrom, setShowFrom] = useState<boolean>(false);
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [postUrl, setPostUrl] = useState<string>("");
  const [website, setWebsite] = useState<string>("");

  const dispatch = useAppDispatch();
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });

  console.log("jobDetailState---", jobDetailState);

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
    if (window.location.href.includes("linkedin.")) {
      // setPostUrl() b
      // <Linkedin />;
      // getContentFromLinkedInJobs(
      //   setPostUrl,
      //   setJobstitle,
      //   setJobDescription,
      //   setLocation,
      //   setSource,
      //   setCompanyName,
      //   setAddationalInfo
      // );
      setWebsite("linkedin");
    }
  }, [postUrl]);

  useEffect(() => {
    let intervalId: any = "";

    // if (
    //   window.location.href.includes("glassdoor") &&
    //   !window.location.href.includes("job-listing")
    // ) {
    //   glassDoorNotiification();
    //   // Clear any existing intervals before setting a new one
    //   intervalId = setInterval(addButtonToGlassdoorWebsite, 3000);
    // }

    // if (window.location.href === "https://www.simplyhired.com/") {
    //   simplyHiredNotiification();
    //   intervalId = setInterval(addButtonToSimplyHired, 3000);
    // }
    // // Clear the interval when the component unmounts
    // return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="content__script__section">
      {showIcon ? (
        <Logo
          showFrom={showFrom}
          setShowFrom={setShowFrom}
          jobFound={jobDetailState?.jobFound || false}
        />
      ) : null}
      {/* {showFrom && <JobFrom setShowForm={setShowFrom} />} */}
      {/* <LoginFrom setShowForm={setShowFrom} /> */}
      {/* <SignupForm setShowForm={setShowFrom} /> */}
      {/* <DisplayJob setShowForm={setShowFrom} /> */}
      {/* <Profile setShowForm={setShowFrom} /> */}
      {/* <JobDetail setShowForm={setShowFrom} /> */}
      {/* <MenuPopUp /> */}
      {website === "linkedin" && <Linkedin />}
    </div>
  );
};

export default JobDetector;
