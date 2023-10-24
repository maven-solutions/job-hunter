import React from "react";

const InputBox = (props: any) => {
  const { title } = props;
  return (
    <div className="job_input_section">
      <span className="job_box_title">{title} </span>
      <input type="text" className="job_input_box" />
    </div>
  );
};

export default InputBox;
