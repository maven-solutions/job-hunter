import React from "react";
import Select from "react-select";
import HeadingTitle from "../../component/heading/HeadingTitle";
import { RootStore, useAppSelector } from "../../store/store";

const UserSelectList = (props: any) => {
  const { selectedUserValue, handleSelectChanges } = props;
  const resumeList: any = useAppSelector((store: RootStore) => {
    return store.ResumeListSlice;
  });
  return (
    <div className="va_user_select_section_wrapper">
      <HeadingTitle title="Applicant List:" />
      <Select
        isSearchable={false}
        options={resumeList?.userList}
        className="react-select-container-va"
        classNamePrefix="react-select"
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            fontSize: 14,
            padding: "-2px 10px",
            borderRadius: "5px",
            cursor: "pointer",
          }),
          option: (provided, state) => ({
            ...provided,
            fontSize: 14,
            cursor: "pointer",
            background: state.isSelected ? "#4339f2" : "#white",
          }),
        }}
        value={selectedUserValue}
        placeholder="Select Applicant"
        onChange={(option) => handleSelectChanges(option)}
      />
    </div>
  );
};

export default UserSelectList;
