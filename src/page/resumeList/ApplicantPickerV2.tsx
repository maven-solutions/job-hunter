import React, { useRef } from "react";
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
  activeSessionUserId?: string | number | null;
  onSelect: (option: ApplicantOption) => void;
}

const ApplicantPickerV2 = ({
  name,
  role,
  options,
  selectedValue,
  activeSessionUserId,
  onSelect,
}: ApplicantPickerV2Props) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedInitials = getInitials(name);

  const handleSelect = (option: ApplicantOption) => {
    onSelect(option);
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details className="applicant-picker" ref={detailsRef}>
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
          const hasActiveSession =
            activeSessionUserId != null &&
            activeSessionUserId === option.value;
          return (
            <button
              className={`applicant-option ${isSelected ? "applicant-option--selected" : ""}`}
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
            >
              <span className="avatar avatar--soft">{initials}</span>
              <span>
                <strong>{optionName}</strong>
                <small>{isSelected ? role : "Applicant"}</small>
              </span>
              {hasActiveSession && (
                <span className="applicant-option__session-badge">
                  Active session
                </span>
              )}
            </button>
          );
        })}
      </div>
    </details>
  );
};

export default ApplicantPickerV2;
