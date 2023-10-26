// TODO: content script
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { useDebounce } from "use-debounce";
import ReactHtmlParser from "react-html-parser";
import JoditEditor from "jodit-react";
import "./index.css";
import InputBox from "../component/InputBox";
// import logo from "../static";

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
  const [aboutUs, setAboutUs] = useState<any>("");
  const [postUrl, setPostUrl] = useState<string>("");
  const [activeUrl, setActiveUrl] = useState<string>(window.location.href);
  const [debounceValue] = useDebounce(activeUrl, 3000);
  const editor = useRef(null);
  const targetElementRef = useRef();
  console.log("companyName--", aboutUs.toString());

  const clearFrorm = () => {
    setCompanyName("");
    setJobstitle("");
    setCompanyLocation("");
    setAboutUs("");
    // setPostUrl("");
  };

  const editorConfig: any = useMemo(
    () => ({
      readonly: false,
      height: "200px",
      width: "100%",
      buttons: [
        "source",
        "|",
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "table",
        "link",
        "|",
        "left",
        "center",
        "right",
        "justify",
        "|",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
        "fullsize",
      ],
      removeButtons: [
        "brush",
        "file",
        "eraser",
        "hr",
        "redo",
        "undo",
        "justify",
        "right",
        "center",
        "justify",
        "left",
        "link",
        "table",
        "image",
        "paragraph",
        "brush",
        "fontsize",
        "font",
        "source",
        "fullsize",
        "|",
      ],
      showXPathInStatusbar: false,
      showCharsCounter: false,
      showWordsCounter: true,
      toolbarAdaptive: false,
      toolbarSticky: false,
      spellcheck: true,
      theme: "default",
      i18n: "en",
      // limitWords: 3,
      // autofocus: true,
      // cursorAfterAutofocus: "end",
      // saveSelectionOnBlur: true,
      style: {
        fontFamily: "Montserrat !important",
        textAlign: "justify",
      },
    }),
    []
  );
  const getContentFromLinkedInJobs = async () => {
    setPostUrl(window.location.href);
    const targetElement: any = targetElementRef.current;

    const jobsBody = document.getElementsByClassName(
      "job-details-jobs-unified-top-card__job-title"
    );
    if (jobsBody[0]) {
      setJobstitle(jobsBody[0]?.textContent.trim());
    }

    let jobDetailsElement = document.getElementById("job-details");

    // Find the first <span> element inside the jobDetailsElement
    const about = jobDetailsElement.querySelector("span");

    if (about) {
      // setAboutUs(aboutUs);
      // console.log("a----", about);
    }

    const location = document.getElementsByClassName(
      "job-details-jobs-unified-top-card__bullet"
    );
    if (location[0]) {
      setCompanyLocation(location[0]?.textContent?.trim());
    }

    // Assuming you have a reference to the DOM element
    const domElement = document.querySelector(".jobs-unified-top-card.t-14");
    setTimeout(() => {
      const aTag = domElement.querySelector("a.app-aware-link");
      const companyName = aTag.textContent;
      setCompanyName(companyName.trim());

      if (about) {
        setAboutUs(about);
        // Clear existing content in the target element
        while (targetElement.firstChild) {
          targetElement.removeChild(targetElement.firstChild);
        }

        // Append the new content to the target element
        targetElement.appendChild(about);
      }
    }, 500);
  };

  useEffect(() => {
    if (window.location.href.includes("www.linkedin.com/jobs/collections")) {
      getContentFromLinkedInJobs();
    }
  }, [debounceValue]);
  // useEffect(() => {
  //   if (window.location.href.includes("www.linkedin.com/jobs/collections")) {
  //     clearFrorm();
  //   }
  // }, [activeUrl]);

  // useEffect(() => {
  //   chrome.runtime.sendMessage(
  //     { action: "generateDynamicURL", inputValue: window.location.href },
  //     function (response) {
  //       // const dynamicURL = response.url;
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
      }
    });

    // Observe changes in the DOM
    observer.observe(document, { childList: true, subtree: true });
  }, []);
  // const debouncedSearch = debounce(handleSearch, 300);

  // useEffect(() => {
  //   if (editor.current) {
  //     // Set the HTML content you want to render
  //     const htmlContent = aboutUs;

  //     // Use the Jodit API to set the content
  //     editor.current.value = htmlContent;
  //   }
  // }, []);
  return (
    <div className="content__script__section">
      <div className="job_circle_button">
        <img
          src={chrome.runtime.getURL("icon.png")}
          className="job_circle_button_img"
          alt="logo"
        />
      </div>
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
          {/* <InputBox title="Description" /> */}

          <div className="job_input_section">
            <span className="job_box_title">Description </span>
            {/* <JoditEditor
              ref={editor}
              value={aboutUs}
              config={editorConfig}
              onBlur={(newContent) => setAboutUs(newContent)}
            /> */}
            {/* <div dangerouslySetInnerHTML={{ __html: aboutUs }} /> */}
            {/* {aboutUs} */}
            {/* {ReactHtmlParser(aboutUs)} */}
            <div ref={targetElementRef} className="about__us__section">
              {/* The target element where you want to render the saveButton HTML */}
            </div>
          </div>
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
