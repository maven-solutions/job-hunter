// TODO: content script
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { useDebounce } from "use-debounce";
import "./index.css";
import JobFrom from "./JobFrom";

const App: React.FC<{}> = () => {
  const [showFrom, setShowFrom] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [jobsTitle, setJobstitle] = useState<string>("");
  const [companyLocation, setCompanyLocation] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<any>("");
  const [postUrl, setPostUrl] = useState<string>("");
  const [activeUrl, setActiveUrl] = useState<string>(window.location.href);
  const [debounceValue] = useDebounce(activeUrl, 3000);
  const targetElementRef = useRef();

  const getContentFromLinkedInJobs = (): void => {
    setPostUrl(window.location.href);
    const targetElement: any = targetElementRef.current;

    const jobsBody = document.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      setJobstitle(jobsBody[0]?.textContent.trim());
    }

    setTimeout(() => {
      let jobDetailsElement = document.getElementById("job-details");
      const about = jobDetailsElement.querySelector("span");

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
      const domElement = document.querySelector(".jobs-unified-top-card.t-14");

      const aTag = domElement.querySelector("a.app-aware-link");
      const companyName = aTag?.textContent;
      setCompanyName(companyName?.trim());
    }, 500);
  };

  const getJobsFromIndeed = (): void => {
    setPostUrl(window.location.href);

    setTimeout(() => {
      const titleElement = document.querySelector(
        ".jobsearch-JobInfoHeader-title"
      );
      // Get the text content from the titleElement
      const text = titleElement?.textContent?.trim();
      // Extract "React.js Developer"
      const jobTitle = text?.split(" - ")[0];
      setJobstitle(jobTitle);
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

    const companyElement = document.getElementsByClassName(
      "css-1f8zkg3 e19afand0"
    );
    if (companyElement) {
      setCompanyName(companyElement[0]?.textContent);
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
      const title = titleElement.textContent.trim();
      setJobstitle(title);
    }
    const companyNameEle = document.querySelector(
      '[data-cy="companyNameLink"]'
    );
    if (companyNameEle) {
      // Get the text content from the element
      const companyName = companyNameEle.textContent.trim();
      setCompanyName(companyName);
    }
    // Get the HTML element by its data-testid attribute
    const locationElement = document.querySelector(
      '[data-cy="locationDetails"]'
    );
    if (locationElement) {
      // Get the text content from the element
      const location = locationElement.textContent.trim();
      setCompanyLocation(location);
    }

    const jobDescriptionEle = document.querySelector(
      '[data-testid="jobDescriptionHtml"]'
    );
    if (jobDescriptionEle) {
      // Get the text content from the element
      const description = jobDescriptionEle.innerHTML;
      setJobDescription(description);
    }
  };

  useEffect(() => {
    if (window.location.href.includes("linkedin.com/jobs/collections")) {
      getContentFromLinkedInJobs();
    }
    if (window.location.href.includes("in.indeed.com")) {
      getJobsFromIndeed();
    }
    if (window.location.href.includes("dice.com/job-detail")) {
      getJobsFromDice();
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
    <div className="content__script__section">
      <div
        className="job_circle_button"
        role="button"
        onClick={() => setShowFrom(!showFrom)}
      >
        <img
          src={chrome.runtime.getURL("icon.png")}
          className="job_circle_button_img"
          alt="logo"
        />
      </div>
      {showFrom && (
        <JobFrom
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
      )}
      {/* <div dangerouslySetInnerHTML={} */}
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
