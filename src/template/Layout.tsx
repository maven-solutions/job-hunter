import React from "react";
import CloseIcon from "../component/CloseIcon";
import AllSvg from "../contentScript/AllSvg";
import "./layout.css";
import { ChevronLeft, ChevronRight } from "react-feather";

const Layout = (props: any) => {
  const { children, setShowPage, firstBgWidth, secondBgWidth } = props;
  return (
    <div className="job__detail__container">
      <div className="jd-inner">
        <div
          className="ci_jobs__collapse_button"
          onClick={() => setShowPage("")}
        >
          {/* <CloseIcon /> */}
          <ChevronRight className="ci_job_close_icon" />
        </div>
        <AllSvg
          firstBgWidth={firstBgWidth}
          secondBgWidth={secondBgWidth}
          setShowPage={setShowPage}
        />
        <div className="jd-inner-padding">{children} </div>
      </div>
    </div>
  );
};

export default Layout;
