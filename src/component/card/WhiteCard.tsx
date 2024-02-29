import React from "react";
import "./index.css";

const WhiteCard = (props) => {
  const { children } = props;
  return <div className="ci-white-card">{children}</div>;
};

export default WhiteCard;
