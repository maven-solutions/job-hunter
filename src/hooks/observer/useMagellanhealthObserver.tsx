import React, { useEffect } from "react";
import { LOCALSTORAGE } from "../../utils/constant";
import { handleMajorDOMChangesManagehealth } from "../../landingPage/helper/magellanhealth";

const useMagellanhealthObserver = (
  postUrl: string,
  startLoading: () => void,
  stopLoading: () => void
) => {
  useEffect(() => {
    if (window.location.href.includes(".magellanhealth.")) {
      const localurl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
      if (
        localurl &&
        localurl !== window.location.href &&
        window.location.href.includes("step=")
      ) {
        handleMajorDOMChangesManagehealth(startLoading, stopLoading);
      }
    }
  }, [postUrl]);
};

export default useMagellanhealthObserver;
