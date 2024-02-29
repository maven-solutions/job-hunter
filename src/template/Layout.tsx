import React from "react";
import CloseIcon from "../component/CloseIcon";
import AllSvg from "../contentScript/AllSvg";
import "./layout.css";

const Layout = (props: any) => {
  const { children, setShowForm } = props;
  return (
    <div className="job__detail__container">
      <div className="jd-inner">
        <div className="jobs__collapse" onClick={() => setShowForm(false)}>
          <CloseIcon />
        </div>
        <AllSvg />
        <div className="jd-inner-padding"> {children} </div>
      </div>
    </div>
  );
};

export default Layout;
