import React from "react";
import "./index.css";
const HeadingTitle = (props: any) => {
  const { title } = props;
  return <h1 className="ci_heading_title"> {title}</h1>;
};

export default HeadingTitle;
