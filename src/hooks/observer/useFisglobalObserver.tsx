import React, { useEffect } from "react";
import { LOCALSTORAGE } from "../../utils/constant";
import { repatDetectInputAndFillData } from "../../landingPage/helper/repeat";

const useFisglobalObserver = (
  postUrl: string,
  startLoading: () => void,
  stopLoading: () => void
) => {
  useEffect(() => {
    if (window.location.href.includes(".fisglobal.")) {
      const localurl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
      if (
        localurl &&
        localurl !== window.location.href &&
        window.location.href.includes("step=")
      ) {
        repatDetectInputAndFillData(startLoading, stopLoading);
      }
    }
  }, [postUrl]);
};

export default useFisglobalObserver;
