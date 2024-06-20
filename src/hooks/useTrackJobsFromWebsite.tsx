import { useEffect, useState } from "react";
import { getContentFromLinkedInJobs } from "../jobExtractor/Linkedin";
import { getJobsFromIndeed } from "../jobExtractor/Indeed";
import { getJobsFromDice } from "../jobExtractor/Dice";
import { getJobFromZipRecruiter } from "../jobExtractor/Ziprecuriter";
import { getJobFromSimplyhired } from "../jobExtractor/SimplyHired";
import { clearJobState } from "../store/features/JobDetail/JobDetailSlice";

const useTrackJobsFromWebsite = (dispatch: any, setShowPage: any) => {
  //   const [showPage, setShowPage] = useState("");

  useEffect(() => {
    if (window.location.href.includes("linkedin.")) {
      setTimeout(() => {
        getContentFromLinkedInJobs(dispatch);
      }, 2000);
    }
    if (window.location.href.includes("indeed.")) {
      setTimeout(() => {
        getJobsFromIndeed(dispatch);
      }, 2000);
    }

    if (
      window.location.href.includes("dice.") &&
      window.location.href.includes("job-detail")
    ) {
      setTimeout(() => {
        getJobsFromDice(dispatch);
      }, 2000);
    }

    if (window.location.href.includes("ziprecruiter.")) {
      setTimeout(() => {
        getJobFromZipRecruiter(dispatch);
      }, 2000);
    }

    if (window.location.href.includes("simplyhired.")) {
      setTimeout(() => {
        getJobFromSimplyhired(dispatch);
      }, 2000);
    }
    setShowPage("");
    dispatch(clearJobState());
  }, [window.location.href, dispatch]);

  //   return showPage;
};

export default useTrackJobsFromWebsite;
