import React from "react";
import "./index.css";
import WhiteCard from "../card/WhiteCard";
import Height from "../height/Height";

const Skleton = () => {
  return (
    <WhiteCard hover>
      <div className="ci--skeleton--title" />
      <div className="ci--skeleton--subtitle" />
      <div className="ci--skeleton--subtitle" />
    </WhiteCard>
  );
};

export default Skleton;

export const ResumeSkleton = () => {
  return (
    <>
      <Height height="10" />
      <div className="ci--skeleton--subtitle" />
      <div className="ci--skeleton--subtitle" />
    </>
  );
};
