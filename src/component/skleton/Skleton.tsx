import React from "react";
import "./index.css";
import WhiteCard from "../card/WhiteCard";

const Skleton = () => {
  return (
    <WhiteCard hover>
      <div className="ci--skeleton--title"></div>
      <div className="ci--skeleton--subtitle"></div>
      <div className="ci--skeleton--subtitle"></div>
    </WhiteCard>
  );
};

export default Skleton;
