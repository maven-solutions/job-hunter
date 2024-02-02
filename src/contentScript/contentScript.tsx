import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import JobFrom from "./JobFrom";

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
        jobLinkEle = jobLinkEleSection?.querySelector(
          ".JobCard_seoLink__WdqHZ"
        );
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
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                d="M8 10C8 7.79086 9.79086 6 12 6H64V62H12C9.79086 62 8 60.2091 8 58V10Z"
                fill="#0145FD"
              />
              <path
                d="M47.2279 27.4423C48.8472 26.6059 49.5047 24.587 48.3633 23.1662C46.8097 21.2324 44.8307 19.6623 42.5633 18.5883C39.2953 17.0403 35.6092 16.6087 32.0719 17.36C28.5347 18.1113 25.3423 20.0038 22.9855 22.7465C20.6288 25.4892 19.2383 28.9301 19.0279 32.5401C18.8176 36.1501 19.799 39.7293 21.8212 42.7271C23.8434 45.7249 26.7944 47.9755 30.2204 49.1325C33.6464 50.2896 37.3577 50.2891 40.7834 49.1312C43.1602 48.3279 45.3082 46.9982 47.0759 45.2579C48.3747 43.9793 47.9561 41.8978 46.4449 40.879V40.879C44.9337 39.8601 42.9032 40.3208 41.446 41.4155C40.6099 42.0436 39.674 42.5394 38.6701 42.8787C36.6146 43.5735 34.3879 43.5738 32.3323 42.8795C30.2766 42.1853 28.506 40.835 27.2927 39.0363C26.0794 37.2376 25.4905 35.0901 25.6168 32.9241C25.743 30.7581 26.5773 28.6935 27.9913 27.0479C29.4054 25.4023 31.3208 24.2668 33.4432 23.816C35.5655 23.3652 37.7772 23.6242 39.738 24.553C40.6957 25.0066 41.5677 25.6078 42.3252 26.3287C43.6454 27.5852 45.6086 28.2787 47.2279 27.4423V27.4423Z"
                fill="#FFB400"
              />
              <path
                d="M47.2119 27.4509C48.8402 26.6099 49.5014 24.5799 48.3522 23.1525C47.6109 22.2317 46.7708 21.3908 45.8449 20.6457C44.0542 19.2046 41.9823 18.1536 39.7618 17.5599C37.5413 16.9662 35.2213 16.843 32.9504 17.1982C31.7762 17.3818 30.6285 17.6913 29.5266 18.1192C27.8183 18.7826 27.3783 20.8718 28.3696 22.4132V22.4132C29.3608 23.9545 31.4198 24.3347 33.202 23.9077C33.4574 23.8465 33.7155 23.7955 33.9758 23.7548C35.3334 23.5424 36.7203 23.6161 38.0477 23.971C39.3751 24.3259 40.6137 24.9542 41.6842 25.8157C41.8894 25.9809 42.0877 26.154 42.2784 26.3344C43.6097 27.5938 45.5837 28.2919 47.2119 27.4509V27.4509Z"
                fill="white"
              />
              <path
                d="M46.6148 40.8282C48.1733 41.8492 48.6296 43.9722 47.3134 45.2909C46.4914 46.1145 45.5823 46.8511 44.6002 47.4867C42.6706 48.7356 40.5014 49.5676 38.2315 49.9293C35.9617 50.291 33.6413 50.1745 31.4191 49.5872C30.288 49.2883 29.1951 48.8708 28.1578 48.3435C26.4969 47.4992 26.2707 45.3396 27.4347 43.8847V43.8847C28.5986 42.4298 30.7218 42.2633 32.4852 42.8651C32.7017 42.939 32.9211 43.0053 33.143 43.064C34.4565 43.4111 35.828 43.48 37.1697 43.2662C38.5114 43.0524 39.7935 42.5606 40.9341 41.8224C41.1268 41.6977 41.3147 41.5664 41.4975 41.4289C42.9865 40.3089 45.0563 39.8072 46.6148 40.8282V40.8282Z"
                fill="white"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_404_44"
                x="0"
                y="0"
                width="72"
                height="72"
                filterUnits="userSpaceOnUse"
              >
                <feFlood result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="4" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_404_44"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_404_44"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>

          {/* <img src="logo.png" className="job_circle_button_img" alt="logo" /> */}
          {/* <img
            src={chrome.runtime.getURL('icon.png')}
            className="job_circle_button_img"
            alt="logo"
          /> */}
        </div>
      ) : null}
      {showFrom && <JobFrom />}
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
const rootElement = ReactDOM.createRoot(root);
rootElement.render(<App />);
