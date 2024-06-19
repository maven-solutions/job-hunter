import React, { useEffect, useState } from "react";
import "./index.css";
import Height from "../height/Height";
import { SHOW_PAGE, USER_ROLE_TYPE } from "../../utils/constant";
import {
  EXTENSION_IN_LIVE,
  EXTENSION_IN_LOCAL,
  EXTENSION_IN_STAGING,
  LIVE_WEBSITE_URL,
  STAGING_WEBSITE_URL,
} from "../../config/urlconfig";
import { RootStore, useAppSelector } from "../../store/store";
import { X } from "react-feather";

const MenuPopUp = (props: any) => {
  const { setShowPage, layout, setShowHamBurger } = props;
  const [hideAutofill, setHideAutofill] = useState(false);

  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  useEffect(() => {
    if (
      [
        "linkedin",
        "indeed",
        "dice",
        "ziprecruiter",
        "glassdoor",
        "simplyhired",
        "builtin",
      ].some((domain) => window.location.href.includes(domain))
    ) {
      setHideAutofill(true);
    }
  }, []);
  const viewJobBoard = () => {
    // for induvidual
    if (EXTENSION_IN_LOCAL && authState?.ci_user?.organizations?.length === 0) {
      window.open("http://localhost:3000/v2/job-tracker", "_blank");
    }
    if (
      EXTENSION_IN_STAGING &&
      authState?.ci_user?.organizations?.length === 0
    ) {
      window.open(`${STAGING_WEBSITE_URL}/v2/job-tracker`, "_blank");
    }
    if (EXTENSION_IN_LIVE && authState?.ci_user?.organizations?.length === 0) {
      window.open(`${LIVE_WEBSITE_URL}/v2/job-tracker`, "_blank");
    }

    // for org user

    if (EXTENSION_IN_LOCAL && authState?.ci_user?.organizations?.length > 0) {
      window.open("http://localhost:3000/dashboard/job-tracker", "_blank");
    }
    if (EXTENSION_IN_STAGING && authState?.ci_user?.organizations?.length > 0) {
      window.open(`${STAGING_WEBSITE_URL}/dashboard/job-tracker`, "_blank");
    }
    if (EXTENSION_IN_LIVE && authState?.ci_user?.organizations?.length > 0) {
      window.open(`${LIVE_WEBSITE_URL}/dashboard/job-tracker`, "_blank");
    }
  };

  const callAutoFill = () => {
    setShowPage(SHOW_PAGE.resumeListPage);
  };
  // USER_ROLE_TYPE;
  return (
    <div
      className={`${
        layout ? "ci_menu_outer_continer_new" : "ci_menu_outer_continer"
      }`}
    >
      <div className="ci_menu_pop_up_container">
        {layout && (
          <div className="ci_hambirger_close_icon_section">
            <X
              className="ci_hambirger_close_icon"
              onClick={() => setShowHamBurger(false)}
            />{" "}
          </div>
        )}
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

        {(authState?.ci_user?.organizations?.length === 0 ||
          authState?.ci_user?.organizations?.length > 0) &&
          !hideAutofill && (
            <>
              <Height height="20" />
              <div
                className="ci_menu_list_item"
                role="button"
                onClick={callAutoFill}
              >
                <img
                  src={chrome.runtime.getURL("jobboard.svg")}
                  alt="pin-icon"
                />
                <span>Autofill </span>
              </div>
            </>
          )}
      </div>
      <Height height="13" />
    </div>
  );
};

export default MenuPopUp;
