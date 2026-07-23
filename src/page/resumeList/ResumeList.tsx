import React, { useEffect, useState } from "react";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
  getDesignations,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";
import Height from "../../component/height/Height";
import "./index.css";
import "./index2.css";
import "./index.v2.css";
import AutofillLoader from "./AutofillLoader";
import IframeProceed from "./IframeProceed";
import AutofillFields from "./AutofillFields";
import ResumeListV2 from "./ResumeListV2";
import { getApplicantSession } from "../../store/features/applicant/ApplicantApi";
import JobCardV2 from "./JobCard.v2";
// import { getApplicantSession } from "../../store/features/Applicant/ApplicantApi";

const ResumeList = (props: any) => {
  const { setShowPage, content, autoFilling, setAutoFilling, showPage } = props;

  const [selectedResume, setSelectedResume] = useState(0);
  const [iframeUrl, setIframeUrl] = useState("");

  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const applicantState: any = useAppSelector((store: RootStore) => {
    return store.ApplicantSlice;
  });

  console.log("applicantState", applicantState);
  console.log("resumeList", resumeList);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getDesignations());
  }, []);

  useEffect(() => {
    dispatch(getApplicantSession());
    if (
      authState.authenticated &&
      authState?.ci_user?.organizations[0]?.role?.id === 3
    ) {
      dispatch(getApplicantResume(authState?.ci_user?.organizations[0].id));
      return;
    }

    if (authState.authenticated && authState?.ci_user?.userType === "va") {
      if (!resumeList.res_success || resumeList.applicantData.length === 0) {
        dispatch(getApplicantsData());
      }
    } else {
      if (!resumeList.res_success) {
        dispatch(getApplicantResume(null));
      }
    }
  }, []);

  const resumes = (resumeList.applicantData ?? []).map(
    (item: any) => item.applicant ?? item,
  );

  const handlePreview = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  const getSessionUserName = (userId: number | undefined | null) => {
    if (userId == null) return "";
    const match = resumeList.applicantData?.find((user) => user.id === userId);
    return match?.fullName ?? "";
  };

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <div className="ciautofill_v2_panel">
        <div className="popup-content">
          {!autoFilling && (
            <ResumeListV2
              loading={resumeList.loading}
              success={resumeList.res_success}
              resumes={resumes}
              selectedIndex={selectedResume}
              resumeList={resumeList}
              onSelect={setSelectedResume}
              onPreview={handlePreview}
            />
          )}
          {autoFilling && <AutofillLoader />}

          {/* <Height height="10" /> */}
          {iframeUrl && <IframeProceed />}

          {applicantState.applicantSession && (
            <JobCardV2
              jobTitle={applicantState.applicantSession?.jobTitle}
              userName={getSessionUserName(
                applicantState.applicantSession?.userId,
              )}
            />
          )}
          <div className="ciautofill_v2_resume_autofill_button_section">
            <AutofillFields
              selectedResume={selectedResume}
              content={content}
              setAutoFilling={setAutoFilling}
              setIframeUrl={setIframeUrl}
              iframeUrl={iframeUrl}
              autoFilling={autoFilling}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResumeList;
