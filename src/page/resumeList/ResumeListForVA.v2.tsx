import React, { useEffect, useState } from "react";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
  getDesignations,
  getIndividualSession,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";

import AutofillFieldsForVA, { extractInfo } from "./AutofillFieldsForVA";
import { setResumeIndex } from "../../store/features/ResumeList/ResumeListSlice";
import AddMissingLink from "./AddMissingLink";
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

import IndiviudalMemberCard from "./IndiviudalMemberCard";
import AutofillButton from "./AutofillButton";
import { Cpu } from "react-feather";
import {
  getOrgSessionUserName,
  getSessionUserName,
  getUserDetailsById,
} from "./helper";
import {
  AI_AUTOFILL_LOADING_TEXT,
  AiAutofillPhase,
  scanHtmlToMakeApi,
} from "./scanHtmlToMakeApi";
import {
  getAiSiteHandler,
  isAiAutofillSupported,
} from "../../autofill/ai/registry";

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
  const [userResumeList, setUserResumeList] = useState([]);
  const [iframeUrl, setIframeUrl] = useState("");
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [showJobTrackedAlert, setShowJobTrackedAlert] = useState(false);
  const [applicantMode, setApplicantMode] = useState<"va" | "individual">("va");
  const [aiAutofillPhase, setAiAutofillPhase] =
    useState<AiAutofillPhase>("idle");
  const [fieldsDetected, setFieldsDetected] = useState(0);
  const [fieldsFilled, setFieldsFilled] = useState(0);
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const orgState: any = useAppSelector((store: RootStore) => {
    return store.OrgSlice;
  });

  const scanApiLoading = aiAutofillPhase !== "idle";
  const aiAutofillLoadingText =
    aiAutofillPhase === "idle"
      ? "Scanning Page"
      : AI_AUTOFILL_LOADING_TEXT[aiAutofillPhase];

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

  const handleSelectedResume = (index) => {
    dispatch(setResumeIndex(index));
  };

  const handleScanAndAutofillWithAi = async () => {
    const aiHandler = getAiSiteHandler();
    if (!aiHandler) {
      return;
    }

    setFieldsDetected(0);
    setFieldsFilled(0);

    const userdetails = getUserDetailsById(
      selectedUserId,
      applicantMode,
      resumeList,
    );
    if (!userdetails) {
      return;
    }

    const applicantData: any = extractInfo(
      userdetails.applicants[resumeList.resumeIndex],
      userdetails.applicationForm,
      selectedUserId,
    );

    // Site-specific (Greenhouse today): field icons / markers on the form.
    const detectedByIcons = aiHandler.initFieldScanner?.(applicantData) ?? 0;
    console.log(
      `[CareerAI Scan:${aiHandler.id}] Scanner activated on ${detectedByIcons} fields`,
    );
    setFieldsDetected(detectedByIcons);

    const { fieldsDetected: apiDetected, fieldsFilled: filled } =
      await scanHtmlToMakeApi({
        dispatch,
        token: authState?.ci_token ?? "",
        userResumeList,
        resumeIndex: resumeList.resumeIndex,
        selectedUserId,
        applicantData,
        setAiAutofillPhase,
      });

    // Prefer API scan count when available; fall back to icon scanner count.
    setFieldsDetected(apiDetected > 0 ? apiDetected : detectedByIcons);
    setFieldsFilled(filled);
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
                resumeList,
              )}
            />
          )}

          {orgState?.orgSession && (
            <JobCardV2
              jobTitle={orgState.orgSession?.jobTitle}
              userName={getOrgSessionUserName(
                orgState.orgSession?.userId,
                resumeList,
              )}
            />
          )}
          {isAiAutofillSupported() && (
            <div className="ciautofill_v2_resume_autofill_button_section">
              <div className="ci_va_v2_button_stack">
                <div className="ci_va_v2_primary_button">
                  <AutofillButton
                    onClick={handleScanAndAutofillWithAi}
                    text="Autofill with AI"
                    variant="secondary"
                    icon={<Cpu size={16} />}
                    loading={scanApiLoading}
                    loadingText={aiAutofillLoadingText}
                    disabled={
                      autoFilling || resumeList.loading || scanApiLoading
                    }
                  />
                </div>
                {(fieldsDetected > 0 || fieldsFilled > 0) && (
                  <p className="ci_va_v2_scan_field_stats">
                    {fieldsDetected} fields detected · {fieldsFilled} filled
                  </p>
                )}
              </div>
            </div>
          )}
          {/* <WhiteCard> */}
          <div className="ciautofill_v2_resume_autofill_button_section">
            <AutofillFieldsForVA
              selectedUserId={selectedUserId}
              getUserDetailsById={(id) =>
                getUserDetailsById(id, applicantMode, resumeList)
              }
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
