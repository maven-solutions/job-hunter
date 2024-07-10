import React, { useEffect } from "react";
import { LOCALSTORAGE } from "../../utils/constant";
import { concentrix } from "../../landingPage/helper/concentrix";

const useConcentrixObserver = (
  postUrl: string,
  startLoading: () => void,
  stopLoading: () => void
) => {
  useEffect(() => {
    if (window.location.href.includes(".concentrix.")) {
      const localurl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
      if (
        localurl &&
        localurl !== window.location.href &&
        window.location.href.includes("step=")
      ) {
        concentrix(startLoading, stopLoading);
      }
    }
  }, [postUrl]);
};

export default useConcentrixObserver;
