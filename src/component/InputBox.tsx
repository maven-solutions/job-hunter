import React from "react";
import {
  setJobCompany,
  setJobLocation,
  setJobTitle,
} from "../store/features/JobDetail/JobDetailSlice";

const InputBox = (props: any) => {
  const {
    title,
    type,
    value,
    valueSetter,
    name,
    placeholder,
    dispatch,
    jobtitle,
    company,
    location,
  } = props;

  const handleOnChange = (e: any) => {
    if (jobtitle) {
      dispatch(setJobTitle(e.target.value));
    }
    if (company) {
      dispatch(setJobCompany(e.target.value));
    }
    if (location) {
      dispatch(setJobLocation(e.target.value));
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
        onChange={handleOnChange}
        placeholder={placeholder ?? ""}
      />
    </div>
  );
};

export default InputBox;
