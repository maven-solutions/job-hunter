import React, { useMemo, useRef } from "react";
import JoditEditor from "jodit-react";

import InputBox from "../component/InputBox";

const JobFrom = (props: any) => {
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
  const editor = useRef(null);

  const {
    companyName,
    setCompanyName,
    jobsTitle,
    setJobstitle,
    companyLocation,
    setCompanyLocation,
    postUrl,
    setPostUrl,
    targetElementRef,
    aboutUs,
    setAboutUs,
  } = props;
  return (
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
        <div className="job_input_section">
          <span className="job_box_title">Description </span>
          {/* <JoditEditor
            ref={editor}
            value={aboutUs}
            config={editorConfig}
            onBlur={(newContent) => setAboutUs(newContent)}
          /> */}
          {/* {ReactHtmlParser(aboutUs)} */}
          {/* <div dangerouslySetInnerHTML={{ __html: aboutUs }} /> */}
          <div className="about__us__section">
            <div dangerouslySetInnerHTML={{ __html: aboutUs }} />
          </div>
          {/* <div ref={targetElementRef} className="about__us__section" /> */}
        </div>
      </div>
      <div className="job__detail__footer">
        <button className="job_save_button">Save</button>
      </div>
    </div>
  );
};

export default JobFrom;
