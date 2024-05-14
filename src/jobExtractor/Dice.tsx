import { useAppDispatch } from "../store/store";
import {
  clearJobState,
  setJobCompany,
  setJobCompanyLogo,
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
import { useEffect } from "react";

const getJobsFromDice = (dispatch): void => {
  dispatch(setJobPostUrl(window.location.href));

  // Get the HTML element by its data-cy attribute
  const titleElement = document.querySelector('[data-cy="jobTitle"]');
  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    dispatch(setJobTitle(title));
  }

  const companyNameEle = document.querySelector('[data-cy="companyNameLink"]');
  const companyNameWithNoLinkEle = document.querySelector(
    '[data-cy="companyNameNoLink"]'
  );
  if (companyNameEle) {
    // Get the text content from the element
    const companyName = companyNameEle?.textContent?.trim();
    dispatch(setJobCompany(companyName));
  } else if (companyNameWithNoLinkEle) {
    const companyNameWithNoLink = companyNameWithNoLinkEle?.textContent?.trim();
    dispatch(setJobCompany(companyNameWithNoLink));
  }

  // Get the HTML element by its data-testid attribute
  const locationText = document
    .querySelector('[data-cy="location"]')
    .textContent.trim();
  dispatch(setJobLocation(locationText));

  const jobDescriptionEle = document.querySelector(
    '[data-testid="jobDescriptionHtml"]'
  );
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    dispatch(setJobDesc(description));
  }

  const jobTypeEle = document.querySelector('[data-cy="locationDetails"]')
    ?.children[0];
  let jobTypeText = "";
  jobTypeText = jobTypeEle.textContent.trim();
  if (
    jobTypeText.toLocaleLowerCase().includes("on site") ||
    jobTypeText.toLocaleLowerCase().includes("on-site")
  ) {
    jobTypeText = "Onsite";
  }
  const payDetailText =
    document.querySelector('[data-cy="payDetails"]')?.textContent?.trim() ?? "";

  const employmentDetailsText =
    document
      .querySelector('[data-cy="employmentDetails"]')
      ?.textContent?.trim() ?? "";

  const willingToSponsorText =
    document
      .querySelector('[data-cy="willingToSponsor"]')
      ?.textContent?.trim() ?? "";

  dispatch(setJobType(jobTypeText));
  dispatch(setSalary(payDetailText));
  dispatch(setJobRelatedInfo(jobTypeText));
  dispatch(setJobSummary([employmentDetailsText, willingToSponsorText]));

  dispatch(setJobSource("Dice"));
  dispatch(setJobFoundStatus(true));
};

const Dice = (props: any) => {
  const { setShowPage } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    setTimeout(() => {
      getJobsFromDice(dispatch);
    }, 4000);
    // setShowPage("");
    dispatch(clearJobState());
  }, [window.location.href]);

  return null;
};

export default Dice;
