import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./index.css";
import Logo from "../../component/Logo";
import LoginFrom from "../../auth/LoginForm/LoginFrom";
import DisplayJob from "../../page/displayJob/DisplayJob";
import Profile from "../../page/profile/Profile";
import JobDetail from "../../page/jobDetail/JobDetail";
import MenuPopUp from "../../component/menuPopup/MenuPopUp";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  EXTENSION_ACTION,
  SHOW_PAGE,
  SUPPORTED_WEBSITE,
} from "../../utils/constant";
import {
  clearStageData,
  setButtonDisabledFalse,
  setJobReqSucccessFalse,
} from "../../store/features/JobDetail/JobDetailSlice";

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
import { setResumeResponseToFalse } from "../../store/features/ResumeList/ResumeListSlice";
import useWebsiteDetection from "../../hooks/useWebsiteDetection";
import useTrackJobsFromWebsite from "../../hooks/useTrackJobsFromWebsite";
import useSimplyhiredGlassdoorNoti from "../../hooks/useSimplyhiredGlassdoorNoti";
import useWorkDaysObserver from "../../hooks/observer/useWorkDaysObserver";
import usePaylocityObserver from "../../hooks/observer/usePaylocityObserver";
import useMagellanhealthObserver from "../../hooks/observer/useMagellanhealthObserver";
import useURLobserver from "../../hooks/observer/useURLobserver";
import { resumeGPTmainFunction } from "./gpt-resume";
import useHpeObserver from "../../hooks/observer/useHpeObserver";
import useConcentrixObserver from "../../hooks/observer/useConcentrixObserver";
import useZimmerbiometObserver from "../../hooks/observer/useZimmerbiometObserver";
import useFisglobalObserver from "../../hooks/observer/useFisglobalObserver";
import ResumeGptInfoModal from "./GptInfoModal";
import Error from "../../page/Error/Error";
import ResumeListForVA from "../../page/resumeList/ResumeListForVA";

const JobDetector = (props: any) => {
  const { content, popup } = props;
  const [postUrl, setPostUrl] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [showPage, setShowPage] = useState<string>("");
  const [savedNotification, setSavedNotification] = useState(false);
  const [alreadySavedInfo, SetAlreadySavedInfo] = useState<Boolean>(false);
  const [autoFilling, setAutoFilling] = useState<Boolean>(false);
  const [isGenerating, setIsGenerating] = useState<Boolean>(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  console.log("authState::", authState);
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });

  const [showIcon, showAutofillPage, showErrorPage] = useWebsiteDetection();

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

  // TO INCIDATE LOADING IN AUTOFILL
  const startLoading = () => {
    setAutoFilling(true);
  };
  // TO INCIDATE LOADING IN AUTOFILL
  const stopLoading = () => {
    setAutoFilling(false);
  };

  // URL OBSERVER FOR JOB SAVE
  useURLobserver(postUrl, setPostUrl);

  // DOM OBSERVER --- VERY CURISAL HOOKS
  useWorkDaysObserver(postUrl, startLoading, stopLoading);
  usePaylocityObserver(postUrl, startLoading, stopLoading);
  useMagellanhealthObserver(postUrl, startLoading, stopLoading);
  useHpeObserver(postUrl, startLoading, stopLoading);
  useConcentrixObserver(postUrl, startLoading, stopLoading);
  useZimmerbiometObserver(postUrl, startLoading, stopLoading);
  useFisglobalObserver(postUrl, startLoading, stopLoading);

  // TO DISPLAY JOB IS SAVED NOTIFICATION
  useEffect(() => {
    if (jobDetailState.check_job_res_success) {
      SetAlreadySavedInfo(true);
    }
  }, [jobDetailState.check_job_res_success]);

  // LOAD USER FUNCTION TO GET DATA FORM CHROME EXTENSION LOCAL STORAGE
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

  // FETCH ALL APPLICATION STAGE DATA IS USER IS AUTHENTICATED
  useEffect(() => {
    if (authState.authenticated) {
      setShowPage("");
      if (!jobDetailState.stage_data_success) {
        dispatch(getApplicationStageData());
      }
    }
  }, [authState.authenticated]);

  // LOGOUT FUNCTION TO CLEAR ALL DATA AND STATE
  const handleLogOut = () => {
    dispatch(clearStageData());
    dispatch(setResumeResponseToFalse());
    dispatch(logoutUser());
    setShowPage("");
  };

  // FOR LOGIN AND LOGOUT FOMR OUR WEBSITE
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === EXTENSION_ACTION.LOGIN_TO_CI_EXTENSION) {
        loadUser();
      }
      if (message.action === EXTENSION_ACTION.LOGOUT_TO_CI_EXTENSION) {
        handleLogOut();
      }

      if (message.action === EXTENSION_ACTION.OPEN_PROFILE_OF_CI_EXTENSION) {
        console.log("Button was clicked in popup");
        setShowPage(SHOW_PAGE.profilePage);
      }
    });

    // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {});
  }, []);

  useEffect(() => {
    if (window.location.href.includes("chatgpt.")) {
      resumeGPTmainFunction(
        setIsGenerating,
        isGenerating,
        authState,
        setInfoOpen
      );
    }
    setInfoOpen(false);
  }, [window.location.href, isGenerating]);
  // CUSTOM HOOK TO ADD CUSTOM BUTTON ON WEBSITE
  useSimplyhiredGlassdoorNoti();
  useTrackJobsFromWebsite(dispatch, setShowPage);

  return (
    <div className="content__script__section">
      {showIcon && showPage === "" && (
        <Logo
          showAutofillPage={showAutofillPage}
          showErrorPage={showErrorPage}
          setShowPage={setShowPage}
          jobFound={jobDetailState?.jobFound || false}
        />
      )}
      {showPage === SHOW_PAGE.loginPage && (
        <LoginFrom setShowPage={setShowPage} showPage={showPage} />
      )}

      {showPage === SHOW_PAGE.jobDetailPage && (
        <JobDetail setShowPage={setShowPage} showPage={showPage} />
      )}
      {showPage === SHOW_PAGE.summaryPage && (
        <DisplayJob
          setShowPage={setShowPage}
          savedNotification={savedNotification}
          setSavedNotification={setSavedNotification}
          SetAlreadySavedInfo={SetAlreadySavedInfo}
          alreadySavedInfo={alreadySavedInfo}
          showPage={showPage}
        />
      )}

      {showPage === SHOW_PAGE.profilePage && (
        <Profile setShowPage={setShowPage} showPage={showPage} />
      )}
      {/* {showPage === SHOW_PAGE.resumeListPage && (
        <ResumeList
          autoFilling={autoFilling}
          setAutoFilling={setAutoFilling}
          setShowPage={setShowPage}
          content={content}
          showPage={showPage}
        />
      )} */}

      {showPage === SHOW_PAGE.resumeListPage && (
        <ResumeListForVA
          autoFilling={autoFilling}
          setAutoFilling={setAutoFilling}
          setShowPage={setShowPage}
          content={content}
          showPage={showPage}
        />
      )}

      {showPage === SHOW_PAGE.ErrorPage && (
        <Error
          autoFilling={autoFilling}
          setAutoFilling={setAutoFilling}
          setShowPage={setShowPage}
          content={content}
          showPage={showPage}
        />
      )}
      <MenuPopUp setShowPage={setShowPage} showPage={showPage} />

      {website === SUPPORTED_WEBSITE.builtin && (
        <Builtin setShowPage={setShowPage} />
      )}
      {website === SUPPORTED_WEBSITE.glassdoor && (
        <Glassdoor setShowPage={setShowPage} />
      )}
      <ResumeGptInfoModal setInfoOpen={setInfoOpen} infoOpen={infoOpen} />
    </div>
  );
};

export default JobDetector;
