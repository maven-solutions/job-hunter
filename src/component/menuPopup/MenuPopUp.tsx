import React from "react";
import "./index.css";
import Height from "../height/Height";
import { SHOW_PAGE } from "../../utils/constant";
import {
  EXTENSION_IN_LIVE,
  EXTENSION_IN_LOCAL,
  EXTENSION_IN_STAGING,
  LIVE_WEBSITE_URL,
  STAGING_WEBSITE_URL,
} from "../../config/urlconfig";

const MenuPopUp = (props: any) => {
  const { setShowPage } = props;

  const viewJobBoard = () => {
    if (EXTENSION_IN_LOCAL) {
      window.open("http://localhost:3000/job-tracker/v2", "_blank");
    }
    if (EXTENSION_IN_STAGING) {
      window.open(`${STAGING_WEBSITE_URL}/job-tracker/v2`, "_blank");
    }
    if (EXTENSION_IN_LIVE) {
      window.open(`${LIVE_WEBSITE_URL}/job-tracker/v2`, "_blank");
    }
  };

  return (
    <div className="ci_menu_outer_continer">
      {" "}
      <div className="ci_menu_pop_up_container">
        <div
          className="ci_menu_list_item"
          role="button"
          onClick={() => setShowPage(SHOW_PAGE.jobDetailPage)}
        >
          <img src={chrome.runtime.getURL("pin.svg")} alt="pin-icon" />
          <span>Save to jobs </span>
        </div>
        <Height height="20" />
        <div className="ci_menu_list_item" role="button" onClick={viewJobBoard}>
          <img src={chrome.runtime.getURL("jobboard.svg")} alt="pin-icon" />
          <span>View Job Board </span>
        </div>
        <Height height="20" />
        <div
          className="ci_menu_list_item"
          role="button"
          onClick={() => setShowPage(SHOW_PAGE.profilePage)}
        >
          <img src={chrome.runtime.getURL("user.svg")} alt="pin-icon" />
          <span>Profile </span>
        </div>
      </div>
      <Height height="13" />
    </div>
  );
};

export default MenuPopUp;
