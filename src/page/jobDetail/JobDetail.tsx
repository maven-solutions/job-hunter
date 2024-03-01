import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import InputBox from "../../component/InputBox";
import Height from "../../component/height/Height";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";

const JobDetail = (props: any) => {
  const {
    setShowForm,
    companyName,
    setCompanyName,
    jobsTitle,
    setJobstitle,
    location,
    setLocation,
  } = props;
  return (
    <Layout setShowForm={setShowForm}>
      <h3 className="ci_job_detail_title">Job Listing Details</h3>

      <WhiteCard>
        <InputBox
          title="Job title"
          value={jobsTitle}
          valueSetter={setJobstitle}
          name="jobtitle"
        />
        <Height height="10" />
        <InputBox
          title="Company"
          value={companyName}
          valueSetter={setCompanyName}
          name="company"
        />
        <Height height="10" />

        <InputBox
          title="Location"
          value={location}
          valueSetter={setLocation}
          name="location"
        />
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
