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

const getJobId = () => {
  // Given URL
  const url = window.location.href;

  // Regular expression pattern to match the job listing ID
  const regex = /jl=(\d+)/;
  // Use regex to extract the job listing ID
  const match = url.match(regex);
  if (match && match[1]) {
    const jobListingID = match[1];
    return jobListingID;
  } else {
    console.log("Job Listing ID not found in the URL.");
    return null;
  }
};

const removeRatingFromEnd = (inputString) => {
  // Remove the rating at the end of the string
  let stringWithoutRating = inputString.replace(/\d+(\.\d+)?★$/, "");
  // Remove any trailing whitespace
  let finalString = stringWithoutRating.trim();
  return finalString;
};

const getJobFromGlassdoor = (dispatch): void => {
  dispatch(setJobPostUrl(window.location.href));
  const jobId = getJobId();
  const glassDom = document.querySelector('[data-test="job-details-header"]');

  // this is for the desing where there is tab section in that page
  const titleElement = glassDom.querySelector("h1");

  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    dispatch(setJobTitle(title));
  }

  const companyNameEle = glassDom.querySelector("h4");

  if (companyNameEle) {
    // Get the text content from the element
    const inputString = companyNameEle?.textContent?.trim();
    // const companyName = removeRatingFromEnd(inputString);
    dispatch(setJobCompany(inputString));
  }
  const comapnyLogoEle = glassDom.querySelector("img");
  if (comapnyLogoEle) {
    dispatch(setJobCompanyLogo(comapnyLogoEle?.src));
  }
  const locationText =
    glassDom.querySelector('[data-test="location"]')?.textContent?.trim() ?? "";
  dispatch(setJobLocation(locationText));

  const salary = document
    .querySelector(`[class*="SalaryEstimate_averageEstimate"]`)
    ?.textContent?.trim();
  // dispatch(setJobSummary([salary]));
  // for description
  // const sibling = glassDom.nextElementSibling;
  // if (sibling) {
  //   const descDom = sibling.nextElementSibling;
  //   if (descDom) {
  //     const desc = descDom.children[0];
  //     if (desc) {
  //       const innderDesc = desc.children[0];
  //       // Get the text content from the element
  //       const description = innderDesc?.innerHTML;
  //       dispatch(setJobDesc(description));
  //     }
  //   }
  // }

  const descSibling = document.querySelector(`#job-viewed-waypoint-${jobId}`);
  const descParent: any = descSibling?.nextSibling?.childNodes[0];
  const desc = descParent?.innerHTML ?? "";
  if (desc) {
    dispatch(setJobDesc(desc));
    // setJobDescription(desc);
  }

  // end of   desing where there is tab section in that page

  //  this is for where ther is no tabs in listing page

  const titleElement2 = document.querySelector(".JobDetails_jobTitle__Rw_gn");

  if (titleElement2) {
    // Get the text content from the element
    const title = titleElement2?.textContent?.trim();
    if (title) {
      dispatch(setJobTitle(title));
    }
  }

  const companyNameEle2 = document.querySelector(
    ".EmployerProfile_employerName__8w0tV"
  );

  if (companyNameEle2) {
    // Get the text content from the element
    const companyName = companyNameEle2?.textContent?.trim();
    if (companyName) {
      dispatch(setJobCompany(companyName));
    }
  }

  const jobDescriptionEle2 = document.querySelector(
    ".JobDetails_jobDescription__6VeBn"
  );
  if (jobDescriptionEle2) {
    // Get the text content from the element
    const description = jobDescriptionEle2?.innerHTML;
    dispatch(setJobDesc(description));
  }

  dispatch(setJobSource("Glassdoor"));
  dispatch(setJobFoundStatus(true));
};

const Glassdoor = (props: any) => {
  const { setShowPage } = props;
  const dispatch = useAppDispatch();

  useEffect(() => {
    setTimeout(() => {
      getJobFromGlassdoor(dispatch);
    }, 3000);
    setShowPage("");
    dispatch(clearJobState());
  }, [window.location.href]);

  return null;
};

export default Glassdoor;
