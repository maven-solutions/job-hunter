import React from "react";
import "./index.css";

const PrimaryButton = (props: any) => {
  const { loading, onclick, text, loadingText } = props;
  return (
    <button
      type="button"
      className="ci_job_save_button"
      onClick={onclick}
      disabled={loading}
    >
      {loading ? loadingText : text}
    </button>
  );
};

export default PrimaryButton;
