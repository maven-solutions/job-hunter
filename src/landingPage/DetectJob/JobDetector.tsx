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
import {
  EXTENSION_ACTION,
  SHOW_PAGE,
  SUPPORTED_WEBSITE,
} from "../../utils/constant";
import {
  setButtonDisabledFalse,
  setJobFoundStatus,
  setJobReqSucccessFalse,
} from "../../store/features/JobDetail/JobDetailSlice";
import SimplyHiredJob from "../../jobExtractor/SimplyHired";
import Dice from "../../jobExtractor/Dice";
import Indeed from "../../jobExtractor/Indeed";
import Ziprecruiter from "../../jobExtractor/Ziprecuriter";
import Builtin from "../../jobExtractor/Builtin";
import Glassdoor from "../../jobExtractor/Glassdoor";
import {
  logoutUser,
  setToken,
  setUser,
} from "../../store/features/Auth/AuthSlice";
import ResumeList from "../../page/resumeList/ResumeList";
import { detectInputAndFillData } from "../../autofill/helper";
import { chekJobExists } from "../../store/features/JobDetail/JobApi";

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

  // console.log("authstate::", authState);

  // useEffect(() => {
  //   if (popup) {
  //     console.log("popupfired2::");
  //     setShowIcon(true);
  //   }
  // }, [popup]);
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
        "localhost",
      ].some((domain) => window.location.href.includes(domain))
    ) {
      setShowIcon(true);
    }
  }, []);

  useEffect(() => {
    if (
      window.location.href.toLowerCase().includes("job") ||
      window.location.href.toLowerCase().includes("apply") ||
      window.location.href.toLowerCase().includes("career") ||
      window.location.href.toLowerCase().includes("work") ||
      window.location.href.toLowerCase().includes("placement")
    ) {
      setShowIcon(true);
      // setShowAutofillPage(true);
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
  useEffect(() => {
    chrome.runtime.onMessage.addListener(async function (
      request,
      sender,
      sendResponse
    ) {
      if (request.message === "updateFields") {
        detectInputAndFillData(request.data);
      }
    });
  }, []);

  return (
    <div className="content__script__section">
      {showIcon ? (
        <Logo
          showAutofillPage={showAutofillPage}
          setShowPage={setShowPage}
          jobFound={jobDetailState?.jobFound || false}
        />
      ) : null}
      {showPage === SHOW_PAGE.loginPage && (
        <LoginFrom setShowPage={setShowPage} />
      )}
      {showPage === SHOW_PAGE.singupPage && (
        <SignupForm setShowPage={setShowPage} />
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
    </div>
  );
};

export default JobDetector;
