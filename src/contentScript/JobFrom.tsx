import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import AllInputField from "./AllInputField";

const JobFrom = (props: any) => {
  const [companyName, setCompanyName] = useState<string>("");
  const [jobsTitle, setJobstitle] = useState<string>("");
  const [companyLocation, setCompanyLocation] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<any>("");
  const [postUrl, setPostUrl] = useState<string>("");
  const [activeUrl, setActiveUrl] = useState<string>(window.location.href);
  const [debounceValue] = useDebounce(activeUrl, 3000);
  const targetElementRef = useRef();

  const getContentFromLinkedInJobs = (): void => {
    try {
      setPostUrl(window.location.href);

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

      // Find the first <span> element inside the jobDetailsElement

      const location = document.getElementsByClassName(
        "job-details-jobs-unified-top-card__bullet"
      );
      if (location[0]) {
        setCompanyLocation(location[0]?.textContent?.trim());
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
      console.log("error---", error);
    }
  };

  const getJobsFromIndeed = (): void => {
    setPostUrl(window.location.href);

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
      const location = locationElement.textContent.trim();
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
    }

    const jobDescriptionEle = document.querySelector(
      '[data-testid="jobDescriptionHtml"]'
    );
    if (jobDescriptionEle) {
      // Get the text content from the element
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }
  };

  const getJobFrozipRecuriter = (): void => {
    setPostUrl(window.location.href);

    const titleEle = document.querySelector(".u-mv--remove.u-textH2");
    const title = titleEle?.textContent?.trim();
    setJobstitle(title);

    const companyEle = document.querySelector(".text-primary.text-large");
    const companyName = companyEle?.textContent?.trim();
    setCompanyName(companyName);

    const locationEle = document.querySelector(".text-primary.text-large");
    const location = locationEle?.textContent?.trim();
    setCompanyLocation(location);

    const jobDescriptionEle = document.querySelector(".job-body");
    if (jobDescriptionEle) {
      const description = jobDescriptionEle?.innerHTML;
      setJobDescription(description);
    }
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
      getJobFrozipRecuriter();
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

  return (
    <div className="job__detail__container">
      <div className="job_detail_header"> Jobs Hunter </div>
      <AllInputField
        companyName={companyName}
        setCompanyName={setCompanyName}
        jobsTitle={jobsTitle}
        setJobstitle={setJobstitle}
        companyLocation={companyLocation}
        setCompanyLocation={setCompanyLocation}
        postUrl={postUrl}
        setPostUrl={setPostUrl}
        targetElementRef={targetElementRef}
        jobDescription={jobDescription}
        setJobDescription={setJobDescription}
      />

      <div className="job__detail__footer">
        <button className="job_save_button">Save</button>
      </div>
    </div>
  );
};

export default JobFrom;
