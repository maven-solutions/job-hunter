import React from "react";
import Select from "react-select";
import "./index.css";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import JobSummary from "../../component/JobSummary/JobSummary";
import Layout from "../../template/Layout";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";

const DisplayJob = (props: any) => {
  const { setShowFrom } = props;
  const jobTypeOptions: any = [
    { value: "remote", label: "Remote" },
    { value: "on-site", label: "On-site" },
    { value: "hybrid", label: "Hybrid" },
    { value: "remote", label: "Remote" },
    { value: "on-site", label: "On-site" },
  ];
  return (
    <Layout setShowFrom={setShowFrom}>
      <WhiteCard>
        <JobSummary />
      </WhiteCard>
      <Height height="15" />
      <WhiteCard>
        <span className="ci_job_stage_title"> Application Stage</span>
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          options={jobTypeOptions}
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              fontSize: 14,
              padding: "-2px 10px",
              borderRadius: "5px",
              width: "100%",
            }),
            option: (provided, state) => ({
              ...provided,
              fontSize: 14,
              background: state.isSelected ? "#4339f2" : "#white",
              border: "none",
            }),
          }}
          value=""
          placeholder="Select job type"
          onChange={(option) => {
            console.log("options---", option);
          }}
        />
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
        <PrimaryButton buttonWidth="140" loading={false} text="Save Job" />{" "}
      </div>
    </Layout>
  );
};

export default DisplayJob;
