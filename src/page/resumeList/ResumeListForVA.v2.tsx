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
import ResumeListV2 from "./ResumeListV2";
import ScreenshotGallery from "./ScreenshotGallery";
import JobCardV2 from "./JobCard.v2";
import { getOrgSession } from "../../store/features/Organization/OrgApi";
import OrgActiveMemberCard from "./OrgActiveMemberCard";
import { setLocalStorageData } from "../../autofill/helper";
import IndiviudalMemberCard from "./IndiviudalMemberCard";

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

  useEffect(() => {
    // if (!resumeList.deg_res_success) {
    dispatch(getDesignations());
    dispatch(getIndividualSession());
    dispatch(getOrgSession());
    // }
  }, []);

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

  const getUserDetailsById = (id) => {
    const pool =
      applicantMode === "individual"
        ? resumeList.individualApplicantData
        : resumeList.applicantData;
    const filteredArray = pool?.filter((data: any) => id === data.id);
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
    setLocalStorageData("selectedResumeIndex", index);
    dispatch(setResumeIndex(index));
  };

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <div className="ciautofill_v2_panel">
        <div className="popup-content">
          <section className="form-section">
            <p className="section-label">Applying for</p>
            <SwitchTabV2 />

            {orgState?.orgSession && (
              <OrgActiveMemberCard
                activeUserId={orgState.orgSession.userId}
                applicants={resumeList?.applicantData}
                setSelectedUserId={setSelectedUserId}
                setUserResumeList={setUserResumeList}
              />
            )}

            {resumeList.individualSession && (
              <IndiviudalMemberCard
                activeUserId={resumeList.individualSession?.userId}
                applicants={resumeList.individualApplicantData}
                setSelectedUserId={setSelectedUserId}
                setUserResumeList={setUserResumeList}
              />
            )}
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
          {resumeList.individualSession && (
            <JobCardV2
              jobTitle={resumeList.individualSession?.jobTitle}
              userName={getSessionUserName(
                resumeList.individualSession?.userId,
              )}
            />
          )}

          {orgState?.orgSession && (
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
              applicantMode={applicantMode}
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
          {!autoFilling && orgState.orgSession?.userId === selectedUserId && (
            <ScreenshotGallery
              screenshots={orgState.orgSession?.screenshots}
              extensionJobId={orgState.orgSession?.jobId}
              userId={orgState.orgSession?.userId}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResumeListForVAV2;
