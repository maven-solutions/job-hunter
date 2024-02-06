import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import AllInputField from "./AllInputField";
import {
  dateExtractorFromDom,
  extractDateFromDiceDom,
  extractDateFromZipRecruterDom,
} from "./helper";

const JobFrom = (props: any) => {
  const { setShowForm } = props;
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [jobsTitle, setJobstitle] = useState<string>("");
  const [companyLocation, setCompanyLocation] = useState<string>("");
  const [jobDetails, setJobDetails] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<any>(
    "<b>Job Description</b>"
  );
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
  const [notification, setNotification] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

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
      ".EmployerProfile_employerName__Xemli"
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
    if (easyApply === 0) {
      setErrorMessage("Easy apply is required.");
      setHasErrors(true);
      setInputErrors((prev) => {
        return { ...prev, easyApply: "Easy apply is required." };
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
      easyApply !== 0 &&
      jobType !== null &&
      employment !== null
    ) {
      setHasErrors(false);
      setNotification(true);
    } else {
      setNotification(false);
      setLoading(false);
      return false;
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

    const url = "https://d2fa6tipx2eq6v.cloudfront.net/public/jobs";
    // const url = "https://backend.careerai.io/public/jobs";
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
        setLoading(false);
        setNotification(false);
        setTimeout(() => {
          setNotification(false);
        }, 3000);
        return;
      }
      if (data?.status === "error") {
        handleFailed();
        setLoading(false);
        setNotification(false);
        setTimeout(() => {
          setNotification(false);
        }, 3000);
      } else {
        handleSuccess();
        setLoading(false);
        setNotification(false);
        setSavedNotification(true);
        checkJobStatus();
        setTimeout(() => {
          setSavedNotification(false);
        }, 3000);
      }
      return;
    } catch (e) {
      handleFailed();
      setLoading(false);
      setNotification(false);
      // console.log(e);
      setTimeout(() => {
        setNotification(false);
      }, 3000);
    }
  };

  const checkJobStatus = async () => {
    const data = {
      jobLink: postUrl,
    };
    if (!postUrl) {
      return;
    }

    // const url = "https://backend.careerai.io/public/jobs/check-job-status";
    const url =
      "https://d2fa6tipx2eq6v.cloudfront.net/public/jobs/check-job-status";

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
        setSavedNotification(true);
        setTimeout(() => {
          setSavedNotification(false);
        }, 3000);
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

  // useEffect(() => {
  //   checkJobStatus();
  // }, []);

  const CloseIcon = () => {
    return (
      <svg
        width="12"
        height="10"
        viewBox="0 0 12 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6.6005 0.999838L10.6006 4.99992L6.6005 9" fill="#4339F2" />
        <path
          d="M6.6005 0.999838L10.6006 4.99992L6.6005 9"
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path d="M1.00001 0.999838L5.00009 4.99992L1.00001 9" fill="#4339F2" />
        <path
          d="M1.00001 0.999838L5.00009 4.99992L1.00001 9"
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="job__detail__container">
      <div className="job__detail__container-inner">
        <div className="job_detail_header"> Jobs Hunter </div>
      </div>
      <div className="scroll-form">
        <div className="jobs__collapse" onClick={() => setShowForm(false)}>
          <CloseIcon />
        </div>
        {notification && (
          <div className="jobs-notification">
            <div className="jobs-notification-inner">
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.33334 7.5C8.11232 7.5 7.90036 7.5878 7.74408 7.74408C7.5878 7.90036 7.5 8.11232 7.5 8.33333V11.6667C7.5 11.8877 7.5878 12.0996 7.74408 12.2559C7.90036 12.4122 8.11232 12.5 8.33334 12.5C8.55435 12.5 8.76631 12.4122 8.92259 12.2559C9.07887 12.0996 9.16667 11.8877 9.16667 11.6667V8.33333C9.16667 8.11232 9.07887 7.90036 8.92259 7.74408C8.76631 7.5878 8.55435 7.5 8.33334 7.5ZM8.65 4.23333C8.44712 4.14999 8.21955 4.14999 8.01667 4.23333C7.91438 4.273 7.82092 4.33247 7.74167 4.40833C7.66806 4.48933 7.60887 4.58235 7.56667 4.68333C7.52002 4.78223 7.49719 4.89069 7.5 5C7.49937 5.10967 7.52039 5.21839 7.56186 5.31992C7.60333 5.42145 7.66444 5.5138 7.74167 5.59167C7.82267 5.66528 7.91568 5.72447 8.01667 5.76667C8.14292 5.81853 8.27997 5.8386 8.41579 5.82509C8.55161 5.81159 8.68203 5.76493 8.7956 5.68922C8.90916 5.61351 9.00239 5.51107 9.06709 5.39089C9.1318 5.27072 9.16599 5.13649 9.16667 5C9.1636 4.77936 9.07728 4.56803 8.925 4.40833C8.84575 4.33247 8.7523 4.273 8.65 4.23333ZM8.33334 0C6.68516 0 5.07399 0.488742 3.70358 1.40442C2.33318 2.3201 1.26507 3.62159 0.634341 5.1443C0.0036107 6.66702 -0.161417 8.34258 0.160126 9.95909C0.48167 11.5756 1.27534 13.0605 2.44078 14.2259C3.60622 15.3913 5.09108 16.185 6.70758 16.5065C8.32409 16.8281 9.99965 16.6631 11.5224 16.0323C13.0451 15.4016 14.3466 14.3335 15.2622 12.9631C16.1779 11.5927 16.6667 9.98151 16.6667 8.33333C16.6667 7.23898 16.4511 6.15535 16.0323 5.1443C15.6135 4.13326 14.9997 3.2146 14.2259 2.44078C13.4521 1.66696 12.5334 1.05313 11.5224 0.634337C10.5113 0.215548 9.42769 0 8.33334 0ZM8.33334 15C7.0148 15 5.72586 14.609 4.62954 13.8765C3.53321 13.1439 2.67872 12.1027 2.17414 10.8846C1.66956 9.66638 1.53753 8.32594 1.79477 7.03273C2.052 5.73952 2.68694 4.55164 3.61929 3.61929C4.55164 2.68694 5.73953 2.052 7.03274 1.79477C8.32594 1.53753 9.66639 1.66955 10.8846 2.17414C12.1027 2.67872 13.1439 3.5332 13.8765 4.62953C14.609 5.72586 15 7.01479 15 8.33333C15 10.1014 14.2976 11.7971 13.0474 13.0474C11.7971 14.2976 10.1014 15 8.33334 15Z"
                  fill="#0145FD"
                />
              </svg>
              <div className="text">
                Your job details are being saved, thank you for your patience!
              </div>
              <button type="button">
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.11643 4.49963L7.87068 1.74945C7.953 1.66712 7.99925 1.55545 7.99925 1.43902C7.99925 1.32258 7.953 1.21092 7.87068 1.12859C7.78836 1.04625 7.6767 1 7.56028 1C7.44386 1 7.33221 1.04625 7.24988 1.12859L4.5 3.88313L1.75012 1.12859C1.66779 1.04625 1.55614 1 1.43972 1C1.3233 1 1.21164 1.04625 1.12932 1.12859C1.04699 1.21092 1.00075 1.32258 1.00075 1.43902C1.00075 1.55545 1.04699 1.66712 1.12932 1.74945L3.88357 4.49963L1.12932 7.2498C1.08834 7.29045 1.05582 7.33881 1.03362 7.39209C1.01143 7.44537 1 7.50252 1 7.56024C1 7.61795 1.01143 7.6751 1.03362 7.72838C1.05582 7.78166 1.08834 7.83002 1.12932 7.87067C1.16996 7.91165 1.21831 7.94418 1.27159 7.96637C1.32486 7.98857 1.382 8 1.43972 8C1.49743 8 1.55457 7.98857 1.60785 7.96637C1.66112 7.94418 1.70948 7.91165 1.75012 7.87067L4.5 5.11612L7.24988 7.87067C7.29052 7.91165 7.33888 7.94418 7.39215 7.96637C7.44543 7.98857 7.50257 8 7.56028 8C7.618 8 7.67514 7.98857 7.72841 7.96637C7.78169 7.94418 7.83004 7.91165 7.87068 7.87067C7.91166 7.83002 7.94418 7.78166 7.96638 7.72838C7.98857 7.6751 8 7.61795 8 7.56024C8 7.50252 7.98857 7.44537 7.96638 7.39209C7.94418 7.33881 7.91166 7.29045 7.87068 7.2498L5.11643 4.49963Z"
                    fill="#333333"
                    stroke="#333333"
                    stroke-width="0.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        {savedNotification && (
          <div className="jobs-notification">
            <div className="jobs-notification-inner jobs-notification-inner-saved">
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.67145 9.59522L7.02542 9.94919L7.37897 9.59481L10.9525 6.01294C10.9527 6.01273 10.9529 6.01253 10.9531 6.01232C11.0155 5.95062 11.0997 5.91601 11.1875 5.91601C11.2756 5.91601 11.36 5.95085 11.4225 6.01294L11.4229 6.01333C11.4541 6.04432 11.4789 6.08119 11.4959 6.12181L11.9574 5.92952L11.4959 6.12181C11.5128 6.16243 11.5215 6.20599 11.5215 6.25C11.5215 6.29401 11.5128 6.33757 11.4959 6.37819L11.9574 6.57048L11.4959 6.37819C11.4789 6.41881 11.4541 6.45568 11.4229 6.48666L11.4214 6.48811L7.25623 10.6533C7.25605 10.6535 7.25587 10.6537 7.25568 10.6539C7.19365 10.7151 7.11009 10.7496 7.0229 10.75L7.02212 10.75C6.97825 10.7503 6.93476 10.7419 6.89414 10.7253C6.85391 10.7088 6.81729 10.6847 6.78633 10.6542C6.78603 10.6539 6.78574 10.6536 6.78545 10.6533L4.82931 8.68886L4.8153 8.6748L4.80023 8.66189C4.76534 8.63201 4.737 8.59524 4.71699 8.55389C4.69698 8.51253 4.68574 8.46749 4.68397 8.42158C4.68219 8.37567 4.68993 8.3299 4.70669 8.28712C4.72344 8.24434 4.74886 8.2055 4.78135 8.17301C4.81383 8.14053 4.85268 8.11511 4.89546 8.09835C4.93823 8.08159 4.98401 8.07386 5.02992 8.07563C5.07582 8.0774 5.12087 8.08865 5.16222 8.10865C5.20358 8.12866 5.24035 8.157 5.27023 8.19189L5.28279 8.20656L5.29645 8.22022L6.67145 9.59522ZM3.98137 1.82015C5.26956 0.959417 6.78405 0.5 8.33334 0.5C9.36203 0.5 10.3806 0.702615 11.331 1.09628C12.2814 1.48994 13.1449 2.06694 13.8723 2.79433C14.5997 3.52172 15.1767 4.38526 15.5704 5.33565C15.9641 6.28603 16.1667 7.30465 16.1667 8.33333C16.1667 9.88262 15.7073 11.3971 14.8465 12.6853C13.9858 13.9735 12.7624 14.9775 11.331 15.5704C9.89967 16.1633 8.32465 16.3184 6.80513 16.0162C5.28561 15.7139 3.88985 14.9678 2.79433 13.8723C1.69882 12.7768 0.95277 11.3811 0.650519 9.86154C0.348268 8.34202 0.503394 6.767 1.09628 5.33565C1.68917 3.90429 2.69319 2.68089 3.98137 1.82015ZM4.35175 14.2922C5.5303 15.0797 6.9159 15.5 8.33334 15.5C10.2341 15.5 12.0569 14.7449 13.4009 13.4009C14.7449 12.0569 15.5 10.2341 15.5 8.33333C15.5 6.9159 15.0797 5.5303 14.2922 4.35175C13.5047 3.17319 12.3854 2.25463 11.0759 1.7122C9.76636 1.16977 8.32539 1.02785 6.93519 1.30437C5.54499 1.5809 4.26801 2.26346 3.26574 3.26574C2.26346 4.26801 1.5809 5.54499 1.30438 6.93519C1.02785 8.32538 1.16977 9.76636 1.7122 11.0759C2.25463 12.3854 3.1732 13.5047 4.35175 14.2922Z"
                  stroke="#23A047"
                />
              </svg>

              <div className="text">
                Your job details have been saved successfully!
              </div>
              <button type="button" onClick={() => setSavedNotification(false)}>
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.11643 4.49963L7.87068 1.74945C7.953 1.66712 7.99925 1.55545 7.99925 1.43902C7.99925 1.32258 7.953 1.21092 7.87068 1.12859C7.78836 1.04625 7.6767 1 7.56028 1C7.44386 1 7.33221 1.04625 7.24988 1.12859L4.5 3.88313L1.75012 1.12859C1.66779 1.04625 1.55614 1 1.43972 1C1.3233 1 1.21164 1.04625 1.12932 1.12859C1.04699 1.21092 1.00075 1.32258 1.00075 1.43902C1.00075 1.55545 1.04699 1.66712 1.12932 1.74945L3.88357 4.49963L1.12932 7.2498C1.08834 7.29045 1.05582 7.33881 1.03362 7.39209C1.01143 7.44537 1 7.50252 1 7.56024C1 7.61795 1.01143 7.6751 1.03362 7.72838C1.05582 7.78166 1.08834 7.83002 1.12932 7.87067C1.16996 7.91165 1.21831 7.94418 1.27159 7.96637C1.32486 7.98857 1.382 8 1.43972 8C1.49743 8 1.55457 7.98857 1.60785 7.96637C1.66112 7.94418 1.70948 7.91165 1.75012 7.87067L4.5 5.11612L7.24988 7.87067C7.29052 7.91165 7.33888 7.94418 7.39215 7.96637C7.44543 7.98857 7.50257 8 7.56028 8C7.618 8 7.67514 7.98857 7.72841 7.96637C7.78169 7.94418 7.83004 7.91165 7.87068 7.87067C7.91166 7.83002 7.94418 7.78166 7.96638 7.72838C7.98857 7.6751 8 7.61795 8 7.56024C8 7.50252 7.98857 7.44537 7.96638 7.39209C7.94418 7.33881 7.91166 7.29045 7.87068 7.2498L5.11643 4.49963Z"
                    fill="#333333"
                    stroke="#333333"
                    stroke-width="0.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
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
          inputErrors={inputErrors}
        />
      </div>

      <div className="job__detail__footer">
        {success ? <div className="success">Saved successfully</div> : null}
        {failed ? <div className="failed">Saving failed</div> : null}
        {errorMessage?.length > 0 && (
          <div className="failed">Fill the required fields</div>
        )}
        <div>
          {alreadySavedStatus ? (
            <button className="job_saved_button" disabled={true}>
              Saved
            </button>
          ) : (
            <button className="job_save_button" onClick={handleSaveClick}>
              {loading ? (
                <>
                  <div id="jhloading"></div>Saving
                </>
              ) : (
                "Save"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobFrom;
