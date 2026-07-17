import React from "react";
import "./JobCard.v2.css";

type JobCardProps = {
  jobTitle: string;
  userName: string;
};

const JobCardV2 = ({ jobTitle, userName }: JobCardProps) => (
  <section className="tc_job_card" aria-label="Detected job">
    <div className="tc_job_icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </svg>
    </div>
    <div className="tc_job_copy">
      <h1>{jobTitle}</h1>
      <p>Applying as: {userName}</p>
    </div>
  </section>
);
export default JobCardV2;
