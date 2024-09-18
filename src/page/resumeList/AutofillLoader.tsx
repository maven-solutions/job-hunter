import React from "react";
import Spinner from "../shared/Spinner";

const AutofillLoader = () => {
  return (
    <>
      {" "}
      <div style={{ padding: "10px", paddingTop: "0" }}>
        <Spinner size={60} />
      </div>
      <span className="ci_form_filling_text">Form Filling Please Wait... </span>
    </>
  );
};

export default AutofillLoader;
