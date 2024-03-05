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
const getJobFromBuiltin = (dispatch, dom?: any, dom2?: any) => {
  dispatch(setJobPostUrl(window.location.href));
  const titleElement = dom?.querySelector(".field--name-title");
  if (titleElement) {
    // Get the text content from the element
    const title = titleElement?.textContent?.trim();
    dispatch(setJobTitle(title));
  }

  const locationEle = dom?.querySelector(".company-address");
  if (locationEle) {
    // Get the text content from the element
    const location = locationEle?.textContent?.trim();
    dispatch(setJobLocation(location));
  }

  const locationEle2 = dom2?.querySelector(".icon-description");
  if (locationEle2) {
    // Get the text content from the element
    const location = locationEle2?.textContent?.trim();
    dispatch(setJobLocation(location));
  }

  const remoteWorkType = dom?.querySelector(".remote");
  if (remoteWorkType) {
    // Get the text content from the element
    const jobtype = remoteWorkType?.textContent?.trim();
    dispatch(setJobType(jobtype));
  }

  const hybridWorkType = dom?.querySelector(".hybrid-text");
  if (hybridWorkType) {
    // Get the text content from the element
    const jobtype = hybridWorkType?.textContent?.trim();
    dispatch(setJobType(jobtype));
  }

  const hybridWorkType2 = dom2?.querySelector(".job-hybrid");
  if (hybridWorkType2) {
    // Get the text content from the element
    const jobtype = hybridWorkType2?.textContent?.trim();
    dispatch(setJobType(jobtype));
  }

  const jobInfoEle = dom?.querySelector(".job-info");
  if (jobInfoEle) {
    const companyNameEle = jobInfoEle.querySelector("a");
    if (companyNameEle) {
      // Get the text content from the element
      const inputString = companyNameEle?.textContent?.trim();
      dispatch(setJobCompany(inputString));
    }
  } else {
    const companyNameEle = dom2?.querySelector(".company-title");
    if (companyNameEle) {
      // Get the text content from the element
      const inputString = companyNameEle?.textContent?.trim();
      dispatch(setJobCompany(inputString));
    }
  }

  const jobDescriptionEle = dom?.querySelector(".job-description");
  if (jobDescriptionEle) {
    // Get the text content from the element
    const description = jobDescriptionEle?.innerHTML;
    dispatch(setJobDesc(description));
  }

  const sallaryEle = dom?.querySelector(".provided-salary");
  if (sallaryEle) {
    // Get the text content from the element
    const sallary = sallaryEle?.textContent?.trim();
    dispatch(setJobSummary([sallary]));
  }

  const sallaryEle2 = dom2?.querySelector(".provided-salary");
  if (sallaryEle2) {
    // Get the text content from the element
    const sallary = sallaryEle2?.textContent?.trim();
    dispatch(setJobSummary([sallary]));
  }

  dispatch(setJobSource("Builtin"));
  dispatch(setJobFoundStatus(true));
};

const Builtin = (props: any) => {
  const { setShowPage } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    const dom = document?.querySelector(".block-region-middle");
    const dom2 = document?.querySelector(".block-content");
    setTimeout(() => {
      getJobFromBuiltin(dispatch, dom, dom2);
    }, 3000);
    setShowPage("");
    setShowPage("");
    dispatch(clearJobState());
  }, [window.location.href]);

  return null;
};

export default Builtin;
