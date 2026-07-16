import React, { ReactNode } from "react";

type AutofillButtonVariant = "primary" | "secondary";

interface AutofillButtonProps {
  resumeList?: any;
  onClick?: () => void;
  text: string;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: AutofillButtonVariant;
}

const AutofillButton = ({
  resumeList,
  onClick,
  text,
  disabled,
  icon,
  variant = "primary",
}: AutofillButtonProps) => {
  const isDisabled = disabled ?? !resumeList?.res_success;

  return (
    <div className="ext__autofill__fields__wrapper">
      <div className="autofill__btn__wrapper">
        <button
          className={`autofill__btn autofill__btn--${variant} ${
            isDisabled ? "autofill__button__disable" : ""
          }`}
          onClick={onClick}
          disabled={isDisabled}
          type="button"
        >
          {icon && (
            <span className="autofill__btn__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="autofill__btn__text">{text}</span>
        </button>
      </div>
    </div>
  );
};

export default AutofillButton;
