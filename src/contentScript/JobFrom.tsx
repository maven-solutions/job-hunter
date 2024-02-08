import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import AllInputField from "./AllInputField";
import {
  dateExtractorFromDom,
  extractDateFromDiceDom,
  extractDateFromZipRecruterDom,
} from "./helper";

const JobFrom = (props: any) => {
  const [companyName, setCompanyName] = useState<string>("");
  const [jobsTitle, setJobstitle] = useState<string>("");
  const [companyLocation, setCompanyLocation] = useState<string>("");
  const [jobDetails, setJobDetails] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<any>("");
  const [postUrl, setPostUrl] = useState<string>("");
  const [postedDate, setPostedDate] = useState<any>("");
  const [jobType, setJobType] = useState<any>(
    localStorage.getItem("jobTypeOption")
      ? JSON.parse(localStorage.getItem("jobTypeOption"))
      : null
  );
  const [employment, setEmployment] = useState<any>(
    localStorage.getItem("employmentOption")
      ? JSON.parse(localStorage.getItem("employmentOption"))
      : null
  );
  const [companyInfo, setCompanyInfo] = useState<any>("");
  const [skills, setSkills] = useState<any>("");
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
  const [locked, setLocked] = useState<Boolean>(
    localStorage.getItem("lock_status") === "true" ? true : false
  );

  const [easyApply, setEasyApply] = useState<any>(0);

  const clearStateAndCity = () => {
    setState(null);
    setCity(null);
  };

  function isDateString(str) {
    // Attempt to create a new Date object from the string
    let date = new Date(str);

    // Check if the created date is valid and the original string is not empty
    return !isNaN(date.getTime()) && !isNaN(Date.parse(str));
  }

  const getContentFromLinkedInJobs = (): void => {
    try {
      setPostUrl(window.location.href);
      clearStateAndCity();

      const jobsBody = document?.getElementsByClassName(
        "job-details-jobs-unified-top-card__job-title"
      );
      if (jobsBody[0]) {
        setJobstitle(jobsBody[0]?.textContent.trim());
      }

      setTimeout(() => {
        let jobDetailsElement = document?.getElementById("job-details");

        const about = jobDetailsElement?.querySelector("span");

        setJobDescription(about?.innerHTML);
      }, 500);

      // find posted date

      const daysAgoEle = document?.querySelector("#job-details");
      const targetElement = document.querySelector("#job-details");
      let date = [];
      // Check if the element is found
      if (targetElement) {
        // Get the next sibling element
        const nextElement = targetElement.nextElementSibling;

        // Check if the next sibling exists
        if (nextElement) {
          const modifiedDate = nextElement.innerHTML
            .replace("Posted on ", "")
            .replace(".", "");
          if (isDateString(modifiedDate)) {
            setPostedDate(modifiedDate);
          } else {
            setPostedDate("n/a");
          }
        }
      } else {
        setPostedDate("n/a");
      }

      setEasyApply(0);

      // const jobType = document.querySelectorAll(
      //   'job-details-jobs-unified-top-card__job-insight'
      // );

      // console.log(jobType, 'jobType');

      // if (jobType[0]) {
      //   const jobTypeText = jobType[0]?.textContent?.trim() || 'n/a';
      //   setJobType(jobTypeText);
      // }

      // const jobDetailsElement = document.querySelector('.mt3.mb2');
      // // Loop through all li elements and extract their text content
      // const liElements = jobDetailsElement.querySelectorAll('li');
      // if (liElements && liElements?.length > 0 && liElements[0]) {
      //   setJobType(liElements[0]?.textContent?.trim());
      // }

      // liElements.forEach(function (liElement, index) {
      //   const liTextContent = liElement.innerText || liElement.textContent;
      //   if (index === 0) {
      //     setJobType(liTextContent);
      //   }
      //   if (index === 1) {
      //     setCompanyInfo(liTextContent);
      //   }
      //   if (index === 2) {
      //     setSkills(liTextContent);
      //   }
      // });

      setSource("linkedin");

      const location = document.getElementsByClassName(
        "job-details-jobs-unified-top-card__bullet"
      );
      if (location[0]) {
        setCompanyLocation(location[0]?.textContent?.trim());
      }

      var jobDetailsElem = document.querySelector(
        ".job-details-jobs-unified-top-card__primary-description-without-tagline"
      );
      if (jobDetailsElem) {
        setJobDetails(jobDetailsElem.textContent?.trim() || "n/a");
      }

      // Assuming you have a reference to the DOM element
      setTimeout(() => {
        const domElement = document?.querySelector(
          ".jobs-unified-top-card.t-14"
        );

        const aTag = domElement?.querySelector("a.app-aware-link");
        const companyName = aTag?.textContent;
        setCompanyName(companyName?.trim());
      }, 500);
    } catch (error) {
      console.log(error);
    }
  };

  const getJobsFromIndeed = (): void => {
    setPostUrl(window.location.href);
    clearStateAndCity();

    setTimeout(() => {
      const titleElement = document?.querySelector(
        ".jobsearch-JobInfoHeader-title"
      );
      // Get the text content from the titleElement
      const text = titleElement?.textContent?.trim();
      // Extract "React.js Developer"
      const jobTitle = text?.split(" - ")[0];
      if (jobTitle) {
        setJobstitle(jobTitle);
      }
    }, 1000);

    // Get the HTML element by its data-testid attribute
    const locationElement = document.querySelector(
      '[data-testid="inlineHeader-companyLocation"]'
    );
    if (locationElement) {
      // Get the text content from the element
      const location = locationElement?.textContent.trim();
      setCompanyLocation(location);
    }

    const companyElement = document.querySelector(
      '[data-testid="inlineHeader-companyName"]'
    );

    if (companyElement) {
      setCompanyName(companyElement?.textContent.trim());
    }

    const about = document.getElementById("jobDescriptionText");
    setJobDescription(about?.innerHTML);

    setJobType("n/a");
    setPostedDate("n/a");
    setEasyApply(0);
    setSource("indeed");
  };

  const getJobsFromDice = (): void => {
    setPostUrl(window.location.href);
    clearStateAndCity();
    // Get the HTML element by its data-cy attribute
    const titleElement = document.querySelector('[data-cy="jobTitle"]');
    if (titleElement) {
      // Get the text content from the element
      const title = titleElement?.textContent?.trim();
      setJobstitle(title);
    }
    const companyNameEle = document.querySelector(
      '[data-cy="companyNameLink"]'
    );
    const companyNameWithNoLinkEle = document.querySelector(
      '[data-cy="companyNameNoLink"]'
    );
    if (companyNameEle) {
      // Get the text content from the element
      const companyName = companyNameEle?.textContent?.trim();
      setCompanyName(companyName);
    } else if (companyNameWithNoLinkEle) {
      const companyNameWithNoLink =
        companyNameWithNoLinkEle?.textContent?.trim();
      setCompanyName(companyNameWithNoLink);
    }

    // Get the HTML element by its data-testid attribute
    const locationElement = document.querySelector(
      ".job-header_jobDetail__ZGjiQ"
    );
    if (locationElement) {
      // Get the text content from the element
      const location = locationElement?.textContent?.trim();
      setCompanyLocation(location);
    } else {
      setCompanyLocation("n/a");
    }

    // Get the HTML element by its data-testid attribute
    const dateElement = document.querySelector("#timeAgo");
    const date = extractDateFromDiceDom(dateElement);
    setPostedDate(date);

    const jobDescriptionEle = document.querySelector(
      '[data-testid="jobDescriptionHtml"]'
    );
    if (jobDescriptionEle) {
      // Get the text content from the element
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }

    const jobTypeText = document.querySelector('[data-cy="locationDetails"]');
    if (jobTypeText) {
      // Get the text content from the element
      const jobType = jobTypeText?.textContent?.trim();
      if (
        jobType?.toLowerCase() === "remote" ||
        jobType?.toLowerCase() === "on site" ||
        jobType?.toLowerCase() === "hybrid"
      ) {
        setJobType(jobTypeText);
      } else {
        setJobType("n/a");
      }
      setJobType(jobType);
    } else {
      setJobType("n/a");
    }
    setEasyApply(0);

    setSource("dice");
  };

  const removeRatingFromEnd = (inputString) => {
    // Remove the rating at the end of the string
    let stringWithoutRating = inputString.replace(/\d+(\.\d+)?★$/, "");
    // Remove any trailing whitespace
    let finalString = stringWithoutRating.trim();
    return finalString;
  };

  // Example usage

  const getJobFromZipRecruiter = (): void => {
    setPostUrl(window.location.href);
    clearStateAndCity();

    const titleEle = document.querySelector(".job_title");
    const title = titleEle?.textContent?.trim();
    setJobstitle(title);

    let companyEle = document.querySelector(".hiring_company");
    if (companyEle) {
      const inputString = companyEle?.textContent?.trim();
      let companyName = removeRatingFromEnd(inputString);
      setCompanyName(companyName);
    } else {
      companyEle = document.querySelector(".job_company");
      const companyName = companyEle?.textContent?.trim();
      setCompanyName(companyName);
    }

    const dateEle = document.querySelector(".text-muted");

    // const date = extractDateFromZipRecruterDom(dateEle);
    // setPostedDate(date);
    setPostedDate("n/a");

    let locationEle = document.querySelector(".hiring_location");
    if (locationEle) {
      const location = locationEle?.textContent?.trim();
      setCompanyLocation(location);
    } else {
      locationEle = document.querySelector(".job_location");
      const location = locationEle?.textContent?.trim();
      setCompanyLocation(location);
    }

    const jobDescriptionEle = document.querySelector(".job_description");
    if (jobDescriptionEle) {
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }
    const jobType = document.querySelector(".remote_tag");
    if (jobType) {
      const text = jobType?.innerHTML;
      setJobType(text);
    } else {
      setJobType("n/a");
    }
    setEasyApply(0);

    setSource("zip recruiter");
  };

  const getJobFromGlassdoor = (): void => {
    setPostUrl(window.location.href);

    // this is for the desing where there is tab section in that page
    const titleElement = document.querySelector('[data-test="job-title"]');

    if (titleElement) {
      // Get the text content from the element
      const title = titleElement?.textContent?.trim();
      setJobstitle(title);
    }

    const companyNameEle = document.querySelector('[data-testid="detailText"]');

    if (companyNameEle) {
      // Get the text content from the element
      const inputString = companyNameEle?.textContent?.trim();
      const companyName = removeRatingFromEnd(inputString);
      setCompanyName(companyName);
    }

    setEmployment("n/a");
    setJobType("n/a");
    setPostedDate("n/a");
    setEasyApply(0);

    const jobDescriptionEle = document.querySelector(".css-1vbe1p2");
    if (jobDescriptionEle) {
      // Get the text content from the element
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }

    // end of   desing where there is tab section in that page

    //  this is for where ther is no tabs in listing page

    const titleElement2 = document.querySelector(".JobDetails_jobTitle__Rw_gn");

    if (titleElement2) {
      // Get the text content from the element
      const title = titleElement2?.textContent?.trim();
      if (title) {
        setJobstitle(title);
      }
    }

    const companyNameEle2 = document.querySelector(
      ".EmployerProfile_employerName__8w0tV"
    );

    if (companyNameEle2) {
      // Get the text content from the element
      const companyName = companyNameEle2?.textContent?.trim();
      if (companyName) {
        setCompanyName(companyName);
      }
    }

    const jobDescriptionEle2 = document.querySelector(
      ".JobDetails_jobDescription__6VeBn"
    );
    if (jobDescriptionEle2) {
      // Get the text content from the element
      const description = jobDescriptionEle2?.innerHTML;
      setJobDescription(description);
    }

    setSource("glassdoor");
  };

  const getJobFromSimplyhired = (): void => {
    setPostUrl(window.location.href);
    // this is for the desing where there is tab section in that page
    const titleElement = document.querySelector('[data-testid="viewJobTitle"]');

    if (titleElement) {
      // Get the text content from the element
      const title = titleElement?.textContent?.trim();
      setJobstitle(title);
    }

    const companyNameEle = document.querySelector(
      // '[data-test="employer-name"]'
      '[data-testid="detailText"]'
    );

    console.log("companyNameEle---", companyNameEle);
    if (companyNameEle) {
      // Get the text content from the element
      const inputString = companyNameEle?.textContent?.trim();
      setCompanyName(inputString);
    }

    setEmployment("n/a");
    setJobType("n/a");
    setPostedDate("n/a");
    setCity("n/a");
    setState("n/a");
    setEasyApply(0);

    const jobDescriptionEle = document.querySelector(
      '[data-testid="viewJobBodyJobFullDescriptionContent"]'
    );
    if (jobDescriptionEle) {
      // Get the text content from the element
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }

    setSource("simplyhired");
  };

  useEffect(() => {
    if (window.location.href.includes("linkedin.")) {
      getContentFromLinkedInJobs();
    }
    if (window.location.href.includes("indeed.")) {
      getJobsFromIndeed();
    }
    if (window.location.href.includes("dice.")) {
      getJobsFromDice();
    }
    if (window.location.href.includes("ziprecruiter.")) {
      getJobFromZipRecruiter();
    }
    if (
      window.location.href.includes("glassdoor.") &&
      window.location.href.includes("job-listing")
    ) {
      getJobFromGlassdoor();
    }

    if (window.location.href.includes("simplyhired.")) {
      getJobFromSimplyhired();
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
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }
    if (jobType === null) {
      setErrorMessage("Please pick a job type");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }
    if (employment === null) {
      setErrorMessage("Please pick a employment type");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }
    const data = {
      companyName,
      jobTitle: jobsTitle,
      location: companyLocation,
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
    };

    // const url = "https://d2fa6tipx2eq6v.cloudfront.net/public/jobs";
    const url = "https://backend.careerai.io/public/jobs";
    // 'http://localhost:8000/public/jobs';
    const settings = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    try {
      const fetchResponse = await fetch(url, settings);
      const data = await fetchResponse.json();
      if (data?.status === "failed") {
        handleAlreadySaved();
        return;
      }
      if (data?.status === "error") {
        handleFailed();
      } else {
        handleSuccess();
      }
      return;
    } catch (e) {
      handleFailed();
      console.log(e);
    }
  };

  const checkJobStatus = async () => {
    const data = {
      jobLink: postUrl,
    };
    if (!postUrl) {
      return;
    }

    const url = "https://backend.careerai.io/public/jobs/check-job-status";
    // const url =
    // "https://d2fa6tipx2eq6v.cloudfront.net/public/jobs/check-job-status";

    const settings = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    try {
      const fetchResponse = await fetch(url, settings);
      const response = await fetchResponse.json();
      if (response?.data?.already_saved) {
        setAlreadySavedStatus(true);
        return;
      } else {
        setAlreadySavedStatus(false);
      }
      return;
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    checkJobStatus();
  }, [postUrl]);

  return (
    <div className="job__detail__container">
      <div className="job_detail_header"> Jobs Hunter </div>
      <AllInputField
        companyName={companyName}
        setCompanyName={setCompanyName}
        jobsTitle={jobsTitle}
        setJobstitle={setJobstitle}
        postedDate={postedDate}
        setPostedDate={setPostedDate}
        companyLocation={companyLocation}
        setCompanyLocation={setCompanyLocation}
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
        jobDetails={jobDetails}
        setJobDetails={setJobDetails}
        companyInfo={companyInfo}
        setCompanyInfo={setCompanyInfo}
        skills={skills}
        setSkills={setSkills}
        employment={employment}
        setEmployment={setEmployment}
        state={state}
        setState={setState}
        city={city}
        setCity={setCity}
        easyApply={easyApply}
        setEasyApply={setEasyApply}
      />

      <div className="job__detail__footer">
        <div>
          {alreadySavedStatus ? (
            <button className="job_saved_button" disabled={true}>
              Saved
            </button>
          ) : (
            <button className="job_save_button" onClick={handleSaveClick}>
              Save
            </button>
          )}
        </div>
        {success ? <div className="success">Saved successfully</div> : null}
        {failed ? <div className="failed">Saving failed</div> : null}
        {errorMessage?.length > 0 && (
          <div className="failed">{errorMessage}</div>
        )}
      </div>
    </div>
  );
};

export default JobFrom;
