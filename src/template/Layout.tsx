import React from "react";
import CloseIcon from "../component/CloseIcon";
import AllSvg from "../contentScript/AllSvg";
import "./layout.css";
import { ChevronLeft, ChevronRight, X } from "react-feather";

const Layout = (props: any) => {
  const {
    children,
    setShowPage,
    firstBgWidth,
    secondBgWidth,
    popup,
    showPage,
    popupDetail,
  } = props;
  return (
    <div
      className={`${
        popup ? "job__detail__containers" : "job__detail__container"
      } `}
    >
      <div className="jd-inner">
        {!popup && (
          <div
            className="ci_jobs__collapse_button"
            onClick={() => setShowPage("")}
          >
            <ChevronRight className="ci_job_close_icon" />
          </div>
        )}
        {!popup && (
          <div
            className="ci_jobs_close_button_at_bottom"
            onClick={() => setShowPage("")}
          >
            <X className="ci_job_close_icon_bottom" />
          </div>
        )}
        <AllSvg
          firstBgWidth={firstBgWidth}
          secondBgWidth={secondBgWidth}
          setShowPage={setShowPage}
          popup={popup}
          showPage={showPage}
        />
        <div
          className={`jd-inner-padding ${
            popupDetail && "ci_popup_layout_nopadding"
          }`}
        >
          {children}{" "}
        </div>
      </div>
    </div>
  );
};

export default Layout;
