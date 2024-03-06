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
import { SHOW_PAGE, SUPPORTED_WEBSITE } from "../../utils/constant";
import { setJobFoundStatus } from "../../store/features/JobDetail/JobDetailSlice";
import SimplyHiredJob from "../../jobExtractor/SimplyHired";
import Dice from "../../jobExtractor/Dice";
import Indeed from "../../jobExtractor/Indeed";
import Ziprecruiter from "../../jobExtractor/Ziprecuriter";
import Builtin from "../../jobExtractor/Builtin";
import Glassdoor from "../../jobExtractor/Glassdoor";
import { setToken, setUser } from "../../store/features/Auth/AuthSlice";

const JobDetector = () => {
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [postUrl, setPostUrl] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [showPage, setShowPage] = useState<string>("");

  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });
  console.log("auth---", authState);
  const loadUser = () => {
    chrome.storage.local.get(["ci_user"]).then((result) => {
      dispatch(setUser(JSON.parse(result.ci_user)));
    });
    chrome.storage.local.get(["ci_token"]).then((result) => {
      dispatch(setToken(JSON.parse(result.ci_token)));
    });
  };

  useEffect(() => {
    if (authState.authenticated) {
      setShowPage("");
    }
  }, [authState.authenticated]);

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
      setWebsite(SUPPORTED_WEBSITE.linkedin);
    }
    if (window.location.href.includes("simplyhired.")) {
      setWebsite(SUPPORTED_WEBSITE.simplyhired);
    }

    if (
      window.location.href.includes("dice.") &&
      window.location.href.includes("job-detail")
    ) {
      setWebsite(SUPPORTED_WEBSITE.dice);
    }
    if (window.location.href.includes("indeed.")) {
      setWebsite(SUPPORTED_WEBSITE.indeed);
    }
    if (window.location.href.includes("ziprecruiter.")) {
      setWebsite(SUPPORTED_WEBSITE.ziprecruiter);
    }
    if (window.location.href.includes("builtin.")) {
      setWebsite(SUPPORTED_WEBSITE.builtin);
    }

    if (
      window.location.href.includes("glassdoor.") &&
      window.location.href.includes("job-listing")
    ) {
      setWebsite(SUPPORTED_WEBSITE.glassdoor);
    }

    loadUser();
  }, [postUrl]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const url = window.location.href;
      // chrome.runtime.sendMessage({ action: "urlChange", url });
      if (url !== postUrl) {
        setPostUrl(url);
      }
    });

    // Observe changes in the DOM
    observer.observe(document, { childList: true, subtree: true });
  }, []);

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
          setShowPage={setShowPage}
          jobFound={jobDetailState?.jobFound || false}
        />
      ) : null}

      {/* <LoginFrom setShowPage={setShowPage} /> */}

      {/* <SignupForm setShowForm={setShowFrom} /> */}

      {showPage === SHOW_PAGE.loginPage && (
        <LoginFrom setShowPage={setShowPage} />
      )}

      {showPage === SHOW_PAGE.singupPage && (
        <SignupForm setShowPage={setShowPage} />
      )}

      <MenuPopUp setShowPage={setShowPage} />
      {website === SUPPORTED_WEBSITE.linkedin && (
        <Linkedin setShowPage={setShowPage} />
      )}

      {website === SUPPORTED_WEBSITE.simplyhired && (
        <SimplyHiredJob setShowPage={setShowPage} />
      )}
      {website === SUPPORTED_WEBSITE.dice && <Dice setShowPage={setShowPage} />}
      {website === SUPPORTED_WEBSITE.indeed && (
        <Indeed setShowPage={setShowPage} />
      )}
      {website === SUPPORTED_WEBSITE.ziprecruiter && (
        <Ziprecruiter setShowPage={setShowPage} />
      )}

      {website === SUPPORTED_WEBSITE.builtin && (
        <Builtin setShowPage={setShowPage} />
      )}

      {website === SUPPORTED_WEBSITE.glassdoor && (
        <Glassdoor setShowPage={setShowPage} />
      )}

      {showPage === SHOW_PAGE.jobDetailPage && (
        <JobDetail setShowPage={setShowPage} />
      )}
      {showPage === SHOW_PAGE.summaryPage && (
        <DisplayJob setShowPage={setShowPage} />
      )}

      {showPage === SHOW_PAGE.profilePage && (
        <Profile setShowPage={setShowPage} />
      )}
    </div>
  );
};

export default JobDetector;
