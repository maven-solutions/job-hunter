import React, { useState } from "react";
import { Menu, X } from "react-feather";
import MenuPopUp from "../component/menuPopup/MenuPopUp";

const AllSvg = (props: any) => {
  const { firstBgWidth, secondBgWidth, setShowPage, popup, showPage } = props;
  const [showHamburger, setShowHamBurger] = useState<any>(false);
  return (
    <>
      {" "}
      {!popup && (
        <>
          {" "}
          <div className="jd-bg-1">
            <img
              className="ci_ovalbg"
              src={chrome.runtime.getURL("ovalbg.svg")}
              alt="ovalbg-icon"
              style={{ width: `${firstBgWidth ? firstBgWidth + "%" : ""}` }}
            />
          </div>
          <div className="jd-bg-2">
            <img
              className="ci_ovalbg2"
              src={chrome.runtime.getURL("ovalbg2.svg")}
              alt="ovalbg2-icon"
              style={{ width: `${secondBgWidth ? secondBgWidth + "%" : ""}` }}
            />
          </div>
        </>
      )}
      <div
        className={` ${
          popup
            ? "job__detail__container-inner--popup-desing"
            : "job__detail__container-inner"
        }`}
      >
        <div className="job_detail_header">
          <img src={chrome.runtime.getURL("hub.svg")} alt="hub-icon" />
        </div>
        {!popup && (
          <Menu
            className="ci_job_detail_hamurger"
            onClick={() => setShowHamBurger(true)}
          />
        )}
        {popup && (
          <X
            className="ci_job_detail_hamurger"
            onClick={() => window.close()}
          />
        )}
        {showHamburger && (
          <MenuPopUp
            setShowPage={setShowPage}
            layout
            setShowHamBurger={setShowHamBurger}
            showHamburger={showHamburger}
            showPage={showPage}
          />
        )}
      </div>
    </>
  );
};

export default AllSvg;
