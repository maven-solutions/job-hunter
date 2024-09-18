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
      const newUrl: any = await getLocalStorage("newUrl");
      const url = window.location.href.toLowerCase();

      // Push the newUrl to the list if it exists
      if (newUrl) {
        AUTOFILL_WEBSITES.push(newUrl);
      }

      // Check if the current URL matches any in the listOfWebsite
      if (AUTOFILL_WEBSITES.some((domain) => url.includes(domain))) {
        setShowIcon(true);
        setShowAutofillPage(true);
      }

      // Handle domain-specific logic for certain platforms
      const pathurl = window.location.href.toLocaleLowerCase();
      const splitted = pathurl.split("/");
      if (splitted && splitted.length > 2) {
        const currentWebURL = splitted[2];
        if (
          JOB_SAVING_WEBSITES.some((domain) => currentWebURL.includes(domain))
        ) {
          setShowIcon(true);
          setShowAutofillPage(false);
        }
      }

      // Check for iframe issue domains and show the error page if necessary
      if (IFRAME_ISSUE_WEBSITES.some((domain) => url.includes(domain))) {
        setShowIcon(true);
        setShowAutofillPage(false);
        setShowErrorPage(true);
      }
    };

    // Execute fetchData and ensure it runs before the rest
    fetchData();
  }, []); // Empty dependency array to run only on mount

  return [showIcon, showAutofillPage, showErrorPage];
};

export default useWebsiteDetection;
