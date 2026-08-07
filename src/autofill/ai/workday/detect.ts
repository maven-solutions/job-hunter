/**
 * Workday apply-flow page detection.
 * Keep page checks here so section modules stay independent.
 */

export type WorkdayApplySectionId =
  | "myInformation"
  | "myExperience"
  | "applicationQuestions"
  | "other";

export const isWorkdayMyInformationPage = (): boolean =>
  !!document.querySelector('[data-automation-id="applyFlowMyInfoPage"]') ||
  !!document.querySelector('[data-automation-id="formField-country"]');

export const isWorkdayMyExperiencePage = (): boolean =>
  !!document.querySelector('[data-automation-id="applyFlowMyExpPage"]') ||
  !!document.querySelector("#Work-Experience-section") ||
  !!document.querySelector('[aria-labelledby="Work-Experience-section"]');

/**
 * Application Questions (primary / secondary / generic questionnaire steps).
 * Matches "Application Questions 1 of 2", primaryQuestionnaire, etc.
 */
export const isWorkdayApplicationQuestionsPage = (): boolean => {
  if (
    document.querySelector(
      [
        '[data-automation-id="applyFlowPrimaryQuestionsPage"]',
        '[data-automation-id="applyFlowSecondaryQuestionsPage"]',
        '[data-automation-id="applyFlowQuestionnairePage"]',
        '[data-fkit-id*="primaryQuestionnaire"]',
        '[data-fkit-id*="secondaryQuestionnaire"]',
        '[aria-labelledby="primaryQuestionnaire-section"]',
        '[aria-labelledby="secondaryQuestionnaire-section"]',
      ].join(", "),
    )
  ) {
    return true;
  }

  const heading = document.querySelector(
    "h3.css-1ylcaf3, [data-automation-id='applyFlowPage'] h3",
  );
  if (heading && /application questions/i.test(heading.textContent ?? "")) {
    return true;
  }

  const activeStep = document.querySelector(
    '[data-automation-id="progressBarActiveStep"]',
  );
  if (
    activeStep &&
    /application questions/i.test(activeStep.textContent ?? "")
  ) {
    return true;
  }

  return false;
};

/** Resolve which Workday apply section is active (first match wins). */
export const getWorkdayApplySectionId = (): WorkdayApplySectionId => {
  if (isWorkdayApplicationQuestionsPage()) return "applicationQuestions";
  if (isWorkdayMyExperiencePage()) return "myExperience";
  if (isWorkdayMyInformationPage()) return "myInformation";
  return "other";
};
