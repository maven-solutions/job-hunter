import React, { useEffect, useState } from "react";
import "./index.css";
import Logo from "../../component/Logo";

import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import { CAREERAI_TOKEN_REF, SHOW_PAGE } from "../../utils/constant";
import { clearStageData } from "../../store/features/JobDetail/JobDetailSlice";

import {
  logoutUser,
  setToken,
  setUser,
} from "../../store/features/Auth/AuthSlice";
import ResumeList from "../../page/resumeList/ResumeList";

import { setResumeResponseToFalse } from "../../store/features/ResumeList/ResumeListSlice";
import useWebsiteDetection from "../../hooks/useWebsiteDetection";

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
  const [autofill, setAutofill] = useState("");
  const currentUrl = window.location.href;

  // Create a URL object
  const urlObj = new URL(currentUrl);

  // Get the 'ciref' parameter
  let cirefValue = urlObj?.searchParams?.get(CAREERAI_TOKEN_REF);

  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });

  const [showIcon, showAutofillPage, showErrorPage] = useWebsiteDetection();

  // TO INCIDATE LOADING IN AUTOFILL
  const startLoading = () => {
    setAutoFilling(true);
  };
  // TO INCIDATE LOADING IN AUTOFILL
  const stopLoading = () => {
    setAutoFilling(false);
  };

  // URL OBSERVER FOR JOB SAVE

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

  // LOGOUT FUNCTION TO CLEAR ALL DATA AND STATE
  const handleLogOut = () => {
    dispatch(clearStageData());
    dispatch(setResumeResponseToFalse());
    dispatch(logoutUser());
    setShowPage("");
  };

  // useGPTButton(window.location.href);

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

      {showPage === SHOW_PAGE.resumeListPage && (
        <ResumeList
          autoFilling={autoFilling}
          setAutoFilling={setAutoFilling}
          setShowPage={setShowPage}
          content={content}
          showPage={showPage}
        />
      )}
    </div>
  );
};

export default JobDetector;
