import React from "react";
import "./index.css";
import WhiteCard from "../../component/card/WhiteCard";
import Height from "../../component/height/Height";
import JobSummary from "../../component/JobSummary/JobSummary";
import Layout from "../../template/Layout";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";

const DisplayJob = (props: any) => {
  const { setShowFrom } = props;
  return (
    <Layout setShowFrom={setShowFrom}>
      <WhiteCard>
        <JobSummary />
      </WhiteCard>
      <Height height="15" />
      <WhiteCard>Application Stage</WhiteCard>
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
