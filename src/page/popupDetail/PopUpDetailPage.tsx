import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Footer from "./Footer";
import { Briefcase, File, FileText, PlusCircle, Scissors } from "react-feather";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";
import Height from "../../component/height/Height";
import { WEBSITE_URL } from "../../config/urlconfig";

const PopUpDetailPage = (props: any) => {
  const { setShowPage, popup } = props;

  const hanldeNewResume = () => {
    window.open(`${WEBSITE_URL}/select-resume-template/v2`, "_blank");
  };
  const hanldeNewCoverLetter = () => {
    window.open(`${WEBSITE_URL}/select-cover-template/v2`, "_blank");
  };

  const hanldeJobTracker = () => {
    window.open(`${WEBSITE_URL}/v2/job-tracker`, "_blank");
  };
  const hanldeJobTailor = () => {
    window.open(`${WEBSITE_URL}/resume/v2`, "_blank");
  };
  return (
    <>
      {" "}
      <Layout setShowPage={setShowPage} popup={popup} popupDetail>
        <div className="ci_popup_content_section">
          {/* <div className="ci__popup__content__image__section">
            {" "}
            <img src={chrome.runtime.getURL("jobtrack.svg")} alt="hub-icon" />
          </div> */}
          {/* <div className="ci_popup_list_section">
            <div className="ci_popup_list_underline">
              <PlusCircle className="ci_popup_list_icon" />
              <span className="ci_popup_list_title"> New Resume</span>{" "}
            </div>
          </div> */}
          {/* <Height height="15" /> */}
          <div className="ci_popup_all_list_grid">
            <div
              className="ci_popup_all_list_grid_item"
              onClick={hanldeNewResume}
            >
              <FileText />
              New <br />
              Resume
            </div>
            <div
              className="ci_popup_all_list_grid_item"
              onClick={hanldeNewCoverLetter}
            >
              <File />
              New <br />
              Cover Letter
            </div>

            <div
              className="ci_popup_all_list_grid_item"
              onClick={hanldeJobTailor}
            >
              {/* <Scissors /> */}
              <img src={chrome.runtime.getURL("tailoredIcon.svg")} width={45} />
              Tailor
              <br /> To Job
            </div>
            <div
              className="ci_popup_all_list_grid_item"
              onClick={hanldeJobTracker}
            >
              <Briefcase />
              Track <br />
              Your Job
            </div>
          </div>

          {/* <div className="ci_popup_all_list_section">
            <div className="ci_popup_list">
              <File />
              New Cover Letter
            </div>
            <div className="ci_popup_list">
              <FileText />
              New Resume
            </div>
            <div className="ci_popup_list">
              <Scissors />
              Tailor To Job
            </div>
            <div className="ci_popup_list">
              <Briefcase />
              Track Your Job
            </div>
          </div> */}

          {/* <PrimaryButton
            type="button"
            text="New Cover Letter"
            color="ci-blue-bg"
          />
          <Height height="10" />
          <PrimaryButton type="button" text="New Resume" color="ci-red-bg" />
          <Height height="10" />
          <PrimaryButton
            type="button"
            text="Tailor To Job"
            color="ci-yellow-bg"
          />

          <Height height="10" />
          <PrimaryButton
            type="button"
            text="Track Your Job"
            color="ci-green-bg"
          /> */}
          {/* <div className="ci_popup_list_section">
            <div className="ci_popup_list_underline">
              <PlusCircle className="ci_popup_list_icon" />
              <span className="ci_popup_list_title"> New Cover Letter</span>
            </div>
          </div>
          <div className="ci_popup_list_section">
            <div className="ci_popup_list_underline">
              <File className="ci_popup_list_icon" />
              <span className="ci_popup_list_title"> Tailor To Job</span>
            </div>
          </div> */}
        </div>
        <Footer />
      </Layout>
    </>
  );
};

export default PopUpDetailPage;
