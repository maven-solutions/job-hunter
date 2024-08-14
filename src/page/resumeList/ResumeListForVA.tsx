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

  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [selectResumeIndex, setSelectResumeIndex] = useState(0);
  const [userResumeList, setUserResumeList] = useState([]);
  const [showIframeErrorWarning, setShowIframeErrorWarning] = useState(false);
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const handleSelectedIndexforUser = (index) => {
    console.log("index::", index);
    setSelectedUserIndex(index);
    // setUserResumeList;
    const resume = resumeList.applicantData[index].applicants;
    setUserResumeList(resume);
    // console.log("resume::", resume);
  };

  useEffect(() => {
    if (resumeList.res_success) {
      const resume = resumeList.applicantData[0].applicants;
      setUserResumeList(resume);
    }
  }, [resumeList.res_success]);

  console.log("resumeList::", resumeList);
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

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <Height height="-10" />
      <HeadingTitle title="Resume List" />
      <Height height="10" />
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
      {/* <WhiteCard>
        <AutofillFieldsForVA />
      </WhiteCard> */}

      {/* <WhiteCard>
        {!autoFilling && (
          <div className="ciautofill__resmelist__wrapper">
            <Height height="-10" />

            {userResumeList.length > 0 &&
              userResumeList.map((item, index) => {
                return (
                  <div className="ciautofill_single_resume" key={item.id}>
                    <div
                      className="ciautofill__radio__button__section"
                      onClick={() => setSelectResumeIndex(index)}
                    >
                      {selectResumeIndex === index && (
                        <div className="ciautofill__radio__checked" />
                      )}
                    </div>
                    <span
                      className="ciautofill_resume_name"
                      onClick={() => setSelectResumeIndex(index)}
                    >
                      <RenderName item={item} />
                    </span>
                    {selectResumeIndex === index && (
                      <div className="ciautofill__checkbox__section">
                        <Check className="ciautofill__check__icon" />
                      </div>
                    )}

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
            <AutofillFieldsForVA
              selectedUserIndex={selectedUserIndex}
              content={content}
              setAutoFilling={setAutoFilling}
              setShowIframeErrorWarning={setShowIframeErrorWarning}
            />
          </div>
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
      </WhiteCard> */}
      <Height height="20" />

      {/* <WhiteCard>
        {!autoFilling && (
          <div className="ciautofill__resmelist__wrapper">
            <Height height="-10" />

            {resumeList.res_success &&
              resumeList.applicantData.map((item, index) => {
                return (
                  <div
                    className="ciautofill_single_resume"
                    key={item.applicantId}
                  >
                    <div
                      className="ciautofill__radio__button__section"
                      onClick={() => handleSelectedIndexforUser(index)}
                    >
                      {selectedUserIndex === index && (
                        <div className="ciautofill__radio__checked" />
                      )}
                    </div>
                    <span
                      className="ciautofill_resume_name"
                      onClick={() => handleSelectedIndexforUser(index)}
                    ></span>
                    {selectedUserIndex === index && (
                      <div className="ciautofill__checkbox__section">
                        <Check className="ciautofill__check__icon" />
                      </div>
                    )}
                  </div>
                );
              })}
            {resumeList.loading && <ResumeSkleton />}
          </div>
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
      </WhiteCard> */}
      <div className="ci_resume_list_height_container">
        <WhiteCard>
          {!autoFilling && (
            <div className="ciautofill__resmelist__wrapper">
              <Height height="-10" />

              {[1, 2, 3, 4, 5, 6, 7].map((item, i) => {
                return (
                  <div
                    className="ciautofill_single_resume_list_container"
                    key={item}
                  >
                    <div className="ciautofill_single_resume_v2">
                      <div className="ciautofill__radio__button__section">
                        <div className="ciautofill__radio__checked" />
                      </div>
                      <span className="ciautofill_resume_name">Arun Kumar</span>
                    </div>
                    <span className="ciautofill_v2_select_title">
                      {" "}
                      Select the Resume{" "}
                    </span>

                    <div className="ciautofill_v2_resume_list_container">
                      {[1, 2, 3, 4, 5].map((i) => {
                        return (
                          <div className="ciautofill_v2_resume_section" key={i}>
                            <span className="ciautofill_v2_resume_name">
                              {" "}
                              Graphic Design
                            </span>{" "}
                            <Eye size={16} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </WhiteCard>
      </div>

      <div className="ciautofill_v2_resume_autofill_button_section">
        <AutofillFieldsForVA
          selectedUserIndex={selectedUserIndex}
          content={content}
          setAutoFilling={setAutoFilling}
          setShowIframeErrorWarning={setShowIframeErrorWarning}
        />
      </div>
    </Layout>
  );
};

export default ResumeListForVA;
