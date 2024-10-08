import { useEffect, useState } from "react";
import {
  IFRAME_ISSUE_WEBSITES,
  JOB_SAVING_WEBSITES,
  AUTOFILL_WEBSITES,
} from "./helpers";

const useWebsiteDetection = (): [boolean, boolean, boolean] => {
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [showAutofillPage, setShowAutofillPage] = useState<boolean>(false);
  const [showErrorPage, setShowErrorPage] = useState<boolean>(false);

  const getLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error("No Data found"));
        } else {
          resolve(result[key]); // Resolve with the retrieved value
        }
      });
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const url = window.location.href.toLowerCase();

      // Check if the current URL matches any in the listOfWebsite
      if (AUTOFILL_WEBSITES.some((domain) => url.includes(domain))) {
        setShowIcon(true);
        setShowAutofillPage(true);
      }
    };

    // Execute fetchData and ensure it runs before the rest
    fetchData();
  }, []); // Empty dependency array to run only on mount

  return [showIcon, showAutofillPage, showErrorPage];
};

export default useWebsiteDetection;
