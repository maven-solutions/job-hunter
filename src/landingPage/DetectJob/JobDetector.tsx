import React, { useEffect, useState } from "react";
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
  LOCALSTORAGE,
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
import {
  changeMyWorkdaysButtonText,
  handleMajorDOMChangesInMyworkdays,
  removeMyWorkdaysAutofillButton,
} from "../helper/myworkdays";
import useTrackJobsFromWebsite from "../../hooks/useTrackJobsFromWebsite";
import useSimplyhiredGlassdoorNoti from "../../hooks/useSimplyhiredGlassdoorNoti";
import { handleMajorDOMChangesManagehealth } from "../helper/magellanhealth";

const JobDetector = (props: any) => {
  const { content, popup } = props;
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

  const [showIcon, showAutofillPage] = useWebsiteDetection();

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

  useEffect(() => {
    localStorage.removeItem(LOCALSTORAGE.CI_AUTOFILL_URL);
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

  const majorChangesDetected = () => {
    console.log("major changes dected for");

    const localUrl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
    if (localUrl === window.location.href) {
      const getUser = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_USERINFO);
      const applicantData = JSON.parse(getUser);
      // detectInputAndFillData(applicantData, startLoading, stopLoading);
      console.log("major changes dected for payloycit");
    }
  };

  useEffect(() => {
    // Function to observe changes in the DOM
    function observeModal() {
      const modalObserver = new MutationObserver((mutations) => {
        let majorChangeDetected = false;
        let workdaysButtonChanged = false;

        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            // Check if specific elements are added to the DOM
            const modal = document.querySelector(
              '[data-automation-id="wd-popup-frame"]'
            );
            const mainContent = document.getElementById("mainContent");
            const stadlone = document.querySelector(
              '[data-automation-id="standaloneAdventure"]'
            );
            if (modal || mainContent || stadlone) {
              workdaysButtonChanged = true;
            }
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

        if (workdaysButtonChanged) {
          removeMyWorkdaysAutofillButton();
          changeMyWorkdaysButtonText();
        }
        if (majorChangeDetected) {
          handleMajorDOMChangesInMyworkdays(startLoading, stopLoading);
        }
      });

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

    function observePaylocity() {
      const progressBarObserver = new MutationObserver((mutations) => {
        let majorChangeDetected = false;
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "style"
          ) {
            const target = mutation.target as HTMLElement;
            if (
              target.classList.contains("current-step") ||
              target.classList.contains("progress")
            ) {
              majorChangeDetected = true;
            }
          } else if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              if (
                node.nodeType === Node.ELEMENT_NODE &&
                (node as HTMLElement).classList.contains("bar")
              ) {
                const currentStep = (node as HTMLElement).querySelector(
                  ".current-step"
                );
                const progress = (node as HTMLElement).querySelector(
                  ".progress"
                );
                if (currentStep || progress) {
                  majorChangeDetected = true;
                }
              }
            });
          }
        });
        if (majorChangeDetected) {
          majorChangesDetected();
        }
      });

      // Start observing the body for changes
      progressBarObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // Cleanup function to disconnect the observer when the component unmounts
      return () => {
        progressBarObserver.disconnect();
      };
    }

    if (window.location.href.includes(".paylocity.")) {
      const cleanup = observePaylocity();
      return cleanup;
    }
  }, [postUrl]);
  // useEffect(() => {
  //   // Function to observe changes in the specific DOM structure
  //   function observeProgressBar() {
  //     const progressBarObserver = new MutationObserver((mutations) => {
  //       let majorChangeDetected = false;
  //       mutations.forEach((mutation) => {
  //         if (
  //           mutation.type === "attributes" &&
  //           mutation.attributeName === "style"
  //         ) {
  //           const target = mutation.target as HTMLElement;
  //           if (
  //             target.classList.contains("current-step") ||
  //             target.classList.contains("progress")
  //           ) {
  //             majorChangeDetected = true;
  //           }
  //         } else if (mutation.type === "childList") {
  //           mutation.addedNodes.forEach((node) => {
  //             if (
  //               node.nodeType === Node.ELEMENT_NODE &&
  //               (node as HTMLElement).classList.contains("bar")
  //             ) {
  //               const currentStep = (node as HTMLElement).querySelector(
  //                 ".current-step"
  //               );
  //               const progress = (node as HTMLElement).querySelector(
  //                 ".progress"
  //               );
  //               if (currentStep || progress) {
  //                 majorChangeDetected = true;
  //               }
  //             }
  //           });
  //         }
  //       });
  //       if (majorChangeDetected) {
  //         majorChangesDetected();
  //       }
  //     });

  //     // Start observing the body for changes
  //     progressBarObserver.observe(document.body, {
  //       childList: true,
  //       subtree: true,
  //       attributes: true,
  //       attributeFilter: ["style"],
  //     });

  //     // Cleanup function to disconnect the observer when the component unmounts
  //     return () => {
  //       progressBarObserver.disconnect();
  //     };
  //   }

  //   // Start observing the specific DOM structure
  //   const cleanup = observeProgressBar();
  //   return cleanup;
  // }, [postUrl]);

  useEffect(() => {
    if (jobDetailState.check_job_res_success) {
      SetAlreadySavedInfo(true);
    }
  }, [jobDetailState.check_job_res_success]);

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

  useSimplyhiredGlassdoorNoti();
  useTrackJobsFromWebsite(dispatch, setShowPage);

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
