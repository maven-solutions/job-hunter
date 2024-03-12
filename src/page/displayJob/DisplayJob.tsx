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
import {
  getApplicationStageData,
  saveJobCareerAI,
} from "../../store/features/JobDetail/JobApi";
import { setSelectedStage } from "../../store/features/JobDetail/JobDetailSlice";
import { saveJobs } from "../../contentScript/api";

const DisplayJob = (props: any) => {
  const { setShowPage } = props;
  const jobSlice: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });

  const dispatch = useAppDispatch();
  // console.log("jobSlice::", jobSlice);

  useEffect(() => {
    if (!jobSlice.stage_data_success) {
      dispatch(getApplicationStageData());
    }
  }, []);

  const savejobs = () => {
    console.log("data::11");

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
    };
    dispatch(saveJobCareerAI(data));

    console.log("data::", data);
    //
  };
  return (
    <Layout setShowPage={setShowPage}>
      <WhiteCard hover onclick={() => setShowPage(SHOW_PAGE.jobDetailPage)}>
        <JobSummary />
      </WhiteCard>
      <Height height="15" />
      <WhiteCard>
        <span className="ci_job_stage_title"> Application Stage</span>
        <div className="aaaaaaaaaa">
          {" "}
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
              option: (provided, state) => ({
                ...provided,
                fontSize: 14,
                background: state.isSelected ? "#4339f2" : "#white",
                border: "none",
                cursor: "pointer",
              }),
            }}
            value={jobSlice.selectedStage}
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
        />
        <div style={{ margin: "0 5px" }} />
        <PrimaryButton
          buttonWidth="140"
          loading={jobSlice.loading}
          text="Save Job"
          loadingText="Saving..."
          onclick={savejobs}
        />{" "}
      </div>
    </Layout>
  );
};

export default DisplayJob;
