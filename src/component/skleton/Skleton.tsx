import React from "react";
import "./index.css";
import WhiteCard from "../card/WhiteCard";

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
      <div className="ci--skeleton--subtitle" />
      <div className="ci--skeleton--subtitle" />
    </>
  );
};
