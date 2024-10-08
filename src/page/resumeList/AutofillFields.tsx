import React from "react";

import { detectInputAndFillData } from "../../autofill/helper";
import "./index.css";
const AutofillFields = (props: any) => {
  const { setAutoFilling } = props;

  const startLoading = () => {
    setAutoFilling(true);
  };

  const stopLoading = () => {
    setAutoFilling(false);
  };

  const autofillByContentScript = () => {
    const url = window.location.href;

    detectInputAndFillData(startLoading, stopLoading);
  };

  const handleAutofill = () => {
    autofillByContentScript();
  };

  return (
    <div className="ci_va_two_button_section">
      <span />
      <div className="ext__autofill__fields__wrapper">
        <div className="autofill__btn__wrapper">
          <button className="autofill__btn" onClick={() => handleAutofill()}>
            Auto Fill
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutofillFields;
