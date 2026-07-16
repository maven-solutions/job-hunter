import React from "react";

const AutofillButton = (props: any) => {
  const { resumeList, onClick, text, disabled } = props;
  const isDisabled = disabled ?? !resumeList.res_success;

  return (
    <div className="ext__autofill__fields__wrapper">
      <div className="autofill__btn__wrapper">
        <button
          className={`autofill__btn ${
            isDisabled ? "autofill__button__disable" : ""
          }`}
          onClick={onClick}
          disabled={isDisabled}
        >
          {text}
        </button>
      </div>
    </div>
  );
};

export default AutofillButton;
