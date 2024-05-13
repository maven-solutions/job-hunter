import { useEffect } from "react";
import { useAppDispatch } from "../store/store";
import {
  clearJobState,
  setJobCompany,
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
const getJobsFromIndeed = (dispatch): void => {
  dispatch(setJobPostUrl(window.location.href));
  setTimeout(() => {
    const titleElement = document?.querySelector(
      ".jobsearch-JobInfoHeader-title"
    );
    // Get the text content from the titleElement
    const text = titleElement?.textContent?.trim();
    // Extract "React.js Developer"
    const jobTitle = text?.split(" - ")[0];
    if (jobTitle) {
      dispatch(setJobTitle(jobTitle));
    }
  }, 1000);

  const companyElement = document.querySelector(
    '[data-testid="inlineHeader-companyName"]'
  );

  if (companyElement) {
    dispatch(setJobCompany(companyElement?.textContent.trim()));
  }

  const locationEle = document
    .querySelector('[data-testid="inlineHeader-companyLocation"]')
    ?.textContent?.trim();

  if (locationEle) {
    let locationText = locationEle.split("•")[0] ?? "";
    if (locationText.includes("Remote") || locationEle.includes("Remote")) {
      dispatch(setJobType("Remote"));
      dispatch(setJobRelatedInfo("Remote"));
    }
    dispatch(setJobLocation(locationText));
  }

  const sallaryAndJobTypeEle = document.querySelector("#salaryInfoAndJobType");
  const sallaryAndJobTypeInfo = sallaryAndJobTypeEle?.textContent?.trim() ?? "";
  const sallaryAndJobTypeEleChild = sallaryAndJobTypeEle?.children[0];
  if (sallaryAndJobTypeEleChild) {
    const salaryText = sallaryAndJobTypeEleChild?.textContent?.trim();
    if (salaryText) {
      dispatch(setSalary(salaryText));
    }
  }

  // setAddationalInfo([locationEle, sallaryInfo]);
  // dispatch(setJobType(locationEle));
  dispatch(setJobSummary([sallaryAndJobTypeInfo]));

  const about = document.getElementById("jobDescriptionText");
  dispatch(setJobDesc(about?.innerHTML));

  dispatch(setJobSource("Indeed"));
  dispatch(setJobFoundStatus(true));
};

const Indeed = (props: any) => {
  const { setShowPage } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    setTimeout(() => {
      getJobsFromIndeed(dispatch);
    }, 3000);
    // setShowPage("");
    // dispatch(clearJobState());
  }, [window.location.href]);

  return null;
};

export default Indeed;
