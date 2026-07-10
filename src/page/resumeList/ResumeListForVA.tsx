import React, { useEffect, useState } from "react";
import { Eye } from "react-feather";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
  getDesignations,
  getIndividualSession,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import { ResumeSkleton } from "../../component/skleton/Skleton";
import AutofillFieldsForVA from "./AutofillFieldsForVA";
import {
  setResumeIndex,
  setUserIndex,
} from "../../store/features/ResumeList/ResumeListSlice";
import AddMissingLink from "./AddMissingLink";
import { CHROME_STOGRAGE } from "../../utils/constant";
import RenderName from "./RenderName";
import IframError from "./IframError";
import AutofillLoader from "./AutofillLoader";
import "./index.css";
import "./index2.css";
import UserSelectList from "./UserSelectList";
import IframeProceed from "./IframeProceed";
import JobSavedNotification from "../../contentScript/JobSaved";
import JobNotSavedError from "../../contentScript/JobNotSavedError";

interface IChromeResult {
  selectedUser?: any;
  selectedResumeIndex?: any;
  selectedUserIndex?: any;
  selectedRoleType?: any;
}

const ResumeListForVA = (props: any) => {
  const {
    setShowPage,
    content,
    autoFilling,
    setAutoFilling,
    showPage,
    errorINCountSave,
    setErrorINCountSave,
  } = props;
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserValue, setSelectedUserValue] = useState<any>(null);
  const [userResumeList, setUserResumeList] = useState([]);
  const [iframeUrl, setIframeUrl] = useState("");
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [showJobTrackedAlert, setShowJobTrackedAlert] = useState(false);
  const [applicantMode, setApplicantMode] = useState<"va" | "individual">("va");
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  useEffect(() => {
    if (!resumeList.deg_res_success) {
      dispatch(getDesignations());
      dispatch(getIndividualSession());
    }
  }, []);
  console.log("resumeList:::individualSession", resumeList.individualSession);

  useEffect(() => {
    if (resumeList.res_success) {
      chrome.storage.local.get(
        [
          CHROME_STOGRAGE.SELECTED_ROLE_TYPE,
          CHROME_STOGRAGE.SELECTED_USER,
          CHROME_STOGRAGE.SELECTED_RESUME_INDEX,
          CHROME_STOGRAGE.SELECTED_USER_INDEX,
        ],
        (result: IChromeResult) => {
          const savedMode = result[CHROME_STOGRAGE.SELECTED_ROLE_TYPE] as
            | "va"
            | "individual"
            | undefined;
          const mode = savedMode ?? "va";
          setApplicantMode(mode);

          const applicantPool =
            mode === "individual"
              ? resumeList.individualApplicantData
              : resumeList.applicantData;
          const userOptionPool =
            mode === "individual"
              ? resumeList.individualUserList
              : resumeList.userList;

          if (!applicantPool || applicantPool.length === 0) {
            setSelectedUserValue(null);
            setSelectedUserId(null);
            setUserResumeList([]);
            dispatch(setResumeIndex(0));
            return;
          }

          let selectedApplicantIndex =
            result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER_INDEX) &&
            applicantPool[result.selectedUserIndex]
              ? result.selectedUserIndex
              : mode === "va"
                ? resumeList.userIndex
                : 0;

          if (!applicantPool[selectedApplicantIndex]) {
            selectedApplicantIndex = 0;
          }

          let selectedApplicant = applicantPool[selectedApplicantIndex];
          if (result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER)) {
            const selectedById = applicantPool.find(
              (data: any) => data.applicantId === result.selectedUser?.value,
            );
            if (selectedById) {
              selectedApplicant = selectedById;
              selectedApplicantIndex = applicantPool.findIndex(
                (data: any) => data.applicantId === result.selectedUser?.value,
              );
            }
          }

          if (!selectedApplicant) {
            return;
          }

          setSelectedUserValue(
            result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER)
              ? result.selectedUser
              : (userOptionPool?.[selectedApplicantIndex] ?? {
                  label: selectedApplicant.fullName,
                  value: selectedApplicant.applicantId,
                }),
          );
          setSelectedUserId(selectedApplicant.applicantId);
          setUserResumeList(selectedApplicant.applicants ?? []);
          dispatch(setUserIndex(selectedApplicantIndex));
          chrome.storage.local.set({
            selectedUserIndex: selectedApplicantIndex,
          });

          const selectedResumeIndex = result.hasOwnProperty(
            CHROME_STOGRAGE.SELECTED_RESUME_INDEX,
          )
            ? result.selectedResumeIndex
            : 0;
          dispatch(setResumeIndex(selectedResumeIndex));
        },
      );
    }
  }, [
    resumeList.res_success,
    resumeList.applicantData,
    resumeList.individualApplicantData,
  ]);

  useEffect(() => {
    chrome.storage.local.get(
      [CHROME_STOGRAGE.SELECTED_ROLE_TYPE],
      (result: any) => {
        if (result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_ROLE_TYPE)) {
          setApplicantMode(
            result[CHROME_STOGRAGE.SELECTED_ROLE_TYPE] as "va" | "individual",
          );
        }
      },
    );
  }, []);

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

  const handleIndividualSelectChanges = (option: any) => {
    chrome.storage.local.set({ selectedUser: option }, () => {});
    resumeList.individualApplicantData?.map((data: any, index: number) => {
      if (option.value === data.applicantId) {
        dispatch(setUserIndex(index));
        chrome.storage.local.set({ selectedUserIndex: index });
      }
    });
    const filteredArray = resumeList.individualApplicantData?.filter(
      (data: any) => {
        return option.value === data.applicantId;
      },
    );
    if (!filteredArray || filteredArray.length === 0) return;
    setUserResumeList(filteredArray[0].applicants);
    setSelectedUserId(option.value);
    setSelectedUserValue(option);
    dispatch(setResumeIndex(0));
    chrome.storage.local.set({ selectedResumeIndex: 0 });
  };

  const handleModeSwitch = (mode: "va" | "individual") => {
    setApplicantMode(mode);
    chrome.storage.local.set(
      { [CHROME_STOGRAGE.SELECTED_ROLE_TYPE]: mode as string },
      () => {},
    );
    dispatch(setResumeIndex(0));
    if (mode === "individual") {
      const first = resumeList.individualApplicantData?.[0];
      if (first) {
        setSelectedUserId(first.applicantId);
        setSelectedUserValue({
          label: first.fullName,
          value: first.applicantId,
        });
        setUserResumeList(first.applicants ?? []);
      } else {
        setSelectedUserId(null);
        setSelectedUserValue(null);
        setUserResumeList([]);
      }
    } else {
      const first = resumeList.applicantData?.[resumeList.userIndex];
      if (first) {
        setSelectedUserId(first.applicantId);
        setSelectedUserValue({
          label: first.fullName,
          value: first.applicantId,
        });
        setUserResumeList(first.applicants ?? []);
      } else {
        setSelectedUserId(null);
        setSelectedUserValue(null);
        setUserResumeList([]);
      }
    }
  };

  const getUserDetailsById = (id) => {
    const pool =
      applicantMode === "individual"
        ? resumeList.individualApplicantData
        : resumeList.applicantData;
    const filteredArray = pool?.filter((data: any) => id === data.applicantId);
    if (!filteredArray || filteredArray.length === 0) return null;
    return filteredArray[0];
  };

  const handleSelectedResume = (index) => {
    chrome.storage.local.set({ selectedResumeIndex: index });
    dispatch(setResumeIndex(index));
  };

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <div className="ciautofill_v2_mode_toggle">
        <button
          className={`ciautofill_v2_mode_btn ${applicantMode === "va" ? "ciautofill_v2_mode_btn--active" : ""}`}
          onClick={() => handleModeSwitch("va")}
        >
          Organization Applicants
        </button>
        <button
          className={`ciautofill_v2_mode_btn ${applicantMode === "individual" ? "ciautofill_v2_mode_btn--active" : ""}`}
          onClick={() => handleModeSwitch("individual")}
        >
          Individual Applicants
        </button>
      </div>
      {applicantMode === "va" ? (
        <UserSelectList
          selectedUserValue={selectedUserValue}
          handleSelectChanges={handleSelectChanges}
        />
      ) : (
        <UserSelectList
          selectedUserValue={selectedUserValue}
          handleSelectChanges={handleIndividualSelectChanges}
          options={resumeList.individualUserList}
        />
      )}
      <Height height="15" />
      {resumeList.individualSession && (
        <div className="ciautofill_v2_job_title_section">
          <span className="ciautofill_v2_job_title_label">Job Title:</span>
          <span className="ciautofill_v2_job_title_value">
            {resumeList.individualSession.jobTitle}
          </span>
        </div>
      )}
      <Height height="10" />

      {showJobTrackedAlert && (
        <JobSavedNotification setShowJobTrackedAlert={setShowJobTrackedAlert} />
      )}
      {errorINCountSave && (
        <JobNotSavedError setShowJobTrackedAlert={setErrorINCountSave} />
      )}
      <WhiteCard>
        {autoFilling && <AutofillLoader />}

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
                    userResumeList?.map((item, index) => {
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
                          {item?.pdfUrl && (
                            <Eye
                              size={16}
                              onClick={(e) => {
                                e.stopPropagation();
                                hanldeChildClick(item?.pdfUrl);
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </WhiteCard>
      <Height height="15" />
      {!iframeUrl && showAddWebsite && <AddMissingLink />}
      {iframeUrl && <IframeProceed />}
      <div className="ciautofill_v2_resume_autofill_button_section">
        <AutofillFieldsForVA
          selectedUserId={selectedUserId}
          getUserDetailsById={getUserDetailsById}
          selectResumeIndex={resumeList.resumeIndex}
          content={content}
          setAutoFilling={setAutoFilling}
          setIframeUrl={setIframeUrl}
          iframeUrl={iframeUrl}
          setShowAddWebsite={setShowAddWebsite}
          setShowJobTrackedAlert={setShowJobTrackedAlert}
          setErrorINCountSave={setErrorINCountSave}
          autoFilling={autoFilling}
        />
      </div>
    </Layout>
  );
};

export default ResumeListForVA;
