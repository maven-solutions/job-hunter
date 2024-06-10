import React, { useEffect, useState } from "react";
import Select from "react-select";
import "./index.css";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import JobSummary from "../../component/JobSummary/JobSummary";
import Layout from "../../template/Layout";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";
import { SHOW_PAGE } from "../../utils/constant";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import { saveJobCareerAI } from "../../store/features/JobDetail/JobApi";
import { setSelectedStage } from "../../store/features/JobDetail/JobDetailSlice";
import Notification from "../../contentScript/Notification";
import {
  EXTENSION_IN_LIVE,
  EXTENSION_IN_LOCAL,
  EXTENSION_IN_STAGING,
  LIVE_WEBSITE_URL,
  STAGING_WEBSITE_URL,
} from "../../config/urlconfig";
import Spinner from "../shared/Spinner";
import Skleton from "../../component/skleton/Skleton";

const DisplayJob = (props: any) => {
  const {
    setShowPage,
    savedNotification,
    setSavedNotification,
    alreadySavedInfo,
    SetAlreadySavedInfo,
  } = props;

  const [saveLoading, setSaveLoading] = useState<Boolean>(false);
  const [loadSkleton, setLoadSkleton] = useState<Boolean>(true);

  const jobSlice: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    // setLoadSkleton(true);
    if (jobSlice.stage_data_success) {
      dispatch(setSelectedStage(jobSlice?.stage_data[0]));
    }
    // setTimeout(() => {
    //   setLoadSkleton(false);
    // }, 1000);
  }, [window.location.href]);

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
              setSaveLoading(false);
            },
            onFail: () => {
              setSavedNotification(false);
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

  const viewJobBoard = () => {
    // for induvidual
    if (EXTENSION_IN_LOCAL && authState?.ci_user?.organizations?.length === 0) {
      window.open("http://localhost:3000/v2/job-tracker", "_blank");
    }
    if (
      EXTENSION_IN_STAGING &&
      authState?.ci_user?.organizations?.length === 0
    ) {
      window.open(`${STAGING_WEBSITE_URL}/v2/job-tracker`, "_blank");
    }
    if (EXTENSION_IN_LIVE && authState?.ci_user?.organizations?.length === 0) {
      window.open(`${LIVE_WEBSITE_URL}/v2/job-tracker`, "_blank");
    }

    // for org user

    if (EXTENSION_IN_LOCAL && authState?.ci_user?.organizations?.length > 0) {
      window.open("http://localhost:3000/dashboard/job-tracker", "_blank");
    }
    if (EXTENSION_IN_STAGING && authState?.ci_user?.organizations?.length > 0) {
      window.open(`${STAGING_WEBSITE_URL}/dashboard/job-tracker`, "_blank");
    }
    if (EXTENSION_IN_LIVE && authState?.ci_user?.organizations?.length > 0) {
      window.open(`${LIVE_WEBSITE_URL}/dashboard/job-tracker`, "_blank");
    }
  };

  return (
    <Layout setShowPage={setShowPage}>
      <Notification
        savedNotification={savedNotification}
        setSavedNotification={setSavedNotification}
        SetAlreadySavedInfo={SetAlreadySavedInfo}
        alreadySavedInfo={alreadySavedInfo}
        foruser
      />
      {!jobSlice.title ? (
        <Skleton />
      ) : (
        <WhiteCard hover onclick={() => setShowPage(SHOW_PAGE.jobDetailPage)}>
          <JobSummary />
        </WhiteCard>
      )}

      <Height height="15" />
      <WhiteCard>
        <span className="ci_job_stage_title_new">
          <div>Application Stage</div>
          {/* {jobSlice?.stage_data_loading && (
            <div style={{ paddingTop: "-8px" }}>
              <Spinner size={25} />
            </div>
          )} */}
        </span>
        <div className="aaaaaaaaaa">
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            options={jobSlice.stage_data}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                fontSize: 14,
                padding: "-2px 10px",
                borderRadius: "5px",
                width: "100%",
                cursor: "pointer",
              }),
              menu: (provided, state) => ({
                ...provided,
                zIndex: 9999, // Increase the z-index if necessary
              }),
              menuList: (provided, state) => ({
                ...provided,
                maxHeight: "150px", // Adjust the maximum height as needed
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  width: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  borderRadius: "10px",
                  width: "5px",
                  background: "#e2e2e2", // Adjust as needed
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f8f8f8", // Adjust as needed
                  borderRadius: "10px",
                  width: "7px",
                },
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: 14,
                background: state.isSelected ? "#4339f2" : "white",
                border: "none",
                cursor: "pointer",
              }),
            }}
            value={jobSlice?.selectedStage}
            // defaultValue={jobSlice?.stage_data[0]}
            placeholder="Select Application Stage"
            onChange={(option) => {
              dispatch(setSelectedStage(option));
            }}
          />
        </div>
      </WhiteCard>
      <Height height="15" />
      <div className="ci_job_summary_button_section">
        <PrimaryButton
          buttonWidth="145"
          loading={false}
          outline
          text="View Job Board"
          onclick={viewJobBoard}
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

export default DisplayJob;
