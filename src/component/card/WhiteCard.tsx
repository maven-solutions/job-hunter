import React from "react";
import "./index.css";

const WhiteCard = (props) => {
  const { children, hover, onclick } = props;
  return (
    <div
      className={`ci-white-card ${hover && "ci-white-card-hover"}`}
      onClick={onclick}
    >
      {children}
    </div>
  );
};

export default WhiteCard;
