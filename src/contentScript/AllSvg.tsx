import React from "react";

const AllSvg = () => {
  return (
    <>
      {" "}
      <div className="jd-bg-1">
        <img
          className="ci_ovalbg"
          src={chrome.runtime.getURL("ovalbg.svg")}
          alt="ovalbg-icon"
        />
      </div>
      <div className="jd-bg-2">
        <img
          className="ci_ovalbg2"
          src={chrome.runtime.getURL("ovalbg2.svg")}
          alt="ovalbg2-icon"
        />
      </div>
      <div className="job__detail__container-inner">
        <div className="job_detail_header">
          <img src={chrome.runtime.getURL("hub.svg")} alt="hub-icon" />
        </div>
      </div>
    </>
  );
};

export default AllSvg;
