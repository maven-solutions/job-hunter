import React from "react";

const InputBox = (props: any) => {
  const { title, value, valueSetter } = props;
  return (
    <div className="job_input_section">
      <span className="job_box_title">{title} </span>
      <input
        type="text"
        className="job_input_box"
        value={value}
        onChange={(e) => valueSetter(e.target.value)}
      />
    </div>
  );
};

export default InputBox;
