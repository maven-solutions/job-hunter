import { useEffect } from "react";
import { useAppDispatch } from "../store/store";
import {
  clearJobState,
  setJobCompany,
  setJobCompanyLogo,
  setJobCulture,
  setJobDesc,
  setJobFoundStatus,
  setJobLocation,
  setJobPostUrl,
  setJobRelatedInfo,
  setJobSource,
  setJobSummary,
  setJobTitle,
  setJobType,
  setSalary,
} from "../store/features/JobDetail/JobDetailSlice";
import { extractSalaryFromString } from "../utils/helper";

const getAddationalInfo = (dispatch) => {
  const jobInsightElement = document.querySelector(
    ".job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight"
  );
  const jobInsightText =
    jobInsightElement?.querySelector("span")?.textContent?.trim() ?? "";

  let workplacetype: string | null = null;
  let worktype: string | null = null;
  let position: string | null = null;
  let salary: string | null = null;

  // const matches = jobInsightText.match(regex);
  const matches = extractSalaryFromString(jobInsightText);
  if (matches) {
    salary = matches;
    dispatch(setSalary(matches));
  }
  // for workplace
  // console.log("jobInsightText::", jobInsightText);
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

  let elements: string[] = [];
  let elements2: string[] = [];

  if (workplacetype) {
    elements.push(workplacetype);
  }
  if (worktype) {
    elements.push(worktype);
    elements2.push(worktype);
  }
  if (position) {
    elements.push(position);
    elements2.push(position);
  }

  let firstEle = elements.join(" • ");
  let jobCulture = elements2.join(" • ");
  const secondLiElement = document?.querySelectorAll(
    ".job-details-jobs-unified-top-card__job-insight"
  )[1];
  const secondLiText = secondLiElement?.textContent?.trim() ?? "";

  let imgEle: any = document.querySelector(
    ".jobs-search-results-list__list-item--active-v2"
  );
  if (imgEle) {
    const img = imgEle?.querySelector("img");
    dispatch(setJobCompanyLogo(img?.src));
  } else {
    imgEle = document.querySelector(".ivm-image-view-model");
    if (imgEle) {
      const img = imgEle?.querySelector("img");
      dispatch(setJobCompanyLogo(img?.src));
    }
  }

  dispatch(setJobCulture(jobCulture));
  dispatch(setJobType(workplacetype));
  dispatch(setJobRelatedInfo(firstEle));
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
    }, 4000);
    // setShowPage("");
    dispatch(clearJobState());
  }, [window.location.href]);
  return null;
};

export default Linkedin;
