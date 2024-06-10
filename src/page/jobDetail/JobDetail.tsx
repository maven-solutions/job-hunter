import React, { useEffect, useState } from "react";
import {
  BtnBold,
  BtnItalic,
  Editor,
  EditorProvider,
  Toolbar,
  BtnUnderline,
} from "react-simple-wysiwyg";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import InputBox from "../../component/InputBox";
import Height from "../../component/height/Height";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import { SHOW_PAGE } from "../../utils/constant";
import {
  getApplicationStageData,
  saveJobCareerAI,
} from "../../store/features/JobDetail/JobApi";
import Notification from "../../contentScript/Notification";

const JobDetail = (props: any) => {
  const {
    setShowPage,

    setCompanyName,

    setJobstitle,

    setLocation,

    setDescValue,
  } = props;

  const [saveLoading, setSaveLoading] = useState<Boolean>(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [alreadySavedInfo, SetAlreadySavedInfo] = useState<Boolean>(false);

  const jobSlice: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   if (!jobSlice.stage_data_success) {
  //     dispatch(getApplicationStageData());
  //   }
  // }, []);

  const savejobs = () => {
    setSaveLoading(true);

    const data: any = {
      individualApplicationStageId: jobSlice.selectedStage.value,
      jobTitle: jobSlice.title,
      companyName: jobSlice.company,
      jobType: jobSlice.jobtype,
      companyLogo: jobSlice.companyLogo,
      jobDescription: jobSlice.description,
      jobOverview: jobSlice.addationlIfo,
      jobLink: jobSlice.postUrl,
      jobPortal: jobSlice.source,
      location: jobSlice.location,
      salary: jobSlice.salary,
      jobCulture: jobSlice.job_culture,
      isEasyApply: jobSlice.isEasyApply,
      fromExtension: true,
    };
    try {
      if (authState.authenticated) {
        dispatch(
          saveJobCareerAI({
            data,
            onSuccess: () => {
              setSavedNotification(true);
              SetAlreadySavedInfo(false);
              setSaveLoading(false);
              setShowPage(SHOW_PAGE.summaryPage);
            },
            onFail: () => {
              setSavedNotification(false);
              SetAlreadySavedInfo(true);
              setSaveLoading(false);
            },
          })
        );
      }
    } catch (error) {
      setSaveLoading(false);
      console.log("catched err", error);
    }
  };

  return (
    <Layout setShowPage={setShowPage}>
      <h3 className="ci_job_detail_title">Job Listing Details</h3>
      <Notification
        savedNotification={savedNotification}
        setSavedNotification={setSavedNotification}
        SetAlreadySavedInfo={SetAlreadySavedInfo}
        alreadySavedInfo={alreadySavedInfo}
      />
      <WhiteCard>
        <Height height="-15" />

        <InputBox
          title="Job title"
          value={jobSlice.title}
          valueSetter={setJobstitle}
          name="jobtitle"
        />
        <Height height="10" />
        <InputBox
          title="Company"
          value={jobSlice.company}
          valueSetter={setCompanyName}
          name="company"
        />
        <Height height="10" />

        <InputBox
          title="Location"
          value={jobSlice.location}
          valueSetter={setLocation}
          name="location"
        />
        <Height height="10" />
        <div className="ci_job_desc">
          <label className="job_box_title">Additional Info</label>
          {/* 
          <div className="label-top">Additional Info</div> */}
          <EditorProvider>
            <Editor
              value={jobSlice.description ?? ""}
              onChange={setDescValue}
              // onBlur={() => console.log("Editor lost focus")}
              // onFocus={() => console.log("Editor gained focus")}
            >
              {/* <Toolbar /> */}
              <Toolbar>
                <BtnBold />
                <BtnItalic />
                <BtnUnderline />
              </Toolbar>
            </Editor>
          </EditorProvider>
        </div>
      </WhiteCard>
      <Height height="15" />
      <div className="ci_job_detail_button_section">
        <PrimaryButton
          buttonWidth="105"
          loading={false}
          outline
          text="Back"
          onclick={() => setShowPage(SHOW_PAGE.summaryPage)}
        />
        <div style={{ margin: "0 5px" }} />

        {!jobSlice.check_job_res_success && (
          <PrimaryButton
            buttonWidth="140"
            loading={saveLoading}
            text={jobSlice?.res_success.add_job ? "Saved" : "Save Job"}
            loadingText="Saving..."
            onclick={savejobs}
            disabled={
              jobSlice?.res_success.add_job ||
              jobSlice?.loading.add_job ||
              jobSlice.check_job_res_success ||
              !jobSlice.title
            }
          />
        )}
        {jobSlice.check_job_res_success && (
          <PrimaryButton
            buttonWidth="140"
            loading={saveLoading}
            text={"Already Saved"}
            loadingText="Saving..."
            onclick={savejobs}
            disabled={true}
          />
        )}
      </div>
    </Layout>
  );
};

export default JobDetail;
