import React, { useEffect } from "react";
import { LOCALSTORAGE } from "../../utils/constant";
import {
  changeMyWorkdaysButtonText,
  handleMajorDOMChangesInMyworkdays,
  removeMyWorkdaysAutofillButton,
} from "../../landingPage/helper/myworkdays";

const useWorkDaysObserver = (
  postUrl: string,
  startLoading: () => void,
  stopLoading: () => void
) => {
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

    // Call the function to start observing if the URL contains the specified string
    if (window.location.href.includes("myworkdayjobs.")) {
      const cleanup = observeModal();
      return cleanup;
    }

    // if (window.location.href.includes(".magellanhealth.")) {
    //   const localurl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
    //   if (
    //     localurl &&
    //     localurl !== window.location.href &&
    //     window.location.href.includes("step=")
    //   ) {
    //     handleMajorDOMChangesManagehealth(startLoading, stopLoading);
    //   }
    // }
  }, [postUrl]);
};

export default useWorkDaysObserver;
