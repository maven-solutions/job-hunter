import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import JobFrom from "./JobFrom";
import Logo from "../component/Logo";

const App: React.FC<{}> = () => {
  const [showFrom, setShowFrom] = useState<boolean>(false);
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [glassdoorUrl, setGlassDoorUrl] = useState<string>("");

  useEffect(() => {
    if (
      [
        "linkedin",
        "indeed",
        "dice",
        "ziprecruiter",
        "glassdoor",
        "simplyhired",
        "builtin",
      ].some((domain) => window.location.href.includes(domain))
    ) {
      setShowIcon(true);
    }
  }, []);

  // this button will be added on glassdoor website
  const addButtonToGlassdoorWebsite = () => {
    try {
      let jobLinkEle: any = "";
      let jobLink: any = "";
      const jobLinkEleSection = document.querySelector(
        '[data-selected="true"]'
      );
      if (jobLinkEleSection) {
        jobLinkEle = jobLinkEleSection?.querySelector("a");
      }
      if (jobLinkEle) {
        jobLink = jobLinkEle?.getAttribute("href");
      }

      if (glassdoorUrl.toLowerCase() !== jobLink.toLowerCase()) {
        setGlassDoorUrl(jobLink);
        const jobHeader = document.querySelector(
          ".JobDetails_jobDetailsHeader__qKuvs"
        );

        // Remove previously appended buttons
        const existingButtons = jobHeader.querySelectorAll("a");
        existingButtons.forEach((button) => {
          button.remove();
        });

        // Create a button element
        const beautifulButton = document.createElement("a");

        // Set attributes and styles for the button
        beautifulButton.href = jobLink;
        beautifulButton.target = "_blank";
        beautifulButton.textContent = "Add This Job to CareerAi";
        beautifulButton.style.display = "inline-block";
        beautifulButton.style.padding = "7px 20px";
        beautifulButton.style.backgroundColor = "#0145FD";
        beautifulButton.style.color = "#ffffff";
        beautifulButton.style.textDecoration = "none";
        beautifulButton.style.borderRadius = "5px";
        beautifulButton.style.fontSize = "16px";
        beautifulButton.style.fontWeight = "500";
        beautifulButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
        beautifulButton.style.transition = "background-color 0.3s ease";
        jobHeader.prepend(beautifulButton);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //  this is only for glassdoor webiste
  useEffect(() => {
    if (
      window.location.href.includes("glassdoor") &&
      !window.location.href.includes("job-listing")
    ) {
      // Clear any existing intervals before setting a new one
      const intervalId = setInterval(addButtonToGlassdoorWebsite, 3000);
      // Clear the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, []);

  return (
    <div className="content__script__section">
      {showIcon ? (
        <div
          className="job_circle_button"
          role="button"
          onClick={() => setShowFrom(!showFrom)}
        >
          <Logo />

          {/* <img
            src={chrome.runtime.getURL('icon.png')}
            className="job_circle_button_img"
            alt="logo"
          /> */}
        </div>
      ) : null}
      {showFrom && <JobFrom setShowForm={setShowFrom} />}
      {/* {<JobListTable />} */}
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
