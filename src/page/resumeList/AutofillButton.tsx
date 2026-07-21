import React, { ReactNode } from "react";

type AutofillButtonVariant = "primary" | "secondary";

interface AutofillButtonProps {
  resumeList?: any;
  onClick?: () => void;
  text: string;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: AutofillButtonVariant;
  loading?: boolean;
  loadingText?: string;
}

const AutofillButton = ({
  resumeList,
  onClick,
  text,
  disabled,
  icon,
  variant = "primary",
  loading = false,
  loadingText = "Loading...",
}: AutofillButtonProps) => {
  const isDisabled = loading || disabled;

  return (
    <div className="ext__autofill__fields__wrapper">
      <div className="autofill__btn__wrapper">
        <button
          className={`autofill__btn autofill__btn--${variant} ${
            loading
              ? "autofill__btn--loading"
              : isDisabled
                ? "autofill__button__disable"
                : ""
          }`}
          onClick={onClick}
          disabled={isDisabled}
          type="button"
        >
          {loading ? (
            <span
              className="autofill__btn__icon autofill__btn__spinner"
              aria-hidden="true"
            />
          ) : (
            icon && (
              <span className="autofill__btn__icon" aria-hidden="true">
                {icon}
              </span>
            )
          )}
          <span className="autofill__btn__text">
            {loading ? loadingText : text}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AutofillButton;
