// TODO: content script
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { useDebounce } from "use-debounce";
import "./index.css";
import InputBox from "../component/InputBox";

interface JobsData {
  title?: string;
  location?: string;
  description?: string;
  postUrl?: string;
  aboutUs?: any;
}
const App: React.FC<{}> = () => {
  const [companyName, setCompanyName] = useState<string>("");
  const [jobsTitle, setJobstitle] = useState<string>("");
  const [companyLocation, setCompanyLocation] = useState<string>("");
  const [aboutUs, setAboutUs] = useState<string>("");
  const [postUrl, setPostUrl] = useState<string>("");
  const [activeUrl, setActiveUrl] = useState<string>(window.location.href);
  const [debounceValue] = useDebounce(activeUrl, 3000);
  const jobsData: JobsData = {};

  const getContentFromLinkedInJobs = () => {
    jobsData.postUrl = window.location.href;
    setPostUrl(window.location.href);

    const jobsBody = document.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      jobsData.title = jobsBody[0]?.textContent.trim();
      setJobstitle(jobsBody[0]?.textContent.trim());
    }

    const jobDetailsElement = document.getElementById("job-details");

    // Find the first <span> element inside the jobDetailsElement
    const aboutUs = jobDetailsElement.querySelector("span");
    if (aboutUs) {
      jobsData.aboutUs = aboutUs.toString();
    }

    const location = document.getElementsByClassName(
      "job-details-jobs-unified-top-card__bullet"
    );
    if (location[0]) {
      jobsData.location = location[0]?.textContent?.trim();
      setCompanyLocation(location[0]?.textContent?.trim());
    }
  };

  useEffect(() => {
    if (window.location.href.includes("www.linkedin.com/jobs/collections")) {
      getContentFromLinkedInJobs();
    }
  }, [debounceValue]);

  // useEffect(() => {
  //   chrome.runtime.sendMessage(
  //     { action: "generateDynamicURL", inputValue: window.location.href },
  //     function (response) {
  //       // var dynamicURL = response.url;
  //       console.log("res---", response);
  //       // Open the dynamicURL or use it as needed.
  //     }
  //   );
  // }, [window.location.href]);
  // const observer = new MutationObserver(() => {
  //   const url = window.location.href;
  //   chrome.runtime.sendMessage({ action: "urlChange", url });
  // });

  // // Observe changes in the DOM
  // observer.observe(document, { childList: true, subtree: true });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const url = window.location.href;
      // chrome.runtime.sendMessage({ action: "urlChange", url });
      if (url !== activeUrl) {
        setActiveUrl(url);
        console.log("url--", url);
      }
    });

    // Observe changes in the DOM
    observer.observe(document, { childList: true, subtree: true });
  }, []);
  // const debouncedSearch = debounce(handleSearch, 300);

  return (
    <div className="content__script__section">
      <div className="job_circle_button">JH</div>
      <div className="job__detail__container">
        <div className="job_detail_header"> Jobs Hunter </div>
        <div className="job_detail_content_section">
          <InputBox
            title="Company"
            value={companyName}
            valueSetter={setCompanyName}
          />
          <InputBox
            title="Job title"
            value={jobsTitle}
            valueSetter={setJobstitle}
          />
          <InputBox
            title="Location"
            value={companyLocation}
            valueSetter={setCompanyLocation}
          />
          <InputBox title="Post Url" value={postUrl} valueSetter={setPostUrl} />
          <InputBox title="Description" />
        </div>
        <div className="job__detail__footer">
          <button className="job_save_button">Save</button>
        </div>
      </div>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
