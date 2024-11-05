import { JOB_TRACK_FOR_MULTIPLE_CLICK } from "../hooks/helpers";
import { saveAudofillJob } from "../utils/autofillJobSavApi";
import { LOCALSTORAGE } from "../utils/constant";
import { getDomainName } from "../utils/helper";

const dataTracker = async () => {
  const data = {
    source: getDomainName(),
    url: window.location.href,
  };
  await saveAudofillJob(data);
};

export const dataTrackerHandler = async (setShowJobTrackedAlert) => {
  // handle my workdays condation
  if (
    window.location.href.includes(".myworkdayjobs.") &&
    !window.location.href.includes("login")
  ) {
    const localurl = localStorage.getItem(LOCALSTORAGE.JOB_APPLIED);
    if (localurl !== window.location.href) {
      try {
        await dataTracker();
        setShowJobTrackedAlert(true);
      } catch (error) {
        setShowJobTrackedAlert(false);
      }
    }
    localStorage.setItem(LOCALSTORAGE.JOB_APPLIED, window.location.href);
    return;
  }

  // careers.gehealthcare a reasearch needed
  if (
    window.location.href.includes(".gehealthcare.") ||
    window.location.href.includes(".fisglobal.") ||
    window.location.href.includes(".ebayinc.") ||
    window.location.href.includes(".freedommortgage.") ||
    window.location.href.includes(".regions.") ||
    window.location.href.includes(".icf.")
  ) {
    const localurl = localStorage.getItem(LOCALSTORAGE.JOB_APPLIED);
    if (localurl !== window.location.href) {
      try {
        await dataTracker();
        setShowJobTrackedAlert(true);
      } catch (error) {
        setShowJobTrackedAlert(false);
      }
    }
    localStorage.setItem(LOCALSTORAGE.JOB_APPLIED, window.location.href);
    return;
  }

  if (window.location.href.includes(".concentrix.")) {
  }

  if (window.location.href.includes(".hpe.")) {
  }

  if (window.location.href.includes(".magellanhealth.")) {
  }

  if (window.location.href.includes("zimmerbiomet")) {
  }

  // Check if the current URL matches any in the listOfWebsite
  const url = window.location.href.toLowerCase();

  if (!JOB_TRACK_FOR_MULTIPLE_CLICK.some((domain) => url.includes(domain))) {
    try {
      await dataTracker();
      setShowJobTrackedAlert(true);
    } catch (error) {
      setShowJobTrackedAlert(false);
    }
  }

  // try {
  //   await dataTracker();
  //   setShowJobTrackedAlert(true);
  // } catch (error) {
  //   setShowJobTrackedAlert(false);
  // }
};
