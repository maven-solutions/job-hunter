import React from "react";
import "./index.css";
import Height from "../height/Height";

const MenuPopUp = () => {
  return (
    <div className="ci_menu_outer_continer">
      {" "}
      <div className="ci_menu_pop_up_container">
        <div className="ci_menu_list_item" role="button">
          <img src={chrome.runtime.getURL("pin.svg")} alt="pin-icon" />
          <span>Save to jobs </span>
        </div>
        <Height height="20" />
        <div className="ci_menu_list_item" role="button">
          <img src={chrome.runtime.getURL("jobboard.svg")} alt="pin-icon" />
          <span>View Job Board </span>
        </div>
        <Height height="20" />
        <div className="ci_menu_list_item" role="button">
          <img src={chrome.runtime.getURL("user.svg")} alt="pin-icon" />
          <span>Profile </span>
        </div>
      </div>
      <Height height="13" />
    </div>
  );
};

export default MenuPopUp;
