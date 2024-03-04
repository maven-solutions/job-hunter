import React from "react";
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
import { RootStore, useAppSelector } from "../../store/store";

const JobDetail = (props: any) => {
  const {
    setShowPage,
    companyName,
    setCompanyName,
    jobsTitle,
    setJobstitle,
    location,
    setLocation,
    jobDescription,
    setDescValue,
  } = props;
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });
  return (
    <Layout setShowPage={setShowPage}>
      <h3 className="ci_job_detail_title">Job Listing Details</h3>
      <WhiteCard>
        <Height height="-15" />

        <InputBox
          title="Job title"
          value={jobDetailState.title}
          valueSetter={setJobstitle}
          name="jobtitle"
        />
        <Height height="10" />
        <InputBox
          title="Company"
          value={jobDetailState.comapny}
          valueSetter={setCompanyName}
          name="company"
        />
        <Height height="10" />

        <InputBox
          title="Location"
          value={jobDetailState.location}
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
              value={jobDetailState.description ?? ""}
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
        <PrimaryButton buttonWidth="105" loading={false} outline text="Back" />
        <div style={{ margin: "0 5px" }} />
        <PrimaryButton buttonWidth="140" loading={false} text="Save Job" />{" "}
      </div>
    </Layout>
  );
};

export default JobDetail;
