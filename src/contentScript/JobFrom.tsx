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
    const jobDescriptionEle = zipDom.querySelector(".job_description");
    if (jobDescriptionEle) {
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
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
    setCompanyLocation("n/a");
    setJobType("n/a");
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
        width="23"
        height="23"
        viewBox="0 0 23 23"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.5 0C5.175 0 0 5.175 0 11.5C0 17.825 5.175 23 11.5 23C17.825 23 23 17.825 23 11.5C23 5.175 17.825 0 11.5 0ZM15.755 14.145C16.215 14.605 16.215 15.295 15.755 15.755C15.295 16.215 14.605 16.215 14.145 15.755L11.5 13.11L8.855 15.755C8.395 16.215 7.705 16.215 7.245 15.755C6.785 15.295 6.785 14.605 7.245 14.145L9.89 11.5L7.245 8.855C6.785 8.395 6.785 7.705 7.245 7.245C7.705 6.785 8.395 6.785 8.855 7.245L11.5 9.89L14.145 7.245C14.605 6.785 15.295 6.785 15.755 7.245C16.215 7.705 16.215 8.395 15.755 8.855L13.11 11.5L15.755 14.145Z"
          fill="#6F747C"
        />
      </svg>
    );
  };

  return (
    <div className="job__detail__container">
      <div className="jd-inner">
        <div className="jobs__collapse" onClick={() => setShowForm(false)}>
          <CloseIcon />
        </div>
        <div className="jd-bg-1">
          <svg
            width="275"
            height="491"
            viewBox="0 0 275 491"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M324.429 96.9543C285.258 109.11 228.882 72.0252 199.502 69.7397C172.605 67.6492 138.261 88.3669 118.379 111.74C98.4893 135.12 95.025 173.329 115.807 195.863C124.851 205.664 137.31 211.757 146.507 221.424C175.927 252.358 161.083 303.643 174.823 344.076C190.654 390.674 242.504 415.543 291.378 421.339C322.461 425.027 355.708 422.592 382.121 405.76C408.53 388.933 425.572 354.833 415.322 325.266C406.086 298.622 376.902 274.522 387.698 248.454C395.24 230.22 418.06 224.856 433.43 212.483C457.51 193.092 460.957 154.968 445.574 128.178C430.195 101.4 411.408 81.9743 380.54 83.5293C366.141 84.262 338.198 92.6696 324.429 96.9543Z"
              fill="#F1F4FF"
            />
            <path
              d="M258.742 306.482C277.356 287.985 302.134 276.118 329.61 272.062C401.452 261.47 428.828 203.482 428.375 177.519C427.841 147.363 411.422 117.025 388.046 94.2882C364.669 71.5525 334.88 55.824 304.294 44.9193C280.387 36.4062 255.11 30.5796 230.955 33.089C207.368 35.552 186.356 45.7642 166.139 56.2368C140.135 69.7013 114.165 84.1422 94.6384 105.104C78.7119 122.191 67.4585 147.68 79.5683 170.134C89.8942 189.271 113.946 199.832 123.945 219.097C137.944 246.076 118.182 275.335 124.01 304.197C130.8 337.859 163.787 359.759 186.596 355.073C210.385 350.2 238.12 326.988 258.742 306.482Z"
              stroke="#EEF2FF"
              stroke-width="4"
              stroke-miterlimit="10"
            />
          </svg>
        </div>
        <div className="jd-bg-2">
          <svg
            width="268"
            height="246"
            viewBox="0 0 268 246"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M193.396 182.135C157.191 159.355 148.316 89.5395 130.193 64.7176C113.6 41.9945 73.8888 28.8473 41.8856 28.9564C9.87202 29.0651 -22.7432 52.2445 -26.4922 83.9938C-28.1194 97.807 -24.4921 111.81 -25.9097 125.653C-30.4518 169.945 -81.145 192.981 -103.849 231.297C-130.019 275.452 -114.539 333.395 -85.9701 376.039C-67.8023 403.163 -43.3167 427.844 -12.0647 437.346C19.1816 446.848 57.7547 437.211 74.2205 409.032C89.0583 383.639 88.3472 344.172 116.32 335.037C135.88 328.64 155.611 343.076 175.841 346.856C207.537 352.774 240.073 329.638 250.856 299.277C261.633 268.928 264.273 240.867 242.098 217.471C231.749 206.563 206.131 190.134 193.396 182.135Z"
              fill="#F1F4FF"
            />
            <path
              d="M-17.1356 272.262C10.1448 274.457 36.3554 286.032 58.2096 305.044C115.342 354.762 179.848 337.104 200.105 319.13C223.629 298.248 236.52 264.659 238.669 230.717C240.818 196.774 233.065 162.508 220.951 130.882C211.474 106.17 198.939 82.1951 180.564 64.7652C162.61 47.753 140.265 38.0379 118.253 29.1295C89.945 17.6674 60.8867 6.89439 31.0347 5.65005C6.69508 4.62749 -21.1299 13.0075 -30.6993 37.8337C-38.8515 58.9964 -30.8981 85.213 -39.374 106.203C-51.246 135.597 -87.8292 139.795 -106.737 163.992C-128.793 192.21 -123.759 233.197 -104.573 248.084C-84.5722 263.621 -47.3692 269.841 -17.1356 272.262Z"
              stroke="#EEF2FF"
              stroke-width="4"
              stroke-miterlimit="10"
            />
          </svg>
        </div>
        <div className="job__detail__container-inner">
          <div className="job_detail_header">
            <svg
              width="110"
              height="18"
              viewBox="0 0 110 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.8047 16.4521C11.6803 16.9964 10.2122 17.2686 8.40039 17.2686C6.03711 17.2686 4.17871 16.5739 2.8252 15.1846C1.47168 13.7952 0.794922 11.944 0.794922 9.63086C0.794922 7.16732 1.55404 5.16927 3.07227 3.63672C4.59766 2.10417 6.57422 1.33789 9.00195 1.33789C10.5059 1.33789 11.7734 1.52767 12.8047 1.90723V5.24805C11.7734 4.63216 10.599 4.32422 9.28125 4.32422C7.83464 4.32422 6.66732 4.77897 5.7793 5.68848C4.89128 6.59798 4.44727 7.82975 4.44727 9.38379C4.44727 10.8734 4.86621 12.0622 5.7041 12.9502C6.54199 13.8311 7.66992 14.2715 9.08789 14.2715C10.4414 14.2715 11.6803 13.9421 12.8047 13.2832V16.4521ZM24.3096 17H21.0977V15.4209H21.0547C20.3171 16.6527 19.2249 17.2686 17.7783 17.2686C16.7113 17.2686 15.8698 16.9678 15.2539 16.3662C14.6452 15.7575 14.3408 14.9482 14.3408 13.9385C14.3408 11.8044 15.6048 10.5726 18.1328 10.2432L21.1191 9.8457C21.1191 8.64258 20.4674 8.04102 19.1641 8.04102C17.8535 8.04102 16.6074 8.43132 15.4258 9.21191V6.65527C15.8984 6.41178 16.543 6.19694 17.3594 6.01074C18.1829 5.82454 18.9313 5.73145 19.6045 5.73145C22.7412 5.73145 24.3096 7.29622 24.3096 10.4258V17ZM21.1191 12.5312V11.79L19.1211 12.0479C18.0182 12.1911 17.4668 12.6888 17.4668 13.541C17.4668 13.9277 17.5993 14.2464 17.8643 14.4971C18.1364 14.7406 18.5016 14.8623 18.96 14.8623C19.5973 14.8623 20.1165 14.6439 20.5176 14.207C20.9186 13.763 21.1191 13.2044 21.1191 12.5312ZM34.1709 9.06152C33.7627 8.83952 33.2865 8.72852 32.7422 8.72852C32.0046 8.72852 31.4281 9.00065 31.0127 9.54492C30.5973 10.082 30.3896 10.8161 30.3896 11.7471V17H26.9951V6H30.3896V8.04102H30.4326C30.9697 6.55143 31.9365 5.80664 33.333 5.80664C33.6911 5.80664 33.9704 5.84961 34.1709 5.93555V9.06152ZM45.5576 12.4668H38.3818C38.4964 14.0638 39.5026 14.8623 41.4004 14.8623C42.6107 14.8623 43.6742 14.5758 44.5908 14.0029V16.4521C43.5739 16.9964 42.2526 17.2686 40.627 17.2686C38.8509 17.2686 37.4723 16.778 36.4912 15.7969C35.5101 14.8086 35.0195 13.4336 35.0195 11.6719C35.0195 9.8457 35.5495 8.39909 36.6094 7.33203C37.6693 6.26497 38.9727 5.73145 40.5195 5.73145C42.1237 5.73145 43.3626 6.20768 44.2363 7.16016C45.1172 8.11263 45.5576 9.40527 45.5576 11.0381V12.4668ZM42.4102 10.3828C42.4102 8.80729 41.7728 8.01953 40.498 8.01953C39.9538 8.01953 39.4811 8.24512 39.0801 8.69629C38.6862 9.14746 38.4463 9.70964 38.3604 10.3828H42.4102ZM57.46 12.4668H50.2842C50.3988 14.0638 51.4049 14.8623 53.3027 14.8623C54.513 14.8623 55.5765 14.5758 56.4932 14.0029V16.4521C55.4762 16.9964 54.1549 17.2686 52.5293 17.2686C50.7533 17.2686 49.3747 16.778 48.3936 15.7969C47.4124 14.8086 46.9219 13.4336 46.9219 11.6719C46.9219 9.8457 47.4518 8.39909 48.5117 7.33203C49.5716 6.26497 50.875 5.73145 52.4219 5.73145C54.026 5.73145 55.265 6.20768 56.1387 7.16016C57.0195 8.11263 57.46 9.40527 57.46 11.0381V12.4668ZM54.3125 10.3828C54.3125 8.80729 53.6751 8.01953 52.4004 8.01953C51.8561 8.01953 51.3835 8.24512 50.9824 8.69629C50.5885 9.14746 50.3486 9.70964 50.2627 10.3828H54.3125ZM66.6553 9.06152C66.2471 8.83952 65.7708 8.72852 65.2266 8.72852C64.4889 8.72852 63.9124 9.00065 63.4971 9.54492C63.0817 10.082 62.874 10.8161 62.874 11.7471V17H59.4795V6H62.874V8.04102H62.917C63.4541 6.55143 64.4209 5.80664 65.8174 5.80664C66.1755 5.80664 66.4548 5.84961 66.6553 5.93555V9.06152Z"
                fill="white"
              />
              <path
                d="M81.9092 17H78.4287V10.7266H72.0479V17H68.5781V1.5957H72.0479V7.74023H78.4287V1.5957H81.9092V17ZM95.5625 17H92.1787V15.3242H92.125C91.2871 16.6204 90.1663 17.2686 88.7627 17.2686C86.2132 17.2686 84.9385 15.7253 84.9385 12.6387V6H88.3223V12.3379C88.3223 13.8919 88.9382 14.6689 90.1699 14.6689C90.7786 14.6689 91.2656 14.4577 91.6309 14.0352C91.9961 13.6055 92.1787 13.0254 92.1787 12.2949V6H95.5625V17ZM101.868 15.7217H101.825V17H98.4307V0.714844H101.825V7.6543H101.868C102.706 6.3724 103.898 5.73145 105.445 5.73145C106.863 5.73145 107.955 6.21842 108.722 7.19238C109.488 8.16634 109.871 9.49837 109.871 11.1885C109.871 13.0218 109.424 14.4935 108.528 15.6035C107.633 16.7135 106.437 17.2686 104.94 17.2686C103.587 17.2686 102.563 16.7529 101.868 15.7217ZM101.771 11.0811V12.209C101.771 12.918 101.976 13.5052 102.384 13.9707C102.792 14.4362 103.315 14.6689 103.952 14.6689C104.726 14.6689 105.324 14.3717 105.746 13.7773C106.176 13.1758 106.391 12.3271 106.391 11.2314C106.391 10.3219 106.194 9.61296 105.8 9.10449C105.413 8.58887 104.858 8.33105 104.135 8.33105C103.454 8.33105 102.889 8.58529 102.438 9.09375C101.993 9.60221 101.771 10.2646 101.771 11.0811Z"
                fill="#FFB400"
              />
            </svg>
          </div>
        </div>
        <div className="scroll-form">
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
                <button
                  type="button"
                  onClick={() => setSavedNotification(false)}
                >
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
    </div>
  );
};

export default JobFrom;
