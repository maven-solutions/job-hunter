import React from "react";
import "./index.css";

const PrimaryButton = (props: any) => {
  const { loading, onclick, text, loadingText, outline, buttonWidth } = props;
  return (
    <button
      type="button"
      className={`ci_job_save_button ${
        outline && "ci_job_save_button_outline"
      }`}
      style={{ width: `${buttonWidth ? buttonWidth + "px" : ""}` }}
      onClick={onclick}
      disabled={loading}
    >
      {loading ? loadingText : text}
    </button>
  );
};

export default PrimaryButton;