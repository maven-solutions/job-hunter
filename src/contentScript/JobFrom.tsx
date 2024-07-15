import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import AllInputField from "./AllInputField";
import { extractDateFromDiceDom } from "./helper";
import AllSvg from "./AllSvg";
import Notification from "./Notification";
import JobListTable from "./JobListTable";
import { checkJobStatus, saveJobs } from "./api";
import CloseIcon from "../component/CloseIcon";
import SaveButton from "../component/SaveButton";
import { getJobFromBuiltin } from "../jobExtractor/builtin";

import { getJobFromGlassdoor } from "../jobExtractor/glassdoor";
import { getContentFromLinkedInJobs } from "../jobExtractor/linkedin";
import { getJobsFromDice } from "../jobExtractor/dice";
import { getJobsFromIndeed } from "../jobExtractor/indeed";

const JobFrom = (props: any) => {
  const { setShowForm } = props;
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [jobsTitle, setJobstitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<any>(
    "<b>Job Description</b>"
  );
  const [postUrl, setPostUrl] = useState<string>("");
  const [postedDate, setPostedDate] = useState<any>("");
  const [jobType, setJobType] = useState<any>(null);
  const [employment, setEmployment] = useState<any>(null);

  const [activeUrl, setActiveUrl] = useState<string>(window.location.href);
  const [debounceValue] = useDebounce(activeUrl, 3000);
  const targetElementRef = useRef();
  const [success, setSuccess] = useState<Boolean>(false);
  const [failed, setFailed] = useState<Boolean>(false);
  const [errorMessage, setErrorMessage] = useState<any>("");
  const [category, setCategory] = useState<any>(
    localStorage.getItem("lock_status") === "true" &&
      localStorage.getItem("categoryOption")
      ? JSON.parse(localStorage.getItem("categoryOption"))
      : null
  );
  const [state, setState] = useState<any>(null);
  const [city, setCity] = useState<any>(null);
  const [source, setSource] = useState<any>("");
  const [alreadySavedStatus, setAlreadySavedStatus] = useState<Boolean>(false);
  const [alreadySavedInfo, SetAlreadySavedInfo] = useState<Boolean>(false);
  const [locked, setLocked] = useState<Boolean>(
    localStorage.getItem("lock_status") === "true" ? true : false
  );

  const [easyApply, setEasyApply] = useState<any>(0);
  const [notification, setNotification] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const [showJobsTable, setShowJobsTable] = useState(false);
  const [jobTableData, setJobTableData] = useState([]);
  const [companyDetails, setCompanyDetails] = useState({});
  const [recruiterDetails, setRecruiterDetails] = useState({});
  const [jobOverview, setJoboverview] = useState([]);

  const clearStateAndCity = () => {
    setState(null);
    setCity(null);
  };
  const [inputErrors, setInputErrors] = useState({
    category: "",
    jobType: "",
    employment: "",
    easyApply: "",
  });
  const resetInputErrors = () => {
    setInputErrors({
      category: "",
      jobType: "",
      employment: "",
      easyApply: "",
    });
  };

  function isDateString(str) {
    // Attempt to create a new Date object from the string
    let date = new Date(str);

    // Check if the created date is valid and the original string is not empty
    return !isNaN(date.getTime()) && !isNaN(Date.parse(str));
  }

  // Example usage

  const getJobsFromZipRecuriter1 = (zipDom: any) => {
    const zipDomForLink = document.querySelector(".job_result_selected");
    if (zipDomForLink) {
      const link = zipDomForLink.querySelector("a");
      setPostUrl(link.href);
    }

    const titleEle = zipDom.querySelector("h1");
    const title = titleEle?.textContent?.trim();
    setJobstitle(title);
    let companyEle = zipDom.querySelector("a");
    if (companyEle) {
      const inputString = companyEle?.textContent?.trim();
      setCompanyName(inputString);
    }
    let jobDescriptionEle: any = "";
    jobDescriptionEle = zipDom.querySelector(".job_description");
    if (jobDescriptionEle) {
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }

    jobDescriptionEle = document.querySelector(
      'div[class="relative flex flex-col gap-24"]'
    );
    if (jobDescriptionEle) {
      const description = jobDescriptionEle?.innerHTML;
      if (description) {
        setJobDescription(description);
      }
    }
  };
  const getJobsFromZipRecuriter2 = (zipDom: any) => {
    const titleEle = zipDom.querySelector(".job_title");
    const title = titleEle?.textContent?.trim();
    setJobstitle(title);

    let companyEle = zipDom.querySelector(".hiring_company");
    if (companyEle) {
      const inputString = companyEle?.textContent?.trim();
      setCompanyName(inputString);
    }

    const jobDescriptionEle = zipDom.querySelector(".job_description");
    if (jobDescriptionEle) {
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }
  };

  const getJobFromZipRecruiter = (): void => {
    clearStateAndCity();

    const zipDom = document.querySelector('[data-testid="right-pane"]');

    const zipDom2 = document.querySelector(".job_details");
    if (zipDom) {
      getJobsFromZipRecuriter1(zipDom);
    }
    if (zipDom2) {
      setPostUrl(window.location.href);
      getJobsFromZipRecuriter2(zipDom2);
    }

    setPostedDate("n/a");
    setEmployment(null);
    setJobType(null);
    setEasyApply(null);
    setSource("Ziprecruiter");
  };

  const getBuiltinDomForJobs = () => {
    const dom = document?.querySelector(".block-region-middle");
    const dom2 = document?.querySelector(".block-content");

    getJobFromBuiltin(
      setPostUrl,
      setJobstitle,
      setCompanyName,
      setEmployment,
      setJobType,
      setPostedDate,
      setCity,
      setState,
      setEasyApply,
      setJobDescription,
      setSource,
      dom,
      dom2,
      setJoboverview,
      setLocation
    );
  };

  useEffect(() => {
    SetAlreadySavedInfo(false);
    if (window.location.href.includes("linkedin.")) {
      getContentFromLinkedInJobs(
        setPostUrl,
        clearStateAndCity,
        setJobstitle,
        setJobDescription,
        isDateString,
        setPostedDate,
        setEasyApply,
        setJobType,
        setEmployment,
        setSource,
        setCompanyName,
        setCompanyDetails,
        setRecruiterDetails,
        setJoboverview,
        setLocation
      );
    }
    if (window.location.href.includes("indeed.")) {
      getJobsFromIndeed(
        setPostUrl,
        clearStateAndCity,
        setJobstitle,
        setJobDescription,
        setPostedDate,
        setEasyApply,
        setJobType,
        setEmployment,
        setSource,
        setCompanyName,
        setJoboverview,
        setLocation
      );
    }
    if (window.location.href.includes("dice.")) {
      getJobsFromDice(
        setPostUrl,
        clearStateAndCity,
        setJobstitle,
        setJobDescription,
        isDateString,
        setPostedDate,
        setEasyApply,
        setJobType,
        setEmployment,
        setSource,
        setCompanyName,
        setJoboverview,
        setLocation
      );
    }
    if (window.location.href.includes("ziprecruiter.")) {
      getJobFromZipRecruiter();
    }
    if (
      window.location.href.includes("glassdoor.") &&
      window.location.href.includes("job-listing")
    ) {
      getJobFromGlassdoor(
        setPostUrl,
        setJobstitle,
        setJobDescription,
        setPostedDate,
        setSource,
        setCompanyName,
        setEmployment,
        setJobType,
        setEasyApply
      );
    }

    if (
      window.location.href.toLowerCase.toString() !==
        "https://www.simplyhired.com/" &&
      window.location.href.includes("simplyhired.")
    ) {
      getJobFromSimplyhired(
        setPostUrl,
        setJobstitle,
        setJobDescription,
        setPostedDate,
        setEasyApply,
        setJobType,
        setEmployment,
        setSource,
        setCompanyName,
        setCity,
        setState,
        setJoboverview,
        setLocation
      );
    }

    // if (
    //   window.location.href.toLowerCase.toString() ===
    //   "https://www.simplyhired.com/"
    // ) {
    //   getJobFromSimplyhiredLandingPage();
    // }

    if (window.location.href.includes("builtin.")) {
      getBuiltinDomForJobs();
    }
  }, [debounceValue]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const url = window.location.href;
      // chrome.runtime.sendMessage({ action: "urlChange", url });
      if (url !== activeUrl) {
        setActiveUrl(url);
      }
    });

    // Observe changes in the DOM
    observer.observe(document, { childList: true, subtree: true });
  }, []);

  const handleSuccess = () => {
    setSuccess(true);
    // Hide success message after some seconds (e.g., 3 seconds)
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
    if (!locked) {
      setCategory(null);
    }
  };

  // Function to handle API call error
  const handleFailed = () => {
    setFailed(true);

    // Hide error message after some seconds (e.g., 3 seconds)
    setTimeout(() => {
      setFailed(false);
    }, 3000);
    if (!locked) {
      setCategory(null);
    }
  };

  const handleAlreadySaved = () => {
    setErrorMessage("Already Saved");
    if (!locked) {
      setCategory(null);
    }

    // Hide error message after some seconds (e.g., 3 seconds)
    setTimeout(() => {
      setErrorMessage("");
    }, 3000);
  };

  const handleSaveClick = async () => {
    if (category === null) {
      setErrorMessage("Please pick a category");
      setHasErrors(true);
      setInputErrors((prev) => {
        return { ...prev, category: "Category is required." };
      });
      setTimeout(() => {
        setErrorMessage("");
        resetInputErrors();
      }, 3000);
      // return;
    }

    if (easyApply === null || !easyApply) {
      setErrorMessage("Please pick a EasyApply");
      setHasErrors(true);
      setInputErrors((prev) => {
        return { ...prev, easyApply: "Company/Easy Apply is required." };
      });
      setTimeout(() => {
        setErrorMessage("");
        resetInputErrors();
      }, 3000);
      // return;
    }

    if (jobType === null) {
      setErrorMessage("Please pick a job type");
      setHasErrors(true);
      setInputErrors((prev) => {
        return { ...prev, jobType: "Job type is required." };
      });
      setTimeout(() => {
        setErrorMessage("");
        resetInputErrors();
      }, 3000);
      // return;
    }
    if (employment === null) {
      setErrorMessage("Please pick a employment type");
      setHasErrors(true);
      setInputErrors((prev) => {
        return { ...prev, employment: "Employment is required." };
      });
      setTimeout(() => {
        setErrorMessage("");
        resetInputErrors();
      }, 3000);
      // return;
    }
    for (const key in inputErrors) {
      if (inputErrors.hasOwnProperty(key) && inputErrors[key] === "") {
        continue;
      } else {
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    if (
      category !== null &&
      jobType !== null &&
      employment !== null &&
      easyApply !== null
    ) {
      setHasErrors(false);
      setNotification(true);
    } else {
      setNotification(false);
      setLoading(false);
      return false;
    }
    saveNewJob();
  };

  const saveNewJob = (jobStatus?: String) => {
    const data: any = {
      companyName,
      jobTitle: jobsTitle,
      jobLink: postUrl,
      posted_on: postedDate,
      description: jobDescription,
      jobType: jobType?.value,
      category: category?.value,
      employment: employment?.value,
      jobBoard: source,
      state: state?.value ?? "USA",
      city: city?.value,
      easyApply: easyApply?.value,
      recruiterDetails: recruiterDetails,
      companyDetails: companyDetails,
      jobOverview,
      location,
    };

    if (jobStatus) {
      data.jobStatus = jobStatus;
    }

    saveJobs(
      data,
      setLoading,
      setShowJobsTable,
      setJobTableData,
      handleAlreadySaved,
      setNotification,
      handleFailed,
      handleSuccess,
      setSavedNotification,
      postUrl,
      setAlreadySavedStatus
    );
  };

  useEffect(() => {
    checkJobStatus(
      postUrl,
      setAlreadySavedStatus,
      setSavedNotification,
      SetAlreadySavedInfo
    );
  }, [postUrl]);

  return (
    <div className="job__detail__container">
      <div className="jd-inner">
        <div className="jobs__collapse" onClick={() => setShowForm(false)}>
          <CloseIcon />
        </div>
        <AllSvg />
        <div className="scroll-form">
          <Notification
            alreadySavedStatus={alreadySavedStatus}
            notification={notification}
            savedNotification={savedNotification}
            setSavedNotification={setSavedNotification}
            SetAlreadySavedInfo={SetAlreadySavedInfo}
            alreadySavedInfo={alreadySavedInfo}
          />
          <AllInputField
            companyName={companyName}
            setCompanyName={setCompanyName}
            jobsTitle={jobsTitle}
            setJobstitle={setJobstitle}
            postedDate={postedDate}
            setPostedDate={setPostedDate}
            postUrl={postUrl}
            setPostUrl={setPostUrl}
            targetElementRef={targetElementRef}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            jobType={jobType}
            setJobType={setJobType}
            category={category}
            setCategory={setCategory}
            source={source}
            setSource={setSource}
            locked={locked}
            setLocked={setLocked}
            employment={employment}
            setEmployment={setEmployment}
            state={state}
            setState={setState}
            city={city}
            setCity={setCity}
            easyApply={easyApply}
            setEasyApply={setEasyApply}
            inputErrors={inputErrors}
          />
        </div>

        {showJobsTable && (
          <JobListTable
            loading={loading}
            jobTableData={jobTableData}
            setShowJobsTable={setShowJobsTable}
            saveNewJob={saveNewJob}
          />
        )}

        <SaveButton
          success={success}
          failed={failed}
          errorMessage={errorMessage}
          alreadySavedStatus={alreadySavedStatus}
          handleSaveClick={handleSaveClick}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default JobFrom;
