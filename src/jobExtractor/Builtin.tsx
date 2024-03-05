import { useEffect } from "react";
import { useAppDispatch } from "../store/store";
import {
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
    dispatch(setJobFoundStatus(false));
  }, [window.location.href]);

  return null;
};

export default Builtin;
