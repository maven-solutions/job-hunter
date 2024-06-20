import React, { useEffect } from "react";
import { LOCALSTORAGE } from "../../utils/constant";
import { detectInputAndFillData } from "../../autofill/helper";

const majorChangesDetected = (startLoading: any, stopLoading: any) => {
  //   console.log("major changes dected for");
  const localUrl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
  if (localUrl === window.location.href) {
    const getUser = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_USERINFO);
    const applicantData = JSON.parse(getUser);
    detectInputAndFillData(applicantData, startLoading, stopLoading);
    // console.log("major changes dected for payloycit");
  }
};

const usePaylocityObserver = (
  postUrl: string,
  startLoading: () => void,
  stopLoading: () => void
) => {
  useEffect(() => {
    // Function to observe changes in the specific DOM structure
    function observeProgressBar() {
      const progressBarObserver = new MutationObserver((mutations) => {
        let majorChangeDetected = false;
        mutations.forEach((mutation) => {
          const progressBar = document.querySelector(
            'div[class="row margin-horizontal-none"]'
          );
          if (
            progressBar &&
            (mutation.target === progressBar ||
              progressBar.contains(mutation.target))
          ) {
            majorChangeDetected = true;
          }
        });
        if (majorChangeDetected) {
          majorChangesDetected(startLoading, stopLoading);
        }
      });

      // Start observing the body for changes
      progressBarObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
      });

      // Cleanup function to disconnect the observer when the component unmounts
      return () => {
        progressBarObserver.disconnect();
      };
    }

    // Start observing the specific DOM structure

    if (window.location.href.includes(".paylocity.")) {
      const cleanup = observeProgressBar();
      return cleanup;
    }
  }, [postUrl]);
};

export default usePaylocityObserver;
