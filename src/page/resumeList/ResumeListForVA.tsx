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
    setSelectedUserIndex(index);
    setSelectResumeIndex(0);
    const resume = resumeList.applicantData[index].applicants;
    setUserResumeList(resume);
  };

  useEffect(() => {
    if (resumeList.res_success) {
      const resume = resumeList.applicantData[0].applicants;
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
  console.log(resumeList.applicantData);

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

      <Height height="20" />

      <div className="ci_resume_list_height_container">
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
          )}
          {!autoFilling && (
            <div className="ciautofill__resmelist__wrapper">
              <Height height="-10" />
              {resumeList.loading && <ResumeSkleton />}
              {resumeList.res_success &&
                resumeList.applicantData.map((item, index) => {
                  return (
                    <div
                      className="ciautofill_single_resume_list_container"
                      key={item.applicantId}
                    >
                      <div
                        className="ciautofill_single_resume_v2"
                        onClick={() => handleSelectedIndexforUser(index)}
                      >
                        <div className="ciautofill__radio__button__section">
                          {selectedUserIndex === index && (
                            <div className="ciautofill__radio__checked" />
                          )}
                        </div>

                        <span className="ciautofill_resume_name">
                          {item?.fullName}
                        </span>
                      </div>

                      {selectedUserIndex === index && (
                        <>
                          {" "}
                          <span className="ciautofill_v2_select_title">
                            {" "}
                            Select the Resume{" "}
                          </span>
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
                                    >
                                      <span
                                        className="ciautofill_v2_resume_name"
                                        onClick={() =>
                                          setSelectResumeIndex(index)
                                        }
                                      >
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
                        </>
                      )}
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
