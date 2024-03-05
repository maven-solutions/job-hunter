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
import { useEffect } from "react";
const getJobsFromZipRecuriter1 = (dispatch, zipDom: any) => {
  const zipDomForLink = document.querySelector(".job_result_selected");
  if (zipDomForLink) {
    const link = zipDomForLink.querySelector("a");
    dispatch(setJobPostUrl(link.href));
  }

  const titleEle = zipDom.querySelector("h1");
  const title = titleEle?.textContent?.trim();

  dispatch(setJobTitle(title));
  let companyEle = zipDom.querySelector("a");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    dispatch(setJobCompany(inputString));
  }
  const jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    dispatch(setJobDesc(description));
  }
};
const getJobsFromZipRecuriter2 = (dispatch, zipDom: any) => {
  const titleEle = zipDom.querySelector(".job_title");
  const title = titleEle?.textContent?.trim();
  dispatch(setJobTitle(title));

  const logoEle = zipDom.querySelector(".logo_img");
  dispatch(setJobCompanyLogo(logoEle.src));

  let companyEle = zipDom.querySelector(".hiring_company");
  if (companyEle) {
    const inputString = companyEle?.textContent?.trim();
    dispatch(setJobCompany(inputString));
  }
  const locationtext =
    zipDom.querySelector(".hiring_location")?.textContent?.trim() ?? "";
  dispatch(setJobLocation(locationtext));

  const jobCharacterstics = zipDom.querySelector(".job_characteristics");
  const workType =
    jobCharacterstics.querySelector(".wfh_label")?.textContent?.trim() ?? "";
  dispatch(setJobType(workType));
  const employmentType =
    jobCharacterstics
      .querySelector(".t_employment_type")
      ?.textContent?.trim() ?? "";
  const benefits =
    jobCharacterstics.querySelector(".t_benefits")?.textContent?.trim() ?? "";

  const compensation =
    jobCharacterstics.querySelector(".t_compensation")?.textContent?.trim() ??
    "";

  dispatch(setJobSummary([employmentType, benefits, compensation]));

  const jobDescriptionEle = zipDom.querySelector(".job_description");
  if (jobDescriptionEle) {
    const description = jobDescriptionEle?.innerHTML;
    dispatch(setJobDesc(description));
  }
};

const getJobFromZipRecruiter = (dispatch): void => {
  const zipDom = document.querySelector('[data-testid="right-pane"]');

  const zipDom2 = document.querySelector(".job_details");
  if (zipDom) {
    getJobsFromZipRecuriter1(dispatch, zipDom);
  }
  if (zipDom2) {
    dispatch(setJobPostUrl(window.location.href));
    getJobsFromZipRecuriter2(dispatch, zipDom2);
  }

  dispatch(setJobSource("ZipRecruiter"));

  dispatch(setJobFoundStatus(true));
};

const Ziprecruiter = (props: any) => {
  const { setShowPage } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    setTimeout(() => {
      getJobFromZipRecruiter(dispatch);
    }, 3000);
    setShowPage("");
    dispatch(setJobFoundStatus(false));
  }, [window.location.href]);

  return null;
};

export default Ziprecruiter;
