import React, { useEffect } from "react";
import { useAppDispatch } from "../store/store";
import {
  clearJobState,
  setJobCompany,
  setJobDesc,
  setJobFoundStatus,
  setJobLocation,
  setJobPostUrl,
  setJobSource,
  setJobSummary,
  setJobTitle,
  setJobType,
} from "../store/features/JobDetail/JobDetailSlice";

const getJobFromSimplyhired = (dispatch): void => {
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

  dispatch(setJobLocation(locationText));

  const workType =
    document
      .querySelector('[data-testid="viewJobBodyJobDetailsJobType"]')
      ?.textContent?.trim() ?? "";
  const payment =
    document
      .querySelector('[data-testid="viewJobBodyJobCompensation"]')
      ?.textContent?.trim() ?? "";

  dispatch(setJobType(workType));
  dispatch(setJobSummary([payment]));
  dispatch(setJobFoundStatus(true));

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

const SimplyHiredJob = (props: any) => {
  const { setShowPage } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    setTimeout(() => {
      getJobFromSimplyhired(dispatch);
    }, 3000);
    setShowPage("");
    setShowPage("");
    dispatch(clearJobState());
  }, [window.location.href]);

  return null;
};

export default SimplyHiredJob;
