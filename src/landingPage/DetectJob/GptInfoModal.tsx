import React from "react";
import "./ResumeGPTInstructions.css";

const ResumeGptInfoModal = ({ setInfoOpen, infoOpen }) => {
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    dialog: {
      backgroundColor: "white",
      borderRadius: "5px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      display: "flex",
      flexDirection: "column",
      // height: "80vh",
      // width: "40vh",
      // overflowY: "auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 15px",
      borderBottom: "1px solid #ccc",
      color: "#333",
      fontSize: "23px",
      fontWeight: "bold",
    },
    icon: {
      marginRight: "10px",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "20px",
    },
    content: {
      padding: "15px 0px",
      color: "#333",
      maxHeight: "90vh",
      overflowY: "auto",
    },
  };

  return (
    <>
      {infoOpen && (
        <div style={styles.overlay as React.CSSProperties}>
          <div style={styles.dialog as React.CSSProperties}>
            <div style={styles.header}>
              <span style={styles.icon}>
                <img
                  src={chrome.runtime.getURL("info-icon.svg")}
                  style={{ height: "30px", width: "30px" }}
                />
              </span>
              <span>GPT Resume Builder by CareerAI</span>
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                style={styles.closeButton}
              >
                <img
                  src={chrome.runtime.getURL("icon-cross.png")}
                  style={{ height: "30px", width: "30px" }}
                />
              </button>
            </div>
            <div style={styles.content}>
              <div className="resume-gpt-container">
                <ol>
                  <li>
                    The GPT Resume Builder is a state-of-the-art tool that uses
                    advanced AI to craft personalized, professional resumes with
                    ease.
                  </li>
                  <li>
                    You provide the resume that you want to improve, provide the
                    job role or job description as well if you want to target
                    the resume for any specific role.
                  </li>
                  <li>
                    Interact with chat gpt to better the resume and when you are
                    done with the resume, just click on generate resume, and it
                    will create a resume for you in well formatted way, ready to
                    download. This process not only makes resume creation
                    straightforward but also ensures your resume is tailored to
                    the job you're aiming for, boosting your chances of success.
                  </li>
                  {/* <li>
                    If you're reading this, Congrats! You’re officially part of
                    CareerAI. Now, let’s jump into the job opportunities!
                  </li> */}

                  {/* <li>
                    This tool is integrated with{" "}
                    <a
                      href="https://careerai.io"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      CareerAI.io
                    </a>
                    , a platform designed to simplify resume and cover letter
                    creation with a variety of professional, ATS-friendly
                    templates.
                  </li>
                  <li>
                    To generate a resume through the ChatGPT interface, you need
                    to create an account. Visit{" "}
                    <a
                      href="https://app.careerai.io/login"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      app.careerai.io/login
                    </a>{" "}
                    to sign up.
                  </li>
                  <li>
                    Use a prompt similar to the example below to get started:
                    <div className="highlight">
                      My name is John Doe, and I am a Product Owner with 2 years
                      of experience in Java, Python, and cloud technologies. I
                      live in Georgia and have a Master’s degree in Product
                      Management from California University, which I earned in
                      2023. Before this, I worked at Microsoft as an Associate
                      Product Owner from June 2019 to August 2022. I also hold a
                      PSPO certification, and I enjoy traveling and learning new
                      languages.
                    </div>
                  </li>
                  <li>
                    <b>
                      Include more context or information about yourself like
                      educational background, certifications, skills, languages
                      etc. to get more effective resume.
                    </b>
                  </li>
                  <li>
                    Upon requesting the resume, GPT will provide it in a
                    well-organized text format. The aim is to transform this
                    text into a ready-to-use resume.
                  </li>
                  <li>
                    Once you have finalized the resume content in the ChatGPT
                    interface, click the{" "}
                    <span className="highlight">GENERATE RESUME</span> button.
                    The system will process the information and generate your
                    resume.
                  </li>
                  <li>
                    You will be automatically redirected to the CareerAI resume
                    builder page, where you can view and continue refining your
                    resume.
                  </li> */}
                </ol>
                <ul style={{ marginTop: "15px" }}>
                  <b>Supported Sections:</b>
                  <div style={{ marginLeft: "30px" }}>
                    <li>Personal Information</li>
                    <li>Professional Summary/Objective</li>
                    <li>Skills</li>
                    <li>Work Experience</li>
                    <li>Education</li>
                    <li>Certifications</li>
                    <li>Languages</li>
                    <li>Reference</li>
                    <li>Volunteering</li>
                  </div>
                </ul>

                <div>
                  <ul style={{ marginTop: "15px" }}>
                    <b>How it works:</b>
                    <div style={{ marginLeft: "30px" }}>
                      <li>
                        <b>Input Your Details:</b> Start by uploading your
                        existing resume and providing the job role or
                        description for the position you’re targeting.
                      </li>
                      <li>
                        <b>Interactive Refinement:</b> Engage with ChatGPT to
                        ask follow-up questions and make improvements or
                        customizations to your resume.
                      </li>
                      <li>
                        <b>Generate Your Resume:</b> Once you're satisfied with
                        the changes, click "Generate Resume." Your resume will
                        be formatted in CareerAI and ready for download. If
                        you’re not logged in, you’ll be prompted to sign in
                        first. After logging in, the GPT Resume Builder will
                        produce your final resume, ready to be downloaded and
                        used in your job applications.
                      </li>
                    </div>
                    <div style={{ marginTop: "15px" }}>
                      The GPT Resume Builder is designed to help you create a
                      polished, job-specific resume effortlessly, giving you a
                      competitive edge in your job search.
                    </div>
                  </ul>
                </div>
                {/* <center>
                  <a
                    href="https://app.careerai.io/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button"
                    // style={styles.button}
                  >
                    <img
                      src={chrome.runtime.getURL("C.svg")}
                      style={{ height: "25px", width: "25px" }}
                    />
                    Go to CareerAI
                  </a>
                </center> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResumeGptInfoModal;
