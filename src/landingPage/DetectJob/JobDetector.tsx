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
  clearStageData,
  setButtonDisabledFalse,
  setJobReqSucccessFalse,
  setSelectedStage,
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
import { setResumeResponseToFalse } from "../../store/features/ResumeList/ResumeListSlice";
import useWebsiteDetection from "../../hooks/useWebsiteDetection";
import { detectInputAndFillData } from "../../autofill/helper";

const JobDetector = (props: any) => {
  const { content, popup } = props;

  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [showAutofillPage, setShowAutofillPage] = useState<boolean>(false);
  const [postUrl, setPostUrl] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [showPage, setShowPage] = useState<string>("");
  const [savedNotification, setSavedNotification] = useState(false);
  const [alreadySavedInfo, SetAlreadySavedInfo] = useState<Boolean>(false);
  const [autoFilling, setAutoFilling] = useState<Boolean>(false);

  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });

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
        ".oraclecloud.",
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
    if (
      [".battelle.", ".oraclecloud."].some((domain) => url.includes(domain))
    ) {
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
  const startLoading = () => {
    setAutoFilling(true);
  };

  const stopLoading = () => {
    setAutoFilling(false);
  };

  function handleMajorDOMChanges() {
    const localUrl = localStorage.getItem("url");
    if (localUrl === window.location.href) {
      const getUser = localStorage.getItem("userinfo");
      const applicantData = JSON.parse(getUser);
      console.log("applicant---automatic------::", applicantData);
      detectInputAndFillData(applicantData, startLoading, stopLoading);
    }
    // Add logic here to handle major changes
  }
  useEffect(() => {
    // Function to remove the element
    function removeAutofillButton() {
      const autofillButton = document.querySelector(
        '[data-automation-id="autofillWithResume"]'
      );
      if (autofillButton) {
        autofillButton.remove();
      }
    }

    // Function to change button text
    function changeButtonText() {
      const manualApplyButton = document.querySelector(
        '[data-automation-id="applyManually"]'
      );
      if (manualApplyButton) {
        manualApplyButton.textContent = "Apply with CareerAI";
      }
    }

    // Function to observe changes in the DOM
    function observeModal() {
      const modalObserver = new MutationObserver((mutations) => {
        let majorChangeDetected = false;
        let modal: any = "";
        let mainContent: any = "";
        let stadlone: any = "";
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            // Check if the modal is added
            modal = document.querySelector(
              '[data-automation-id="wd-popup-frame"]'
            );
            mainContent = document.getElementById("mainContent");
            stadlone = document.querySelector(
              '[data-automation-id="standaloneAdventure"]'
            );
          }
          // Detect major changes by checking added or removed nodes
          const progressBar = document.querySelector(
            '[data-automation-id="progressBar"]'
          );
          if (
            progressBar &&
            (mutation.target === progressBar ||
              progressBar.contains(mutation.target))
          ) {
            majorChangeDetected = true;
          }
        });

        if (modal || mainContent || stadlone) {
          removeAutofillButton();
          changeButtonText();
        }
        if (majorChangeDetected) {
          handleMajorDOMChanges();
        }
      });

      const progressBar = document.querySelector(
        '[data-automation-id="progressBar"]'
      );
      if (progressBar) {
        // Start observing the progressBar for changes
        modalObserver.observe(progressBar, {
          childList: true,
          subtree: true,
        });
      }

      // Start observing the body for changes
      modalObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Cleanup function to disconnect the observer when the component unmounts
      return () => {
        modalObserver.disconnect();
      };
    }

    // Call the function to start observing if the URL contains the specified string
    if (window.location.href.includes("myworkdayjobs.")) {
      const cleanup = observeModal();
      return cleanup;
    }
  }, [postUrl]);

  useEffect(() => {
    if (jobDetailState.check_job_res_success) {
      SetAlreadySavedInfo(true);
    }
  }, [jobDetailState.check_job_res_success]);

  useEffect(() => {
    localStorage.removeItem("url");
    const observer = new MutationObserver(() => {
      const url = window.location.href;
      // chrome.runtime.sendMessage({ action: "urlChange", url });
      if (url !== postUrl) {
        setPostUrl(url);
      }
    });

    // Observe changes in the DOM
    observer.observe(document, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
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
    dispatch(clearStageData());
    dispatch(setResumeResponseToFalse());
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
        <ResumeList
          autoFilling={autoFilling}
          setAutoFilling={setAutoFilling}
          setShowPage={setShowPage}
          content={content}
        />
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
