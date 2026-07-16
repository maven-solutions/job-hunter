import React from "react";

export type SwitchTabMode = "va" | "individual";

interface SwitchTabV2Props {
  value: SwitchTabMode;
  onChange: (mode: SwitchTabMode) => void;
  ariaLabel?: string;
}

const SwitchTabV2 = ({
  value,
  onChange,
  ariaLabel = "Applicant type",
}: SwitchTabV2Props) => {
  return (
    <div className="segment-control" aria-label={ariaLabel}>
      <input
        id="organization"
        className="visually-hidden"
        type="radio"
        checked={value === "va"}
        onChange={() => onChange("va")}
      />
      <label htmlFor="organization">Organization</label>
      <input
        id="individual"
        className="visually-hidden"
        type="radio"
        checked={value === "individual"}
        onChange={() => onChange("individual")}
      />
      <label htmlFor="individual">Individual</label>
    </div>
  );
};

export default SwitchTabV2;
