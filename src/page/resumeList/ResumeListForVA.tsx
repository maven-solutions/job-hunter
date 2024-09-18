import React, { useEffect, useState } from "react";
import { Eye } from "react-feather";
import Select from "react-select";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
  getDesignations,
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
import {
  setResumeIndex,
  setUserIndex,
} from "../../store/features/ResumeList/ResumeListSlice";
import AddMissingLink from "./AddMissingLink";
import { CHROME_STOGRAGE } from "../../utils/constant";
import RenderName from "./RenderName";

interface IChromeResult {
  selectedUser?: any;
  selectedResumeIndex?: any;
  selectedUserIndex?: any;
}

const ResumeListForVA = (props: any) => {
  const { setShowPage, content, autoFilling, setAutoFilling, showPage } = props;
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserValue, setSelectedUserValue] = useState(null);
  const [userResumeList, setUserResumeList] = useState([]);
  const [showIframeErrorWarning, setShowIframeErrorWarning] = useState(false);
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  useEffect(() => {
    if (!resumeList.deg_res_success) {
      dispatch(getDesignations());
    }
  }, []);

  useEffect(() => {
    if (resumeList.res_success) {
      chrome.storage.local.get(
        [
          CHROME_STOGRAGE.SELECTED_USER,
          CHROME_STOGRAGE.SELECTED_RESUME_INDEX,
          CHROME_STOGRAGE.SELECTED_USER_INDEX,
        ],
        (result: IChromeResult) => {
          if (result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER)) {
            setSelectedUserValue(result.selectedUser);
            const filteredArray = resumeList.applicantData?.filter((data) => {
              return result.selectedUser.value === data.applicantId;
            });
            if (!filteredArray && filteredArray.length === 0) {
              return;
            }
            const resume = filteredArray[0].applicants;
            setUserResumeList(resume);
          } else {
            setSelectedUserValue(resumeList?.userList[resumeList.userIndex]);
          }

          if (result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER_INDEX)) {
            const resume =
              resumeList.applicantData[result.selectedUserIndex].applicants;
            setUserResumeList(resume);
            setSelectedUserId(
              resumeList.applicantData[result.selectedUserIndex].applicantId
            );
          } else {
            const resume =
              resumeList.applicantData[resumeList.userIndex].applicants;
            setUserResumeList(resume);
            setSelectedUserId(
              resumeList.applicantData[resumeList.userIndex].applicantId
            );
          }

          if (result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_RESUME_INDEX)) {
            dispatch(setResumeIndex(result.selectedResumeIndex));
          }
        }
      );
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

  // const RenderName = (props: any) => {};

  const hanldeChildClick = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  const handleSelectChanges = (option) => {
    chrome.storage.local.set({ selectedUser: option }, () => {});
    const filteredArray = resumeList.applicantData?.filter((data) => {
      return option.value === data.applicantId;
    });
    resumeList.applicantData?.map((data, index) => {
      if (option.value === data.applicantId) {
        dispatch(setUserIndex(index));
        chrome.storage.local.set({ selectedUserIndex: index });
      }
    });

    if (!filteredArray && filteredArray.length === 0) {
      return;
    }
    const resume = filteredArray[0].applicants;
    setUserResumeList(resume);
    // setSelectResumeIndex(resumeList.resumeIndex);
    dispatch(setResumeIndex(0));
    chrome.storage.local.set({ selectedResumeIndex: 0 });
    setSelectedUserId(option.value);
    setSelectedUserValue(option);
  };

  const getUserDetailsById = (id) => {
    const filteredArray = resumeList.applicantData?.filter((data) => {
      return id === data.applicantId;
    });
    if (!filteredArray && filteredArray.length === 0) {
      return null;
    }
    return filteredArray[0];
  };

  const handleSelectedResume = (index) => {
    chrome.storage.local.set({ selectedResumeIndex: index }).then(() => {
      console.log("selectedResumeIndexValue is set");
    });

    chrome.storage.local.get(["selectedResumeIndex"]).then((result) => {
      console.log(
        " selectedResumeIndex Value is ::" + result.selectedResumeIndex
      );
    });
    dispatch(setResumeIndex(index));
  };

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <Height height="-10" />
      <AddMissingLink />
      <div className="va_user_select_section_wrapper">
        <HeadingTitle title="Applicant List:" />
        <Select
          isSearchable={false}
          options={resumeList?.userList}
          className="react-select-container-va"
          classNamePrefix="react-select"
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              fontSize: 14,
              padding: "-2px 10px",
              borderRadius: "5px",
              cursor: "pointer",
            }),
            option: (provided, state) => ({
              ...provided,
              fontSize: 14,
              cursor: "pointer",
              background: state.isSelected ? "#4339f2" : "#white",
            }),
          }}
          value={selectedUserValue}
          placeholder="Select Applicant"
          onChange={(option) => handleSelectChanges(option)}
        />
      </div>
      {showIframeErrorWarning && (
        <>
          <Height height="10" />
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
        {!autoFilling && (
          <>
            <span className="ciautofill_v2_select_title">
              Select the Resume{" "}
            </span>
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
                              index === resumeList.resumeIndex
                                ? "ciautofill_v2_resume_section-active"
                                : ""
                            }`}
                            key={item.id}
                            onClick={() => handleSelectedResume(index)}
                          >
                            <span className="ciautofill_v2_resume_name">
                              {" "}
                              <RenderName item={item} resumeList={resumeList} />
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
          </>
        )}
      </WhiteCard>

      <div className="ciautofill_v2_resume_autofill_button_section">
        <AutofillFieldsForVA
          selectedUserId={selectedUserId}
          getUserDetailsById={getUserDetailsById}
          selectResumeIndex={resumeList.resumeIndex}
          content={content}
          setAutoFilling={setAutoFilling}
          setShowIframeErrorWarning={setShowIframeErrorWarning}
        />
      </div>
    </Layout>
  );
};

export default ResumeListForVA;
