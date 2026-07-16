import React from "react";

interface SupportMessageV2Props {
  message?: string;
}

const SupportMessageV2 = ({
  message = "This site supports Autofill",
}: SupportMessageV2Props) => {
  return (
    <div className="support-message">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{message}</span>
    </div>
  );
};

export default SupportMessageV2;
