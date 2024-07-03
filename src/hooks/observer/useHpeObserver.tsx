import React, { useEffect } from "react";
import { LOCALSTORAGE } from "../../utils/constant";
import { hpe } from "../../landingPage/helper/hpe";

const useHpeObserver = (
  postUrl: string,
  startLoading: () => void,
  stopLoading: () => void
) => {
  useEffect(() => {
    if (window.location.href.includes(".hpe.")) {
      const localurl = localStorage.getItem(LOCALSTORAGE.CI_AUTOFILL_URL);
      if (
        localurl &&
        localurl !== window.location.href &&
        window.location.href.includes("step=")
      ) {
        hpe(startLoading, stopLoading);
      }
    }
  }, [postUrl]);
};

export default useHpeObserver;
