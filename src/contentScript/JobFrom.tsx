import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import AllInputField from './AllInputField';
import {
  dateExtractorFromDom,
  extractDateFromDiceDom,
  extractDateFromZipRecruterDom,
} from './helper';

const JobFrom = (props: any) => {
  const [companyName, setCompanyName] = useState<string>('');
  const [jobsTitle, setJobstitle] = useState<string>('');
  const [companyLocation, setCompanyLocation] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<any>('');
  const [postUrl, setPostUrl] = useState<string>('');
  const [postedDate, setPostedDate] = useState<any>('');
  const [jobType, setJobType] = useState<any>('');
  const [activeUrl, setActiveUrl] = useState<string>(window.location.href);
  const [debounceValue] = useDebounce(activeUrl, 3000);
  const targetElementRef = useRef();
  const [success, setSuccess] = useState<Boolean>(false);
  const [failed, setFailed] = useState<Boolean>(false);
  const [errorMessage, setErrorMessage] = useState<any>('');
  const [category, setCategory] = useState<any>(null);
  const [source, setSource] = useState<any>('');
  const [alreadySavedStatus, setAlreadySavedStatus] = useState<Boolean>(false);

  function isDateString(str) {
    // Attempt to create a new Date object from the string
    let date = new Date(str);

    // Check if the created date is valid and the original string is not empty
    return !isNaN(date.getTime()) && !isNaN(Date.parse(str));
  }

  const getContentFromLinkedInJobs = (): void => {
    try {
      setPostUrl(window.location.href);

      const jobsBody = document?.getElementsByClassName(
        'job-details-jobs-unified-top-card__job-title'
      );
      if (jobsBody[0]) {
        setJobstitle(jobsBody[0]?.textContent.trim());
      }

      setTimeout(() => {
        let jobDetailsElement = document?.getElementById('job-details');

        const about = jobDetailsElement?.querySelector('span');

        setJobDescription(about?.innerHTML);
      }, 500);

      // find posted date

      const daysAgoEle = document?.querySelector('#job-details');
      const targetElement = document.querySelector('#job-details');
      let date = [];
      // Check if the element is found
      if (targetElement) {
        // Get the next sibling element
        const nextElement = targetElement.nextElementSibling;

        // Check if the next sibling exists
        if (nextElement) {
          const modifiedDate = nextElement.innerHTML
            .replace('Posted on ', '')
            .replace('.', '');
          if (isDateString(modifiedDate)) {
            setPostedDate(modifiedDate);
          } else {
            setPostedDate('n/a');
          }
        }
      } else {
        setPostedDate('n/a');
      }

      // const getExactpostedDate = dateExtractorFromDom(daysAgoEle);
      // setPostedDate(getExactpostedDate);

      // Find the first <span> element inside the jobDetailsElement
      const jobType = document?.querySelector(
        '.job-details-jobs-unified-top-card__job-insight > span'
      );

      console.log(jobType);
      const jobTypeText = jobType?.innerHTML?.replace(/<!---->/g, '')?.trim();
      if (
        jobTypeText?.toLowerCase() === 'remote' ||
        jobTypeText?.toLowerCase() === 'on-site' ||
        jobTypeText?.toLowerCase() === 'hybrid'
      ) {
        setJobType(jobTypeText);
      } else {
        setJobType('n/a');
      }

      const values = ['Remote', 'Hybrid', 'On-site'];

      const jobTypeElement = Array.from(
        document.querySelectorAll(
          '.job-details-jobs-unified-top-card__job-insight-view-model-secondary'
        )
      ).find((element) =>
        values.some((value) => element.textContent.includes(value))
      );
      console.log(jobTypeElement);
      if (jobTypeElement) {
        const jobTypeText = jobTypeElement.textContent.trim();

        setJobType(jobTypeText);
      } else {
        setJobType('n/a');
      }

      const jobDetailsElement = document.querySelector(
        '.job-details-jobs-unified-top-card__job-insight'
      );

      if (jobDetailsElement) {
        // Extract location information
        const locationElements = Array.from(
          jobDetailsElement.querySelectorAll(
            'span.job-details-jobs-unified-top-card__job-insight-view-model-secondary'
          )
        );

        // Extract locations with 'Remote', 'Hybrid', or 'On-site'
        const validLocations = locationElements
          .filter((element) =>
            ['Remote', 'Hybrid', 'On-site'].some((location) =>
              element.textContent.includes(location)
            )
          )
          .map((element) => element.textContent.trim());
        console.log(validLocations, 'location');

        // Log or use the extracted information as needed
        setJobType(validLocations);
      } else {
        setJobType('n/a');
      }
      setSource('linkedin');

      const location = document.getElementsByClassName(
        'job-details-jobs-unified-top-card__bullet'
      );
      if (location[0]) {
        setCompanyLocation(location[0]?.textContent?.trim());
      }

      // Assuming you have a reference to the DOM element
      setTimeout(() => {
        const domElement = document?.querySelector(
          '.jobs-unified-top-card.t-14'
        );

        const aTag = domElement?.querySelector('a.app-aware-link');
        const companyName = aTag?.textContent;
        setCompanyName(companyName?.trim());
      }, 500);
    } catch (error) {
      console.log('error---', error);
    }
  };

  const getJobsFromIndeed = (): void => {
    setPostUrl(window.location.href);

    setTimeout(() => {
      const titleElement = document?.querySelector(
        '.jobsearch-JobInfoHeader-title'
      );
      // Get the text content from the titleElement
      const text = titleElement?.textContent?.trim();
      // Extract "React.js Developer"
      const jobTitle = text?.split(' - ')[0];
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

    const about = document.getElementById('jobDescriptionText');
    setJobDescription(about?.innerHTML);

    setJobType('n/a');
    setPostedDate('n/a');
    setSource('indeed');
  };

  const getJobsFromDice = (): void => {
    setPostUrl(window.location.href);
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
    if (companyNameEle) {
      // Get the text content from the element
      const companyName = companyNameEle?.textContent?.trim();
      setCompanyName(companyName);
    }
    // Get the HTML element by its data-testid attribute
    const locationElement = document.querySelector(
      '[data-cy="locationDetails"]'
    );
    if (locationElement) {
      // Get the text content from the element
      const location = locationElement?.textContent?.trim();
      setCompanyLocation(location);
    } else {
      setCompanyLocation('n/a');
    }

    // Get the HTML element by its data-testid attribute
    const dateElement = document.querySelector('#timeAgo');
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
        jobType?.toLowerCase() === 'remote' ||
        jobType?.toLowerCase() === 'on site' ||
        jobType?.toLowerCase() === 'hybrid'
      ) {
        setJobType(jobTypeText);
      } else {
        setJobType('n/a');
      }
      setJobType(jobType);
    } else {
      setJobType('n/a');
    }
    setSource('dice');
  };

  const getJobFromZipRecruiter = (): void => {
    setPostUrl(window.location.href);

    const titleEle = document.querySelector('.job_title');
    const title = titleEle?.textContent?.trim();
    setJobstitle(title);

    let companyEle = document.querySelector('.hiring_company');
    if (companyEle) {
      const companyName = companyEle?.textContent?.trim();
      setCompanyName(companyName);
    } else {
      companyEle = document.querySelector('.job_company');
      const companyName = companyEle?.textContent?.trim();
      setCompanyName(companyName);
    }

    const dateEle = document.querySelector('.text-muted');

    // const date = extractDateFromZipRecruterDom(dateEle);
    // setPostedDate(date);
    setPostedDate('n/a');

    let locationEle = document.querySelector('.hiring_location');
    if (locationEle) {
      const location = locationEle?.textContent?.trim();
      setCompanyLocation(location);
    } else {
      locationEle = document.querySelector('.job_location');
      const location = locationEle?.textContent?.trim();
      setCompanyLocation(location);
    }

    const jobDescriptionEle = document.querySelector('.job_description');
    if (jobDescriptionEle) {
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }
    const jobType = document.querySelector('.remote_tag');
    if (jobType) {
      const text = jobType?.innerHTML;
      console.log;
      setJobType(text);
    } else {
      setJobType('n/a');
    }
    setSource('zip recruiter');
  };

  useEffect(() => {
    if (window.location.href.includes('linkedin.')) {
      getContentFromLinkedInJobs();
    }
    if (window.location.href.includes('indeed.')) {
      getJobsFromIndeed();
    }
    if (window.location.href.includes('dice.')) {
      getJobsFromDice();
    }
    if (window.location.href.includes('ziprecruiter.')) {
      getJobFromZipRecruiter();
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
    setCategory(null);
  };

  // Function to handle API call error
  const handleFailed = () => {
    setFailed(true);

    // Hide error message after some seconds (e.g., 3 seconds)
    setTimeout(() => {
      setFailed(false);
    }, 3000);
    setCategory(null);
  };

  const handleAlreadySaved = () => {
    setErrorMessage('Already Saved');
    setCategory(null);
    // Hide error message after some seconds (e.g., 3 seconds)
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  const handleSaveClick = async () => {
    if (category === null) {
      setErrorMessage('Please pick a category');
      setTimeout(() => {
        setErrorMessage('');
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
      jobType,
      category: category?.value,
    };

    const url = 'https://backend.careerai.io/public/jobs';
    // 'http://localhost:8000/public/jobs';
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    try {
      const fetchResponse = await fetch(url, settings);
      const data = await fetchResponse.json();
      if (data?.status === 'failed') {
        handleAlreadySaved();
        return;
      }
      handleSuccess();

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

    const url = 'https://backend.careerai.io/public/jobs/check-job-status';
    // 'http://localhost:8000/public/jobs';
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
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
