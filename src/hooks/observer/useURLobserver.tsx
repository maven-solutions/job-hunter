import React, { useEffect } from "react";
import { LOCALSTORAGE } from "../../utils/constant";

const useURLobserver = (postUrl: string, setPostUrl: any) => {
  useEffect(() => {
    localStorage.removeItem(LOCALSTORAGE.CI_AUTOFILL_URL);
    localStorage.removeItem(LOCALSTORAGE.JOB_APPLIED);
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
};

export default useURLobserver;
