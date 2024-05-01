import React from "react";
import "./index.css";

export const LogoutButton = (props: any) => {
  const { loading, onclick, text, loadingText, outline, buttonWidth } = props;
  return (
    <button
      type="button"
      className={`ci_job_logout_button`}
      style={{ width: `${buttonWidth ? buttonWidth + "px" : ""}` }}
      onClick={onclick}
      disabled={loading}
    >
      Log Out
    </button>
  );
};

const PrimaryButton = (props: any) => {
  const {
    loading,
    onclick,
    text,
    loadingText,
    outline,
    buttonWidth,
    disabled,
  } = props;

  return (
    <button
      type="button"
      className={`ci_job_save_button ${
        outline && "ci_job_save_button_outline"
      } ${disabled && "ci_job__button__disabled"}`}
      style={{ width: `${buttonWidth ? buttonWidth + "px" : ""}` }}
      onClick={onclick}
      disabled={disabled}
    >
      {loading ? loadingText : text}
    </button>
  );
};

export default PrimaryButton;
