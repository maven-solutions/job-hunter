/**
 * Workday apply-flow section registry.
 * Order: more specific questionnaire pages before general experience/info.
 */
import { applicationQuestionsSection } from "./applicationQuestions";
import { WorkdayApplySection } from "./types";
import {
  getWorkdayApplySectionId,
  isWorkdayApplicationQuestionsPage,
  isWorkdayMyExperiencePage,
  isWorkdayMyInformationPage,
} from "../detect";

export const WORKDAY_APPLY_SECTIONS: WorkdayApplySection[] = [
  applicationQuestionsSection,
  // My Experience / My Information still routed inside scan.workday for shared helpers
];

export const getMatchingWorkdaySection = (): WorkdayApplySection | null =>
  WORKDAY_APPLY_SECTIONS.find((s) => s.matches()) ?? null;

export {
  getWorkdayApplySectionId,
  isWorkdayApplicationQuestionsPage,
  isWorkdayMyExperiencePage,
  isWorkdayMyInformationPage,
};
