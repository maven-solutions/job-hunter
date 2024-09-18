import React, { useState } from "react";
import "./addMissingLink.css";

const AddMissingLink = () => {
  const [newUrl, setNewUrl] = useState<string>("");
  const [showInput, setShowInput] = useState<boolean>(false);

  const addUrl = () => {
    const splitted = newUrl.split("/");
    if (splitted && splitted.length > 2) {
      const currentWebURL = splitted[2];
      chrome.storage.local.set({ newUrl: currentWebURL }, () => {
        setNewUrl("");
      });
    }
  };

  return (
    <>
      <span
        className="ci_autofill_add_missing_sites"
        onClick={() => setShowInput(!showInput)}
      >
        {" "}
        Add Missing Website
      </span>
      {showInput && (
        <div className="ci_autofill_va_mssing_input_section">
          <input
            id="link"
            type="url"
            className="ci_autofill_input_link_box"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Enter Url Of Missing Website"
          />
          <button
            type="button"
            onClick={addUrl}
            className="ci_autofill_add_link_btn"
          >
            Add
          </button>
        </div>
      )}
    </>
  );
};

export default AddMissingLink;
