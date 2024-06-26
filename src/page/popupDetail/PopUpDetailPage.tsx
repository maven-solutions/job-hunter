import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import Footer from "./Footer";
import { File, PlusCircle } from "react-feather";

const PopUpDetailPage = (props: any) => {
  const { setShowPage, popup } = props;
  return (
    <>
      {" "}
      <Layout setShowPage={setShowPage} popup={popup} popupDetail>
        <div className="ci_popup_content_section">
          <div className="ci_popup_list_section">
            <div className="ci_popup_list_underline">
              <PlusCircle className="ci_popup_list_icon" />
              <span className="ci_popup_list_title"> New Resume</span>{" "}
            </div>
          </div>
          <div className="ci_popup_list_section">
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
          </div>
        </div>
        <Footer />
      </Layout>
    </>
  );
};

export default PopUpDetailPage;
