import React from "react";
import CloseIcon from "../component/CloseIcon";
import AllSvg from "../contentScript/AllSvg";
import "./layout.css";
import { ChevronLeft, ChevronRight } from "react-feather";

const Layout = (props: any) => {
  const { children, setShowPage, firstBgWidth, secondBgWidth, popup } = props;
  return (
    <div
      className={`${
        popup ? "job__detail__containers" : "job__detail__container"
      }`}
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
        <AllSvg
          firstBgWidth={firstBgWidth}
          secondBgWidth={secondBgWidth}
          setShowPage={setShowPage}
          popup={popup}
        />
        <div className="jd-inner-padding">{children} </div>
      </div>
    </div>
  );
};

export default Layout;
