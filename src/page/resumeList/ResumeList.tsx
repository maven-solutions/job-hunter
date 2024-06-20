import React, { useEffect, useState } from "react";
import { Check, Eye } from "react-feather";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import HeadingTitle from "../../component/heading/HeadingTitle";
import AutofillFields from "./AutofillFields";
import "./index.css";
import Spinner from "../shared/Spinner";
import { ResumeSkleton } from "../../component/skleton/Skleton";

const RenderName = (props: any) => {
  const { item } = props;
  if (item?.applicant?.title) {
    return item.applicant.title;
  }
  if (item?.applicant?.name) {
    return item.applicant.name;
  }
  return "Untitled Resume";
};

const ResumeList = (props: any) => {
  const { setShowPage, content, autoFilling, setAutoFilling } = props;
  const [showdropDown, setShowDropdown] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedResume, setSelectedResume] = useState(0);
  // const [autoFilling, setAutoFilling] = useState<Boolean>(false);
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  // console.log("resume::", resumeList);
  // useEffect(() => {
  //   chrome.runtime.onMessage.addListener(function (
  //     message,
  //     sender,
  //     sendResponse
  //   ) {
  //     if (message.action === "startAnimation") {
  //       setAutoFilling(true);
  //       // console.log("Start animation command received in background script");
  //       // Code to start animation
  //     } else if (message.action === "stopAnimation") {
  //       // console.log("Stop animation command received in background script");
  //       // Code to stop animation
  //       setAutoFilling(false);
  //     }
  //   });
  // }, []);

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (authState.authenticated && authState?.ci_user?.userType === "va") {
      if (!resumeList.res_success || resumeList.applicantData.length === 0) {
        // for va user
        dispatch(getApplicantsData());
      }
    } else {
      // for normal user
      if (!resumeList.res_success) {
        dispatch(getApplicantResume());
      }
    }
  }, []);

  const showActionMenu = (index: any) => {
    setCurrentIndex(index);
    setShowDropdown(!showdropDown);
  };

  const handleChangeSelecetedResume = (index: number) => {
    setSelectedResume(index);
  };

  return (
    <Layout setShowPage={setShowPage} firstBgWidth="10">
      <Height height="-10" />
      <HeadingTitle title="Resume List" />
      <Height height="10" />

      <WhiteCard>
        {!autoFilling && (
          <>
            {resumeList.res_success &&
              resumeList.applicantData.map((item, index) => {
                return (
                  <div
                    className="ci_resume_list_section"
                    key={item.applicant.id}
                  >
                    <div className="ci_resume_item_left_section">
                      <input
                        className="ci_resume_radio_button"
                        type="radio"
                        name="resume"
                        id={index}
                        onChange={() => setSelectedResume(index)}
                        checked={selectedResume === index}
                      />
                      <label
                        htmlFor={index}
                        className="ci_resume_radio_button_label"
                      >
                        <RenderName item={item} />
                      </label>
                      {selectedResume === index && (
                        <div className="ci_radio_check_circle">
                          <Check className="ci_check_icon" />
                        </div>
                      )}
                    </div>
                    <div className="ext__tooltip__wrapper">
                      <div className="ext__toolip__container">
                        <div
                          className="ext__toolip"
                          onClick={() =>
                            window.open(item.applicant.pdfUrl, "_blank")
                          }
                        >
                          <Eye size={16} />
                          <p className="ext__tooltip__text">Preview</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {resumeList.loading && <ResumeSkleton />}
            <Height height="10" />
            <AutofillFields
              selectedResume={selectedResume}
              content={content}
              setAutoFilling={setAutoFilling}
            />
          </>
        )}

        {autoFilling && (
          <>
            {" "}
            <div style={{ padding: "10px", paddingTop: "0" }}>
              <Spinner size={60} />
            </div>
            <span className="ci_form_filling_text">
              Form Filling Please Wait...{" "}
            </span>
          </>
        )}
      </WhiteCard>
    </Layout>
  );
};

export default ResumeList;
