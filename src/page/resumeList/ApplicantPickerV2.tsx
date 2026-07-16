import React from "react";
import { getInitials } from "./helper";

interface ApplicantOption {
  label?: string;
  value: string | number;
}

interface ApplicantPickerV2Props {
  name: string;
  role: string;
  options: ApplicantOption[];
  selectedValue?: string | number | null;
  onSelect: (option: ApplicantOption) => void;
}

const ApplicantPickerV2 = ({
  name,
  role,
  options,
  selectedValue,
  onSelect,
}: ApplicantPickerV2Props) => {
  const selectedInitials = getInitials(name);

  return (
    <details className="applicant-picker">
      <summary className="applicant-summary">
        <span className="avatar avatar--primary">
          {selectedInitials || "NA"}
        </span>
        <span className="applicant-copy">
          <strong>{name}</strong>
          <small>{role}</small>
        </span>
        <svg aria-hidden="true" className="chevron" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>

      <div className="applicant-menu">
        {(options ?? []).map((option) => {
          const optionName = option.label ?? "Applicant";
          const initials = getInitials(optionName);
          const isSelected = selectedValue === option.value;
          return (
            <button
              className={`applicant-option ${isSelected ? "applicant-option--selected" : ""}`}
              key={option.value}
              type="button"
              onClick={() => onSelect(option)}
            >
              <span className="avatar avatar--soft">{initials}</span>
              <span>
                <strong>{optionName}</strong>
                <small>{isSelected ? role : "Applicant"}</small>
              </span>
            </button>
          );
        })}
      </div>
    </details>
  );
};

export default ApplicantPickerV2;
