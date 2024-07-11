import React, { useEffect } from "react";
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

export const getJobFromSimplyhired = (dispatch): void => {
  dispatch(setJobPostUrl(window.location.href));
  // this is for the desing where there is tab section in that page
  const titleElement = document.querySelector('[data-testid="viewJobTitle"]');

  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    dispatch(setJobTitle(title));
  }

  const companyNameEle = document.querySelector(
    // '[data-test="employer-name"]'
    '[data-testid="detailText"]'
  );

  if (companyNameEle) {
    // Get the text content from the element
    const inputString = companyNameEle?.textContent?.trim();
    dispatch(setJobCompany(inputString));
  }

  const locationText =
    document
      .querySelector('[data-testid="viewJobCompanyLocation"]')
      ?.textContent?.trim() ?? "";
  let jobtype = "";
  dispatch(setJobLocation(locationText));
  if (locationText && locationText.toLowerCase() === "remote") {
    jobtype = "Remote";
  } else {
    jobtype = "Onsite";
  }
  const CompanylogoEle: any = document.querySelector(
    '[data-testid="companyVJLogo"]'
  );
  if (CompanylogoEle) {
    dispatch(setJobCompanyLogo(CompanylogoEle?.src));
  }
  const workType =
    document
      .querySelector('[data-testid="viewJobBodyJobDetailsJobType"]')
      ?.textContent?.trim() ?? "";
  const payment =
    document
      .querySelector('[data-testid="viewJobBodyJobCompensation"]')
      ?.textContent?.trim() ?? "";

  let element = [];
  if (jobtype) {
    element.push(jobtype);
  }
  if (workType) {
    element.push(workType);
  }
  let firstEle = element.join(" • ");
  dispatch(setJobType(jobtype));
  dispatch(setJobRelatedInfo(firstEle));
  dispatch(setJobCulture(workType));
  // dispatch(setJobSummary([payment]));
  dispatch(setSalary(payment));

  if (titleElement) {
    dispatch(setJobFoundStatus(true));
  }

  const jobDescriptionEle = document.querySelector(
    '[data-testid="viewJobBodyJobFullDescriptionContent"]'
  );
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    dispatch(setJobDesc(description));
  }

  dispatch(setJobSource("Simplyhired"));
};
