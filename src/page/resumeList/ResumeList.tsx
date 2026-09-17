import React, { useEffect, useState } from "react";
import { Cpu } from "react-feather";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import {
  getApplicantResume,
  getApplicantsData,
  getDesignations,
} from "../../store/features/ResumeList/ResumeListApi";
import Layout from "../../template/Layout";
import "./index.css";
import "./index2.css";
import "./index.v2.css";
import IframeProceed from "./IframeProceed";
import AutofillFields, { extractInfo } from "./AutofillFields";
import ResumeListV2 from "./ResumeListV2";
import JobCardV2 from "./JobCard.v2";
import ScreenshotGallery from "./ScreenshotGallery";
import AutofillButton from "./AutofillButton";
import { getApplicantSession } from "../../store/features/applicant/ApplicantApi";
import {
  getAiSiteHandler,
  isAiAutofillSupported,
} from "../../autofill/ai/registry";
import {
  AI_AUTOFILL_LOADING_TEXT,
  AiAutofillPhase,
  scanHtmlToMakeApi,
} from "./scanHtmlToMakeApi";

const ResumeList = (props: any) => {
  const { setShowPage, content, autoFilling, setAutoFilling, showPage } = props;

  const [selectedResume, setSelectedResume] = useState(0);
  const [iframeUrl, setIframeUrl] = useState("");
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
  const applicantState: any = useAppSelector((store: RootStore) => {
    return store.ApplicantSlice;
  });

  const dispatch = useAppDispatch();
  const scanApiLoading = aiAutofillPhase !== "idle";
  const aiAutofillLoadingText =
    aiAutofillPhase === "idle"
      ? "Scanning Page"
      : AI_AUTOFILL_LOADING_TEXT[aiAutofillPhase];

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

  const handleScanAndAutofillWithAi = async () => {
    const aiHandler = getAiSiteHandler();
    if (!aiHandler) {
      return;
    }

    const selectedItem = resumeList.applicantData?.[selectedResume];
    if (!selectedItem?.applicant || !selectedItem?.applicationForm) {
      return;
    }

    setFieldsDetected(0);
    setFieldsFilled(0);

    const applicantData = extractInfo(
      selectedItem.applicant,
      selectedItem.applicationForm,
    );
    const selectedUserId =
      selectedItem.id ??
      selectedItem.applicant?.userId ??
      selectedItem.applicationForm?.userId;

    const { fieldsDetected: detected, fieldsFilled: filled } =
      await scanHtmlToMakeApi({
        dispatch,
        token: authState?.ci_token ?? "",
        userResumeList: resumes,
        resumeIndex: selectedResume,
        selectedUserId,
        applicantData,
        setAiAutofillPhase,
        fillType: "individual",
      });

    setFieldsDetected(detected);
    setFieldsFilled(filled);
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
          {/* {autoFilling && <AutofillLoader />} */}

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

          {isAiAutofillSupported() && (
            <div className="ciautofill_v2_resume_autofill_button_section">
              <div className="ci_va_v2_button_stack">
                <div className="ci_va_v2_primary_button">
                  <AutofillButton
                    onClick={handleScanAndAutofillWithAi}
                    text="Autofill with AI"
                    variant="primary"
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
          {!isAiAutofillSupported() && (
            <div className="ciautofill_v2_resume_autofill_button_section">
              <AutofillFields
                selectedResume={selectedResume}
                content={content}
                setAutoFilling={setAutoFilling}
                setIframeUrl={setIframeUrl}
                iframeUrl={iframeUrl}
                autoFilling={autoFilling}
                isV2Layout
                onSaveSite={() => {}}
              />
            </div>
          )}

          {!autoFilling && applicantState.applicantSession && (
            <ScreenshotGallery
              screenshots={applicantState.applicantSession?.screenshots}
              extensionJobId={applicantState.applicantSession?.jobId}
              userId={applicantState.applicantSession?.userId}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResumeList;
