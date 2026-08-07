import { Applicant } from "../../../data";
import { AiNestedFieldSchema } from "../../types";

/** Payload element for Workday scan (same shape as shared API). */
export interface WorkdayScanElement {
  label: string;
  required: boolean;
  type: string;
  options?: string[] | AiNestedFieldSchema[];
  description?: string;
  count?: number;
}

export interface WorkdaySectionScanOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
  applicantData?: Applicant | null;
}

/**
 * One Workday apply-flow section (My Information, My Experience, Application Questions, …).
 * Keep each section self-contained so changes stay isolated.
 */
export interface WorkdayApplySection {
  id: string;
  /** Whether this section owns the current DOM page. */
  matches: () => boolean;
  /** Optional prep before scan (country, expand panels, etc.). */
  prepareBeforeScan?: (applicantData: Applicant) => Promise<void>;
  /** Build API elements for this page only. */
  buildScanElements: (
    options?: WorkdaySectionScanOptions,
  ) => Promise<WorkdayScanElement[]>;
}
