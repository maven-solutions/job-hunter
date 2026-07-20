import React from "react";

export type SwitchTabMode = "va" | "individual";

interface SwitchTabV2Props {
  value: SwitchTabMode;
}

const SwitchTabV2 = ({ value }: SwitchTabV2Props) => {
  const activeLabel = value === "individual" ? "Individual" : "Organization";

  return (
    <div className="segment-control" aria-label="Active applicant type">
      <label>{activeLabel}</label>
    </div>
  );
};

export default SwitchTabV2;
