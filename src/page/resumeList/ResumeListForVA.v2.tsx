import React, { useCallback, useEffect, useState } from "react";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
  getDesignations,
  getIndividualSession,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";

import AutofillFieldsForVA from "./AutofillFieldsForVA";
import {
  setResumeIndex,
  setUserIndex,
} from "../../store/features/ResumeList/ResumeListSlice";
import AddMissingLink from "./AddMissingLink";
import { CHROME_STOGRAGE } from "../../utils/constant";
import "./index.css";
import "./index2.css";
import "./index.v2.css";
import IframeProceed from "./IframeProceed";
import JobSavedNotification from "../../contentScript/JobSaved";
import JobNotSavedError from "../../contentScript/JobNotSavedError";
import SwitchTabV2 from "./SwitchTabV2";
import ApplicantPickerV2 from "./ApplicantPickerV2";
import ResumeListV2 from "./ResumeListV2";
import ScreenshotGallery from "./ScreenshotGallery";
import JobCardV2 from "./JobCard.v2";
import { getOrgSession } from "../../store/features/Organization/OrgApi";
import OrgActiveMemberCard from "./OrgActiveMemberCard";

interface IChromeResult {
  selectedUser?: any;
  selectedResumeIndex?: any;
  selectedUserIndex?: any;
  selectedRoleType?: any;
}

const ResumeListForVAV2 = (props: any) => {
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
  const orgState: any = useAppSelector((store: RootStore) => {
    return store.OrgSlice;
  });

  console.log("orgState:::", orgState);
  console.log("resumeList:::", resumeList);
  console.log("selectedUserId:::", selectedUserId);

  useEffect(() => {
    if (!resumeList.deg_res_success) {
      dispatch(getDesignations());
      dispatch(getIndividualSession());
      dispatch(getOrgSession());
    }
  }, []);

  // useEffect(() => {
  //   if (!resumeList.res_success || orgState?.orgSession) {
  //     return;
  //   }

  //   chrome.storage.local.get(
  //     [
  //       CHROME_STOGRAGE.SELECTED_ROLE_TYPE,
  //       CHROME_STOGRAGE.SELECTED_USER,
  //       CHROME_STOGRAGE.SELECTED_RESUME_INDEX,
  //       CHROME_STOGRAGE.SELECTED_USER_INDEX,
  //     ],
  //     (result: IChromeResult) => {
  //       const savedMode = result[CHROME_STOGRAGE.SELECTED_ROLE_TYPE] as
  //         | "va"
  //         | "individual"
  //         | undefined;
  //       const mode = savedMode ?? "va";
  //       setApplicantMode(mode);

  //       const applicantPool =
  //         mode === "individual"
  //           ? resumeList.individualApplicantData
  //           : resumeList.applicantData;
  //       const userOptionPool =
  //         mode === "individual"
  //           ? resumeList.individualUserList
  //           : resumeList.userList;

  //       if (!applicantPool || applicantPool.length === 0) {
  //         setSelectedUserValue(null);
  //         setSelectedUserId(null);
  //         setUserResumeList([]);
  //         dispatch(setResumeIndex(0));
  //         return;
  //       }

  //       let selectedApplicantIndex =
  //         result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER_INDEX) &&
  //         applicantPool[result.selectedUserIndex]
  //           ? result.selectedUserIndex
  //           : mode === "va"
  //             ? resumeList.userIndex
  //             : 0;

  //       if (!applicantPool[selectedApplicantIndex]) {
  //         selectedApplicantIndex = 0;
  //       }

  //       let selectedApplicant = applicantPool[selectedApplicantIndex];
  //       if (result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER)) {
  //         const selectedById = applicantPool.find(
  //           (data: any) => data.applicantId === result.selectedUser?.value,
  //         );
  //         if (selectedById) {
  //           selectedApplicant = selectedById;
  //           selectedApplicantIndex = applicantPool.findIndex(
  //             (data: any) => data.applicantId === result.selectedUser?.value,
  //           );
  //         }
  //       }

  //       if (!selectedApplicant) {
  //         return;
  //       }

  //       setSelectedUserValue(
  //         result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_USER)
  //           ? result.selectedUser
  //           : (userOptionPool?.[selectedApplicantIndex] ?? {
  //               label: selectedApplicant.fullName,
  //               value: selectedApplicant.applicantId,
  //             }),
  //       );
  //       setSelectedUserId(selectedApplicant.applicantId);
  //       setUserResumeList(selectedApplicant.applicants ?? []);
  //       dispatch(setUserIndex(selectedApplicantIndex));
  //       chrome.storage.local.set({
  //         selectedUserIndex: selectedApplicantIndex,
  //       });

  //       const selectedResumeIndex = result.hasOwnProperty(
  //         CHROME_STOGRAGE.SELECTED_RESUME_INDEX,
  //       )
  //         ? result.selectedResumeIndex
  //         : 0;
  //       dispatch(setResumeIndex(selectedResumeIndex));
  //     },
  //   );
  // }, [
  //   resumeList.res_success,
  //   resumeList.applicantData,
  //   resumeList.individualApplicantData,
  //   orgState?.orgSession,
  // ]);

  // useEffect(() => {
  //   chrome.storage.local.get(
  //     [CHROME_STOGRAGE.SELECTED_ROLE_TYPE],
  //     (result: any) => {
  //       if (result.hasOwnProperty(CHROME_STOGRAGE.SELECTED_ROLE_TYPE)) {
  //         setApplicantMode(
  //           result[CHROME_STOGRAGE.SELECTED_ROLE_TYPE] as "va" | "individual",
  //         );
  //       }
  //     },
  //   );
  // }, []);

  useEffect(() => {
    if (resumeList.individualSession) {
      setApplicantMode("individual");
      return;
    }

    if (orgState?.orgSession) {
      setApplicantMode("va");
    }
  }, [resumeList.individualSession, orgState?.orgSession]);

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

  const handleOrgActiveApplicantSelect = useCallback(
    (option: { label: string; value: string | number }) => {
      if (selectedUserValue?.value === option.value) return;
      handleSelectChanges(option);
    },
    [selectedUserValue?.value, resumeList.applicantData],
  );

  const getUserDetailsById = (id) => {
    const pool =
      applicantMode === "individual"
        ? resumeList.individualApplicantData
        : resumeList.applicantData;
    const filteredArray = pool?.filter((data: any) => id === data.applicantId);
    if (!filteredArray || filteredArray.length === 0) return null;
    return filteredArray[0];
  };

  const getSessionUserName = (userId: number | undefined | null) => {
    if (userId == null) return "";
    const match =
      resumeList.individualUserList?.find(
        (user: { label: string; value: number }) => user.value === userId,
      ) ??
      resumeList.userList?.find(
        (user: { label: string; value: number }) => user.value === userId,
      );
    return match?.label ?? "";
  };
  const getOrgSessionUserName = (userId: number | undefined | null) => {
    if (userId == null) return "";
    const match = resumeList.applicantData?.find(
      (user: { fullName: string; id: number }) => user.id === userId,
    );
    return match?.fullName ?? "";
  };

  const handleSelectedResume = (index) => {
    chrome.storage.local.set({ selectedResumeIndex: index });
    dispatch(setResumeIndex(index));
  };

  const applicantPool =
    applicantMode === "individual"
      ? resumeList.individualApplicantData
      : resumeList.applicantData;
  const selectedApplicant = selectedUserId
    ? getUserDetailsById(selectedUserId)
    : applicantPool?.[0];
  const selectedApplicantName =
    selectedApplicant?.fullName ??
    selectedUserValue?.label ??
    "Select Applicant";
  const selectedApplicantRole =
    selectedApplicant?.title ||
    selectedApplicant?.designation ||
    selectedApplicant?.position ||
    "Applicant";
  const currentOptions =
    applicantMode === "individual"
      ? resumeList.individualUserList
      : resumeList.userList;

  console.log("resumeList:::individualSession", resumeList);

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <div className="ciautofill_v2_panel">
        <div className="popup-content">
          <section className="form-section">
            <p className="section-label">Applying for</p>
            <SwitchTabV2 value={applicantMode} />

            {!autoFilling && orgState?.orgSession && (
              <OrgActiveMemberCard
                activeUserId={orgState.orgSession.userId}
                applicants={resumeList?.applicantData}
                onActiveApplicantSelect={handleOrgActiveApplicantSelect}
              />
            )}

            {/* <ApplicantPickerV2
              name={selectedApplicantName}
              role={selectedApplicantRole}
              options={currentOptions ?? []}
              selectedValue={selectedUserValue?.value}
              activeSessionUserId={resumeList.individualSession?.userId}
              onSelect={(option) =>
                applicantMode === "va"
                  ? handleSelectChanges(option)
                  : handleIndividualSelectChanges(option)
              }
            /> */}
          </section>

          {!autoFilling && (
            <ResumeListV2
              loading={resumeList.loading}
              success={resumeList.res_success}
              resumes={userResumeList}
              selectedIndex={resumeList.resumeIndex}
              resumeList={resumeList}
              onSelect={handleSelectedResume}
              onPreview={hanldeChildClick}
            />
          )}

          {/* <SupportMessageV2 /> */}

          {showJobTrackedAlert && (
            <JobSavedNotification
              setShowJobTrackedAlert={setShowJobTrackedAlert}
            />
          )}
          {errorINCountSave && (
            <JobNotSavedError setShowJobTrackedAlert={setErrorINCountSave} />
          )}
          {!iframeUrl && showAddWebsite && <AddMissingLink />}
          {iframeUrl && <IframeProceed />}
          {resumeList.individualSession && autoFilling && (
            <JobCardV2
              jobTitle={resumeList.individualSession?.jobTitle}
              userName={getSessionUserName(
                resumeList.individualSession?.userId,
              )}
            />
          )}

          {orgState?.orgSession && autoFilling && (
            <JobCardV2
              jobTitle={orgState.orgSession?.jobTitle}
              userName={getOrgSessionUserName(orgState.orgSession?.userId)}
            />
          )}
          {/* <WhiteCard> */}
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
              isV2Layout
            />
          </div>
          {/* </WhiteCard> */}

          {!autoFilling &&
            resumeList.individualSession?.userId === selectedUserId && (
              <ScreenshotGallery
                screenshots={resumeList.individualSession?.screenshots}
                extensionJobId={resumeList.individualSession?.extensionJobId}
                userId={resumeList.individualSession?.userId}
              />
            )}
        </div>
      </div>
    </Layout>
  );
};

export default ResumeListForVAV2;
