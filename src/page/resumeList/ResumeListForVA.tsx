import React, { useEffect, useState } from "react";
import { Eye } from "react-feather";
import Select from "react-select";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import HeadingTitle from "../../component/heading/HeadingTitle";
import "./index.css";
import "./index2.css";
import Spinner from "../shared/Spinner";
import { ResumeSkleton } from "../../component/skleton/Skleton";
import AutofillFieldsForVA from "./AutofillFieldsForVA";

const RenderName = (props: any) => {
  const { item } = props;
  if (item?.title) {
    return item.title;
  }
  if (item?.name) {
    return item.name;
  }
  return "Untitled Resume";
};

const ResumeListForVA = (props: any) => {
  const { setShowPage, content, autoFilling, setAutoFilling, showPage } = props;

  const [selectedUserIndex, setSelectedUserIndex] = useState(2);
  const [selectResumeIndex, setSelectResumeIndex] = useState(0);
  const [userResumeList, setUserResumeList] = useState([]);
  const [showIframeErrorWarning, setShowIframeErrorWarning] = useState(false);
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  console.log("resumeList", resumeList);

  useEffect(() => {
    if (resumeList.res_success) {
      const resume = resumeList.applicantData[2].applicants;
      setUserResumeList(resume);
    }
  }, [resumeList.res_success]);

  const dispatch = useAppDispatch();
  useEffect(() => {
    // for organization student
    if (
      authState?.authenticated &&
      authState?.ci_user?.organizations &&
      authState?.ci_user?.organizations[0]?.role?.id === 3
    ) {
      dispatch(getApplicantResume(authState?.ci_user?.organizations[0].id));
      return;
    }

    if (authState.authenticated && authState?.ci_user?.userType === "va") {
      if (!resumeList.res_success || resumeList.applicantData.length === 0) {
        // for va user
        dispatch(getApplicantsData());
      }
    } else {
      // for normal user
      if (!resumeList.res_success) {
        dispatch(getApplicantResume(null));
      }
    }
  }, []);

  const hanldeChildClick = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };
  const handleSelectChanges = (option) => {
    const filteredArray = resumeList.applicantData?.filter((data) => {
      return option.value === data.applicantId;
    });
    if (!filteredArray && filteredArray.length === 0) {
      return;
    }
    const resume = filteredArray[0].applicants;
    setUserResumeList(resume);
    setSelectResumeIndex(0);
  };

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <Height height="-10" />
      <div className="va_user_select_section_wrapper">
        <HeadingTitle title="Applicant List:" />
        <Select
          options={resumeList?.userList}
          className="react-select-container-va"
          classNamePrefix="react-select"
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              fontSize: 14,
              padding: "-2px 10px",
              borderRadius: "5px",
            }),
            option: (provided, state) => ({
              ...provided,
              fontSize: 14,
              background: state.isSelected ? "#4339f2" : "#white",
            }),
          }}
          // value={category}
          defaultValue={null}
          placeholder="Select category"
          onChange={(option) => handleSelectChanges(option)}
        />
      </div>
      {showIframeErrorWarning && (
        <>
          <Height height="-7" />
          <div className="ci_autofill_iframe_error_wrapper">
            <img src={chrome.runtime.getURL("error.svg")} alt="error-icon" />
            <span className="ci_autofill_iframe_error_title">
              Our autofill functionality is not supported on this page
            </span>

            <img
              src={chrome.runtime.getURL("x.svg")}
              className="ci_autfill_error_noit_button"
              alt="x-icon"
              onClick={() => setShowIframeErrorWarning(false)}
            />
          </div>
          <Height height="10" />
        </>
      )}
      <Height height="15" />

      <WhiteCard>
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
        )}{" "}
        <span className="ciautofill_v2_select_title">Select the Resume </span>
        {!autoFilling && (
          <div className="ciautofill__resmelist__wrapper-va">
            {resumeList.loading && <ResumeSkleton />}
            {resumeList.res_success && (
              <div className="ciautofill_v2_resume_list_container">
                {userResumeList.length > 0 &&
                  userResumeList
                    .filter((r) => r.pdfUrl)
                    ?.map((item, index) => {
                      return (
                        <div
                          className={`ciautofill_v2_resume_section ${
                            index === selectResumeIndex
                              ? "ciautofill_v2_resume_section-active"
                              : ""
                          }`}
                          key={item.id}
                          onClick={() => setSelectResumeIndex(index)}
                        >
                          <span className="ciautofill_v2_resume_name">
                            {" "}
                            <RenderName item={item} />
                          </span>{" "}
                          <Eye
                            size={16}
                            onClick={(e) => {
                              e.stopPropagation();
                              hanldeChildClick(item?.pdfUrl);
                            }}
                          />
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        )}
      </WhiteCard>

      <div className="ciautofill_v2_resume_autofill_button_section">
        <AutofillFieldsForVA
          selectedUserIndex={selectedUserIndex}
          selectResumeIndex={selectResumeIndex}
          content={content}
          setAutoFilling={setAutoFilling}
          setShowIframeErrorWarning={setShowIframeErrorWarning}
        />
      </div>
    </Layout>
  );
};

export default ResumeListForVA;
