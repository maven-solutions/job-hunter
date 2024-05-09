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
  // let workplacetype: any =
  //   document
  //     .querySelector(".ui-label.ui-label--accent-3.text-body-small")
  //     ?.textContent?.trim()
  //     ?.split(" ") ?? "";

  // if (workplacetype) {
  //   workplacetype = workplacetype[workplacetype?.length - 1];
  //   workplacetype = workplacetype?.replace(".", " ");
  // }

  // const jobInsightElement = document.querySelector(
  //   ".job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight"
  // );

  const jobInsightElement = document.querySelector(
    ".job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight"
  );
  const jobInsightText =
    jobInsightElement?.querySelector("span")?.textContent?.trim() ?? "";

  let workplacetype: string | null = null;
  let worktype: string | null = null;
  let position: string | null = null;
  // for workplace

  if (jobInsightText.toLocaleLowerCase().includes("remote")) {
    workplacetype = "Remote";
  } else if (jobInsightText.toLocaleLowerCase().includes("hybrid")) {
    workplacetype = "Hybrid";
  } else if (jobInsightText.toLocaleLowerCase().includes("on-site")) {
    workplacetype = "Onsite";
  }

  // for jobtype
  if (jobInsightText.toLocaleLowerCase().includes("full-time")) {
    worktype = "Full-time";
  } else if (jobInsightText.toLocaleLowerCase().includes("part-time")) {
    worktype = "Part-time";
  } else if (jobInsightText.toLocaleLowerCase().includes("contract")) {
    worktype = "Contract";
  } else if (jobInsightText.toLocaleLowerCase().includes("temporary")) {
    worktype = "Temporary";
  } else if (jobInsightText.toLocaleLowerCase().includes("volunteer")) {
    worktype = "Volunteer";
  } else if (jobInsightText.toLocaleLowerCase().includes("internship")) {
    worktype = "Internship";
  } else if (jobInsightText.toLocaleLowerCase().includes("other")) {
    worktype = "Other";
  }
  // for experience

  if (jobInsightText.toLocaleLowerCase().includes("internship")) {
    position = "Internship";
  } else if (jobInsightText.toLocaleLowerCase().includes("entry level")) {
    position = "Entry level";
  } else if (jobInsightText.toLocaleLowerCase().includes("associate")) {
    position = "Associate";
  } else if (jobInsightText.toLocaleLowerCase().includes("mid-senior")) {
    position = "Mid-Senior level";
  } else if (jobInsightText.toLocaleLowerCase().includes("director")) {
    position = "Director";
  } else if (jobInsightText.toLocaleLowerCase().includes("executive")) {
    position = "Executive";
  }

  // // Get the text content
  // const jobInsightText = jobInsightElement?.textContent?.trim();
  // // Extract "worktype position"
  // const positionText = jobInsightText?.split(".")?.pop()?.trim();
  // // Split "worktype position" to extract "worktype"
  // const positionSplit = positionText?.split(" ");
  // const worktype = positionSplit?.shift(); // Remove and return the first element of the array
  // const position = positionSplit?.join(" ");
  // let firstEle = "";
  // if (workplacetype && worktype) {
  //   firstEle = `${workplacetype?.trim()} . ${worktype?.trim()}`;
  // }

  // if (workplacetype && worktype && position) {
  //   firstEle = `${workplacetype?.trim()} . ${worktype?.trim()} . ${position?.trim()}`;
  // }
  let elements: string[] = [];

  // if (workplacetype) {
  //   elements.push(workplacetype.trim());
  // }

  const secondLiElement = document?.querySelectorAll(
    ".job-details-jobs-unified-top-card__job-insight"
  )[1];
  const secondLiText = secondLiElement?.textContent?.trim() ?? "";
  if (secondLiText) {
    elements.push(secondLiText.trim());
  }
  if (worktype) {
    elements.push(worktype.trim());
  }

  if (position) {
    elements.push(position.trim());
  }

  let firstEle = elements.join(" . ");
  const imgEle = document.querySelector(
    ".jobs-search-results-list__list-item--active"
  );
  if (imgEle) {
    const img = imgEle?.querySelector("img");
    dispatch(setJobCompanyLogo(img?.src));
  }
  dispatch(setJobType(workplacetype));
  dispatch(setJobSummary([secondLiText]));
  dispatch(setJobSummary([elements]));
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

    const location2 = document.querySelector(
      ".job-details-jobs-unified-top-card__tertiary-description"
    );
    const locationtext2: any = location2?.childNodes[1] ?? "";
    if (locationtext2?.textContent?.trim()) {
      dispatch(setJobLocation(locationtext2?.textContent?.trim()));
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
      if (companyName?.trim()) {
        dispatch(setJobCompany(companyName?.trim()));
      }
    }, 500);

    const company2 = document.querySelector(
      ".job-details-jobs-unified-top-card__company-name"
    );

    const aTag2 = company2?.querySelector("a.app-aware-link");

    const companyName2 = aTag2?.textContent;
    if (companyName2?.trim()) {
      dispatch(setJobCompany(companyName2?.trim()));
    }

    // job - details - jobs - unified - top - card__company - name;
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
