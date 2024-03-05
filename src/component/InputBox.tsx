import React from "react";

const InputBox = (props: any) => {
  const { title, type, value, valueSetter, name, placeholder } = props;

  const setValue = (e: any) => {
    if (e.target.value) {
      valueSetter(e.target.value);
    }
  };

  return (
    <div className="job_input_section">
      <label htmlFor={name} className="job_box_title">
        {title}{" "}
      </label>
      <input
        id={name}
        name={name}
        type={type || "text"}
        className="job_input_box"
        value={value ?? ""}
        onChange={(e) => valueSetter(e.target.value)}
        placeholder={placeholder ?? ""}
      />
    </div>
  );
};

export default InputBox;
