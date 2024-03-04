import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import AllInputField from "./AllInputField";
import Notification from "./Notification";
import JobListTable from "./JobListTable";
import { checkJobStatus, saveJobs } from "./api";
import SaveButton from "../component/SaveButton";
import { getJobFromBuiltin } from "../jobExtractor/builtin";
import { getJobsFromIndeed } from "../jobExtractor/indeed";
import { getJobsFromDice } from "../jobExtractor/dice";
import { getJobFromSimplyhired } from "../jobExtractor/simplyhired";
import { getJobFromZipRecruiter } from "../jobExtractor/ziprecuriter";
import { getJobFromGlassdoor } from "../jobExtractor/glassdoor";
import Layout from "../template/Layout";

const JobFrom = (props: any) => {
  const { setShowForm } = props;
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [jobsTitle, setJobstitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<any>(
    "<b>Job Description</b>"
  );
  const [postUrl, setPostUrl] = useState<string>("");
  const [location, setLocation] = useState<any>("");
  const [addationalInfo, setAddationalInfo] = useState([]);

  const [activeUrl, setActiveUrl] = useState<string>(window.location.href);
  const [debounceValue] = useDebounce(activeUrl, 3000);
  const targetElementRef = useRef();
  const [success, setSuccess] = useState<Boolean>(false);
  const [failed, setFailed] = useState<Boolean>(false);
  const [errorMessage, setErrorMessage] = useState<any>("");

  const [source, setSource] = useState<any>("");
  const [alreadySavedStatus, setAlreadySavedStatus] = useState<Boolean>(false);
  const [alreadySavedInfo, SetAlreadySavedInfo] = useState<Boolean>(false);

  const [notification, setNotification] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const [showJobsTable, setShowJobsTable] = useState(false);
  const [jobTableData, setJobTableData] = useState([]);

  const [inputErrors, setInputErrors] = useState({});

  function isDateString(str) {
    // Attempt to create a new Date object from the string
    let date = new Date(str);

    // Check if the created date is valid and the original string is not empty
    return !isNaN(date.getTime()) && !isNaN(Date.parse(str));
  }

  // Example usage

  const getBuiltinDomForJobs = () => {
    const dom = document?.querySelector(".block-region-middle");
    const dom2 = document?.querySelector(".block-content");

    getJobFromBuiltin(
      setPostUrl,
      setJobstitle,
      setCompanyName,
      setLocation,
      setJobDescription,
      setSource,
      dom,
      dom2
    );
  };

  useEffect(() => {
    SetAlreadySavedInfo(false);
    if (window.location.href.includes("linkedin.")) {
      // getContentFromLinkedInJobs(
      //   setPostUrl,
      //   setJobstitle,
      //   setJobDescription,
      //   setLocation,
      //   setSource,
      //   setCompanyName,
      //   setAddationalInfo
      // );
    }
    if (window.location.href.includes("indeed.")) {
      getJobsFromIndeed(
        setPostUrl,
        setJobstitle,
        setJobDescription,
        setLocation,
        setSource,
        setCompanyName,
        setAddationalInfo
      );
    }
    if (window.location.href.includes("dice.")) {
      getJobsFromDice(
        setPostUrl,
        setJobstitle,
        setJobDescription,
        setLocation,
        setSource,
        setCompanyName,
        setAddationalInfo
      );
    }
    if (window.location.href.includes("ziprecruiter.")) {
      getJobFromZipRecruiter(
        setPostUrl,
        setJobstitle,
        setJobDescription,
        setLocation,
        setSource,
        setCompanyName,
        setAddationalInfo
      );
    }
    if (
      window.location.href.includes("glassdoor.") &&
      window.location.href.includes("job-listing")
    ) {
      getJobFromGlassdoor(
        setPostUrl,
        setJobstitle,
        setJobDescription,
        setLocation,
        setSource,
        setCompanyName,
        setAddationalInfo
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
        setLocation,
        setSource,
        setCompanyName,
        setAddationalInfo
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
  };

  // Function to handle API call error
  const handleFailed = () => {
    setFailed(true);

    // Hide error message after some seconds (e.g., 3 seconds)
    setTimeout(() => {
      setFailed(false);
    }, 3000);
  };

  const handleAlreadySaved = () => {
    setErrorMessage("Already Saved");

    // Hide error message after some seconds (e.g., 3 seconds)
    setTimeout(() => {
      setErrorMessage("");
    }, 3000);
  };

  const handleSaveClick = async () => {
    setLoading(true);

    saveNewJob();
  };

  const saveNewJob = (jobStatus?: String) => {
    const data: any = {
      companyName,
      jobTitle: jobsTitle,
      jobLink: postUrl,
      posted_on: location,
      description: jobDescription,
      jobBoard: source,
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
    <Layout setShowForm={setShowForm}>
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
          location={location}
          setLocation={setLocation}
          postUrl={postUrl}
          setPostUrl={setPostUrl}
          targetElementRef={targetElementRef}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          source={source}
          setSource={setSource}
          addationalInfo={addationalInfo}
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
    </Layout>
  );
};

export default JobFrom;
