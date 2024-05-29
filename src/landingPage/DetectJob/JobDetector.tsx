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
import LoginFrom from "../../auth/LoginForm/LoginFrom";

import DisplayJob from "../../page/displayJob/DisplayJob";
import Profile from "../../page/profile/Profile";
import JobDetail from "../../page/jobDetail/JobDetail";
import MenuPopUp from "../../component/menuPopup/MenuPopUp";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import { getContentFromLinkedInJobs } from "../../jobExtractor/Linkedin";
import {
  EXTENSION_ACTION,
  SHOW_PAGE,
  SUPPORTED_WEBSITE,
} from "../../utils/constant";
import {
  clearJobState,
  setButtonDisabledFalse,
  setJobReqSucccessFalse,
} from "../../store/features/JobDetail/JobDetailSlice";
import { getJobFromSimplyhired } from "../../jobExtractor/SimplyHired";
import { getJobsFromDice } from "../../jobExtractor/Dice";
import { getJobsFromIndeed } from "../../jobExtractor/Indeed";

import Builtin from "../../jobExtractor/Builtin";
import Glassdoor from "../../jobExtractor/Glassdoor";
import {
  logoutUser,
  setToken,
  setUser,
} from "../../store/features/Auth/AuthSlice";
import ResumeList from "../../page/resumeList/ResumeList";
import {
  chekJobExists,
  getApplicationStageData,
} from "../../store/features/JobDetail/JobApi";
import { getJobFromZipRecruiter } from "../../jobExtractor/Ziprecuriter";

const JobDetector = (props: any) => {
  const { content, popup } = props;
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [showAutofillPage, setShowAutofillPage] = useState<boolean>(false);
  const [postUrl, setPostUrl] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [showPage, setShowPage] = useState<string>("");
  const [savedNotification, setSavedNotification] = useState(false);
  const [alreadySavedInfo, SetAlreadySavedInfo] = useState<Boolean>(false);

  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });
  // console.log("job:slice::", jobDetailState);

  // // setShowAutofillPage(true);

  useEffect(() => {}, []);

  // useEffect(() => {
  //   if (
  //     [
  //       "job",
  //       "apply",
  //       "career",
  //       "carees",
  //       "work",
  //       "placement",
  //       ".adp.",
  //       "services",
  //       ".services.",
  //       "peoplehr.",
  //       ".ebayinc.",
  //       ".myworkdayjobs.",
  //       ".paylocity.",
  //       "motionrecruitment.",
  //       ".lever.",
  //       ".icims.",
  //       "techfetch.",
  //       ".tal.",
  //       ".fisglobal.",
  //       ".jobdiva.",
  //       ".pinpointhq.",
  //       ".teds.",
  //       ".entertimeonline.",
  //       ".dayforcehcm.",
  //       ".cisco.",
  //       ".jobvite.",
  //       ".pinkertonhr.",
  //       "jackhenry.",
  //       ".clearcompany.",
  //       ".ashbyhq.",
  //       ".zohorecruit.",
  //       ".successfactors.",
  //       ".greenhouse.",
  //       // ".pinpointhq.",
  //       // "hhstechgroup.",
  //     ].some((domain) => window.location.href.toLowerCase().includes(domain))
  //   ) {
  //     setShowIcon(true);
  //     setShowAutofillPage(true);
  //   }

  //   if (
  //     [
  //       "linkedin.",
  //       "indeed.",
  //       "dice.",
  //       "ziprecruiter.",
  //       "glassdoor.",
  //       "simplyhired.",
  //       "builtin.",
  //       "localhost",
  //     ].some((domain) => window.location.href.toLowerCase().includes(domain))
  //   ) {
  //     setShowIcon(true);
  //     setShowAutofillPage(false);
  //   }
  // }, []);

  useEffect(() => {
    const url = window.location.href.toLowerCase();

    if (
      [
        "job",
        "apply",
        "career",
        "carees",
        "work",
        "placement",
        ".adp.",
        "services",
        ".services.",
        "peoplehr.",
        ".ebayinc.",
        ".myworkdayjobs.",
        ".paylocity.",
        "motionrecruitment.",
        ".lever.",
        ".icims.",
        "techfetch.",
        ".tal.",
        ".fisglobal.",
        ".jobdiva.",
        ".pinpointhq.",
        ".teds.",
        ".entertimeonline.",
        ".dayforcehcm.",
        ".cisco.",
        ".jobvite.",
        ".pinkertonhr.",
        "jackhenry.",
        ".clearcompany.",
        ".ashbyhq.",
        ".zohorecruit.",
        ".successfactors.",
        ".greenhouse.",
      ].some((domain) => url.includes(domain))
    ) {
      setShowIcon(true);
      setShowAutofillPage(true);
    }

    if (
      [
        "linkedin.",
        "indeed.",
        "dice.",
        "ziprecruiter.",
        "glassdoor.",
        "simplyhired.",
        "builtin.",
        "localhost",
      ].some((domain) => url.includes(domain))
    ) {
      setShowIcon(true);
      setShowAutofillPage(false);
    }

    // some extra case
    if ([".battelle."].some((domain) => url.includes(domain))) {
      setShowIcon(true);
      setShowAutofillPage(true);
    }
  }, []);

  useEffect(() => {
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
    dispatch(setButtonDisabledFalse());
    setSavedNotification(false);
    SetAlreadySavedInfo(false);
    dispatch(setJobReqSucccessFalse());
    if (authState.authenticated) {
      dispatch(chekJobExists({ jobLink: window.location.href }));
    }
  }, [postUrl]);

  useEffect(() => {
    if (jobDetailState.check_job_res_success) {
      SetAlreadySavedInfo(true);
    }
  }, [jobDetailState.check_job_res_success]);

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
  const loadUser = () => {
    chrome.storage.local.get(["ci_user"]).then((result) => {
      const data = result.ci_user;
      dispatch(setUser(data));
    });
    chrome.storage.local.get(["ci_token"]).then((result: any) => {
      const data = result.ci_token;
      dispatch(setToken(data));
    });
  };

  useEffect(() => {
    if (authState.authenticated) {
      setShowPage("");
      if (!jobDetailState.stage_data_success) {
        dispatch(getApplicationStageData());
      }
    }
  }, [authState.authenticated]);
  // console.log("authState::", authState);
  const handleLogOut = () => {
    dispatch(logoutUser());
    setShowPage("");
  };
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // console.log("date message::", message);
      if (message.action === EXTENSION_ACTION.LOGIN_TO_CI_EXTENSION) {
        loadUser();
      }
      if (message.action === EXTENSION_ACTION.LOGOUT_TO_CI_EXTENSION) {
        handleLogOut();
      }
      // return true;
    });
  }, []);
  // useEffect(() => {
  //   chrome.runtime.onMessage.addListener(async function (
  //     request,
  //     sender,
  //     sendResponse
  //   ) {
  //     if (request.message === "updateFields") {
  //       // detectInputAndFillData(request.data);
  //     }
  //   });
  // }, []);

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

  useEffect(() => {
    if (window.location.href.includes("linkedin.")) {
      setTimeout(() => {
        getContentFromLinkedInJobs(dispatch);
      }, 2000);
    }
    if (window.location.href.includes("indeed.")) {
      setTimeout(() => {
        getJobsFromIndeed(dispatch);
      }, 2000);
    }

    if (
      window.location.href.includes("dice.") &&
      window.location.href.includes("job-detail")
    ) {
      setTimeout(() => {
        getJobsFromDice(dispatch);
      }, 2000);
    }

    if (window.location.href.includes("ziprecruiter.")) {
      setTimeout(() => {
        getJobFromZipRecruiter(dispatch);
      }, 2000);
    }

    if (window.location.href.includes("simplyhired.")) {
      setTimeout(() => {
        getJobFromSimplyhired(dispatch);
      }, 2000);
    }
    setShowPage("");
    dispatch(clearJobState());
  }, [window.location.href]);

  return (
    <div className="content__script__section">
      {showIcon && showPage === "" && (
        <Logo
          showAutofillPage={showAutofillPage}
          setShowPage={setShowPage}
          jobFound={jobDetailState?.jobFound || false}
        />
      )}
      {showPage === SHOW_PAGE.loginPage && (
        <LoginFrom setShowPage={setShowPage} />
      )}

      {showPage === SHOW_PAGE.jobDetailPage && (
        <JobDetail setShowPage={setShowPage} />
      )}
      {showPage === SHOW_PAGE.summaryPage && (
        <DisplayJob
          setShowPage={setShowPage}
          savedNotification={savedNotification}
          setSavedNotification={setSavedNotification}
          SetAlreadySavedInfo={SetAlreadySavedInfo}
          alreadySavedInfo={alreadySavedInfo}
        />
      )}

      {showPage === SHOW_PAGE.profilePage && (
        <Profile setShowPage={setShowPage} />
      )}
      {showPage === SHOW_PAGE.resumeListPage && (
        <ResumeList setShowPage={setShowPage} content={content} />
      )}
      <MenuPopUp setShowPage={setShowPage} />
      {/* {website === SUPPORTED_WEBSITE.linkedin && (
        <Linkedin setShowPage={setShowPage} />
      )} */}

      {/* {website === SUPPORTED_WEBSITE.dice && <Dice setShowPage={setShowPage} />} */}

      {website === SUPPORTED_WEBSITE.builtin && (
        <Builtin setShowPage={setShowPage} />
      )}
      {website === SUPPORTED_WEBSITE.glassdoor && (
        <Glassdoor setShowPage={setShowPage} />
      )}
    </div>
  );
};

export default JobDetector;
