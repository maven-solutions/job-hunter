import React from "react";
import Layout from "../../template/Layout";
import JobCard from "./JobCard.v2";
import "./testCompoment.css";

type ApplicantCardProps = {
  initials: string;
  name: string;
  resumeName: string;
  badge: string;
};

const ApplicantCard = ({
  initials,
  name,
  resumeName,
  badge,
}: ApplicantCardProps) => (
  <section className="tc_profile_card" aria-label="Selected applicant">
    <div className="tc_avatar" aria-hidden="true">
      {initials}
    </div>
    <div className="tc_profile_copy">
      <h1>{name}</h1>
      <p>Resume: {resumeName}</p>
    </div>
    <span className="tc_type_badge">{badge}</span>
  </section>
);

type StatusCardProps = {
  title: string;
  subtitle: string;
};

const StatusCard = ({ title, subtitle }: StatusCardProps) => (
  <section className="tc_success_card" aria-label="Autofill status">
    <div className="tc_success_icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 12.5l4.2 4.2L19 7" />
      </svg>
    </div>
    <div className="tc_success_copy">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  </section>
);

const NextStep = () => (
  <section className="tc_next_step" aria-labelledby="tc_next_step_title">
    <div className="tc_next_icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 12h14" />
        <path d="M14 7l5 5-5 5" />
      </svg>
    </div>
    <h2 id="tc_next_step_title">Next: capture a screenshot as proof</h2>
  </section>
);

type ScreenshotButtonProps = {
  onClick?: () => void;
};

const ScreenshotButton = ({ onClick }: ScreenshotButtonProps) => (
  <button className="tc_screenshot_button" type="button" onClick={onClick}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
    <span>Take Screenshot</span>
  </button>
);

type InfoCardProps = {
  text: string;
};

const InfoCard = ({ text }: InfoCardProps) => (
  <aside className="tc_info_card" aria-label="Additional instructions">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
    <p>{text}</p>
  </aside>
);

type BackLinkProps = {
  href?: string;
  text: string;
};

const BackLink = ({ href = "#", text }: BackLinkProps) => (
  <a className="tc_back_link" href={href}>
    {text}
  </a>
);

const TestCompoment = (props: any) => {
  const { setShowPage, showPage } = props;

  return (
    <Layout setShowPage={setShowPage} showPage={showPage} firstBgWidth="10">
      <div className="tc_content">
        <ApplicantCard
          initials="DJ"
          name="Deepak Joshi"
          resumeName="Angela G. Dillingham"
          badge="Individual"
        />
        <JobCard
          jobTitle="Senior Frontend Engineer"
          userName="Deepak Joshi"
        />
        <StatusCard
          title="Autofill complete · 14 fields"
          subtitle="Review the form before submitting"
        />
        <NextStep />
        <ScreenshotButton />
        <InfoCard text="More pages? Move to the next page in the tab, then come back and Auto Fill again." />
        <BackLink text="Back to start" />
      </div>
    </Layout>
  );
};

export default TestCompoment;
