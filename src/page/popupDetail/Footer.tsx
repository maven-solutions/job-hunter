import React from "react";
import { Home, User } from "react-feather";
import { EXTENSION_ACTION } from "../../utils/constant";

const Footer = () => {
  const hanldeUserClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: EXTENSION_ACTION.OPEN_PROFILE_OF_CI_EXTENSION,
      });
    });
    window.close();
  };

  return (
    <div className="ci_popup_footer_section">
      <Home className="ci_popup_footer_icon ci_popup_footer_icon_home ci_popup_footer_icon--active" />
      <div
        onClick={hanldeUserClick}
        className="ci_popup_footer_icon ci_popup_footer_icon_user"
      >
        <span> Profile</span>
        <User />
      </div>
    </div>
  );
};

export default Footer;
