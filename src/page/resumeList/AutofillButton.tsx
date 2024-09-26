import React from "react";

const AutofillButton = (props: any) => {
  const { resumeList, onClick, text } = props;
  return (
    <div className="ext__autofill__fields__wrapper">
      <div className="autofill__btn__wrapper">
        <button
          className={`autofill__btn ${
            resumeList.res_success ? "" : "autofill__button__disable"
          }`}
          onClick={onClick}
          disabled={resumeList.res_success ? false : true}
        >
          {text}
        </button>
      </div>
    </div>
  );
};

export default AutofillButton;
