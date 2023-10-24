// TODO: content script
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
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
  const [isActive, setIsActive] = useState<any>(window.location.href);

  const getContentFromLinkedInJobs = () => {
    const jobsData: JobsData = {};
    jobsData.postUrl = window.location.href;

    const jobsBody = document.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      jobsData.title = jobsBody[0]?.textContent.trim();
    }
    // const jobsLocation = document.getElementsByClassName(
    //   "job-details-jobs-unified-top-card__primary-description"
    // );

    // console.log("jobsLocation--", jobsLocation[0].children[0].textContent);

    // const a = document.querySelector(".jobs-box__html-content");
    // console.log(
    //   "loc--",
    //   a
    //     .getElementsByClassName("text-heading-large")[0]
    //     .getElementsByTagName("span")
    // );
    // const a = document.getElementById("job-details");
    // console.log("a----", a);
    // Get the DOM element with the id "job-details"
    const jobDetailsElement = document.getElementById("job-details");

    // Find the first <span> element inside the jobDetailsElement
    const aboutUs = jobDetailsElement.querySelector("span");
    if (aboutUs) {
      console.log("aboutus---");
      jobsData.aboutUs = aboutUs;
    }
    console.log("jobsData---", jobsData);

    // Log the HTML content to the console
    // console.log(htmlContentInsideFirstSpan);
  };

  useEffect(() => {
    // console.log("url----", window.location.href);
    getContentFromLinkedInJobs();
  }, [window.location]);

  // useEffect(() => {}, [isActive]);

  return (
    <div className="content__script__section">
      <div className="job_circle_button">JH</div>
      <div className="job__detail__container">
        <div className="job_detail_header"> Jobs Hunter </div>
        <div className="job_detail_content_section">
          <InputBox title="Company" />
          <InputBox title="Job title" />
          <InputBox title="Location" />
          <InputBox title="Post Url" />
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
ReactDOM.render(<App />, root);
