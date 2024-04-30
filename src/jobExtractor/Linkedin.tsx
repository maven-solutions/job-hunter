import { useEffect } from "react";
import { useAppDispatch } from "../store/store";
import {
  clearJobState,
  setJobCompany,
  setJobCompanyLogo,
  setJobDesc,
  setJobFoundStatus,
  setJobLocation,
  setJobPostUrl,
  setJobSource,
  setJobSummary,
  setJobTitle,
  setJobType,
} from "../store/features/JobDetail/JobDetailSlice";

const getAddationalInfo = (dispatch) => {
  let workplacetype: any = document
    .querySelector(".ui-label.ui-label--accent-3.text-body-small")
    .textContent.trim()
    .split(" ");
  workplacetype = workplacetype[workplacetype.length - 1];
  workplacetype = workplacetype.replace(".", " ");

  const jobInsightElement = document.querySelector(
    ".job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight"
  );
  // Get the text content
  const jobInsightText = jobInsightElement.textContent.trim();
  // Extract "worktype position"
  const positionText = jobInsightText.split(".").pop().trim();
  // Split "worktype position" to extract "worktype"
  const positionSplit = positionText.split(" ");
  const worktype = positionSplit.shift(); // Remove and return the first element of the array
  const position = positionSplit.join(" ");

  const secondLiElement = document?.querySelectorAll(
    ".job-details-jobs-unified-top-card__job-insight"
  )[1];
  const secondLiText = secondLiElement?.textContent?.trim() ?? "";

  const firstEle =
    `${workplacetype.trim()} . ${worktype.trim()} . ${position.trim()}` ?? "";

  const imgEle = document.querySelector(
    ".jobs-search-results-list__list-item--active"
  );
  if (imgEle) {
    const img = imgEle.querySelector("img");
    dispatch(setJobCompanyLogo(img?.src));
  }
  dispatch(setJobType(firstEle));
  dispatch(setJobSummary([secondLiText]));
  dispatch(setJobFoundStatus(true));
};
const getContentFromLinkedInJobs = (dispatch): void => {
  try {
    if (!document.querySelector(".jobs-search__job-details--wrapper")) {
      return;
    }

    dispatch(setJobPostUrl(window.location.href));
    const jobsBody = document?.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      dispatch(setJobTitle(jobsBody[0]?.textContent.trim()));
    }

    setTimeout(() => {
      let jobDetailsElement: any = document?.querySelector(
        ".jobs-description__container"
      );
      dispatch(setJobDesc(jobDetailsElement?.innerHTML));
    }, 500);

    // find posted date
    const locationText = document
      .querySelector(
        ".job-details-jobs-unified-top-card__primary-description-without-tagline "
      )
      ?.textContent?.trim()
      ?.split("·")[1]
      .trim();
    if (locationText) {
      dispatch(setJobLocation(locationText));
    }
    getAddationalInfo(dispatch);
    dispatch(setJobSource("Linkedin"));

    // Assuming you have a reference to the DOM element
    setTimeout(() => {
      const domElement = document?.querySelector(
        ".job-details-jobs-unified-top-card__primary-description-without-tagline"
      );
      const aTag = domElement?.querySelector("a.app-aware-link");
      const companyName = aTag?.textContent;
      dispatch(setJobCompany(companyName?.trim()));
    }, 500);
  } catch (error) {
    console.log(error);
  }
};

const Linkedin = (props: any) => {
  const { setShowPage } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    setTimeout(() => {
      getContentFromLinkedInJobs(dispatch);
    }, 2000);
    // setShowPage("");
    // dispatch(clearJobState());
  }, [window.location.href]);
  return null;
};

export default Linkedin;
