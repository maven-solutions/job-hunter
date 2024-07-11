import { useEffect } from "react";
import { useAppDispatch } from "../store/store";
import {
  clearJobState,
  setJobCompany,
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

function containsNumber(sentence: string): boolean {
  // Regular expression to check for any digits in the sentence
  const regex = /\d/;
  return regex.test(sentence);
}
export const getJobsFromIndeed = (dispatch): void => {
  dispatch(setJobPostUrl(window.location.href));
  setTimeout(() => {
    const titleElement = document?.querySelector(
      ".jobsearch-JobInfoHeader-title"
    );
    // Get the text content from the titleElement
    const text = titleElement?.textContent?.trim();
    const updatedText = text?.replace(" - job post", "");

    if (updatedText) {
      dispatch(setJobTitle(updatedText));
    }
  }, 100);

  const companyElement = document.querySelector(
    '[data-testid="inlineHeader-companyName"]'
  );

  if (companyElement) {
    dispatch(setJobCompany(companyElement?.textContent.trim()));
  }

  const locationEle = document
    .querySelector('[data-testid="inlineHeader-companyLocation"]')
    ?.textContent?.trim();
  let workplacetype = "";
  if (locationEle) {
    let locationText = locationEle.split("•")[0] ?? "";
    if (locationText.includes("Remote") || locationEle.includes("Remote")) {
      dispatch(setJobType("Remote"));
      workplacetype = "Remote";
    } else if (
      locationText.includes("Hybrid") ||
      locationEle.includes("Hybrid")
    ) {
      dispatch(setJobType("Hybrid"));
      workplacetype = "Hybrid";
    } else {
      dispatch(setJobType("Onsite"));
      workplacetype = "Onsite";
    }
    dispatch(setJobLocation(locationText));
  }

  let summaryInfo = "";
  const sallaryAndJobTypeEle = document.querySelector("#salaryInfoAndJobType");
  // const sallaryAndJobTypeInfo = sallaryAndJobTypeEle?.textContent?.trim() ?? "";
  const sallaryAndJobTypeEleChild = sallaryAndJobTypeEle?.children[0];
  if (sallaryAndJobTypeEleChild) {
    const salaryText = sallaryAndJobTypeEleChild?.textContent?.trim();
    if (containsNumber(salaryText)) {
      dispatch(setSalary(salaryText));
    } else {
      summaryInfo = salaryText;
    }
  }
  if (sallaryAndJobTypeEle?.children.length > 1) {
    const jobInfo = sallaryAndJobTypeEle?.children[1];
    if (jobInfo) {
      let text = jobInfo.textContent?.trim();
      summaryInfo = text.replace("-", "").trim();
    }
  }
  let elements: string[] = [];

  if (workplacetype) {
    elements.push(workplacetype);
  }
  if (summaryInfo) {
    elements.push(summaryInfo);
  }
  let firstEle = elements.join(" • ");

  dispatch(setJobRelatedInfo(firstEle));
  dispatch(setJobCulture(summaryInfo));

  const about = document.getElementById("jobDescriptionText");
  dispatch(setJobDesc(about?.innerHTML));

  dispatch(setJobSource("Indeed"));
  dispatch(setJobFoundStatus(true));
};
