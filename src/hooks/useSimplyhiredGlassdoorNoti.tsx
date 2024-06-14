import React, { useEffect } from "react";
import {
  glassDoorNotiification,
  simplyHiredNotiification,
} from "../component/InfoNotification";
import {
  addButtonToGlassdoorWebsite,
  addButtonToSimplyHired,
} from "../component/CareerAibutton";

const useSimplyhiredGlassdoorNoti = () => {
  useEffect(() => {
    let intervalId: number | undefined;

    const currentUrl = window.location.href;

    const clearExistingInterval = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };

    if (
      currentUrl.includes("glassdoor") &&
      !currentUrl.includes("job-listing")
    ) {
      glassDoorNotiification();
      clearExistingInterval();
      intervalId = window.setInterval(addButtonToGlassdoorWebsite, 2000);
    } else if (currentUrl === "https://www.simplyhired.com/") {
      simplyHiredNotiification();
      clearExistingInterval();
      intervalId = window.setInterval(addButtonToSimplyHired, 3000);
    }

    // Clear the interval when the component unmounts
    return () => {
      clearExistingInterval();
    };
  }, []);
};

export default useSimplyhiredGlassdoorNoti;
