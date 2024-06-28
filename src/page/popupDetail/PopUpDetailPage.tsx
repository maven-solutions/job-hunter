import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Footer from "./Footer";
import { File, PlusCircle } from "react-feather";
import PrimaryButton from "../../component/primaryButton/PrimaryButton";
import Height from "../../component/height/Height";

const PopUpDetailPage = (props: any) => {
  const { setShowPage, popup } = props;
  return (
    <>
      {" "}
      <Layout setShowPage={setShowPage} popup={popup} popupDetail>
        <div className="ci_popup_content_section">
          <div className="ci__popup__content__image__section">
            {" "}
            <img src={chrome.runtime.getURL("jobtrack.svg")} alt="hub-icon" />
          </div>
          {/* <div className="ci_popup_list_section">
            <div className="ci_popup_list_underline">
              <PlusCircle className="ci_popup_list_icon" />
              <span className="ci_popup_list_title"> New Resume</span>{" "}
            </div>
          </div> */}
          <PrimaryButton
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
          />
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
