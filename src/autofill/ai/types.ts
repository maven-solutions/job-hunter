import { Applicant } from "../data";

/** Base types used by Greenhouse / most sites; Workday also uses nested group types. */
export type AiFormElementType =
  | "text"
  | "search"
  | "employment"
  | "education"
  | "multi-select"
  | "listbox"
  | "date"
  | "checkbox";

/** Nested field schema inside employment / education group elements. */
export interface AiNestedFieldSchema {
  type: string;
  label: string;
  description?: string;
  options?: string[] | AiNestedFieldSchema[];
  required?: boolean;
}

export interface AiFormElement {
  label: string;
  required: boolean;
  /** API type — keep string so new ATS types don't break older callers. */
  type: string;
  /** String options (select/search) or nested field schemas (employment/education). */
  options?: string[] | AiNestedFieldSchema[];
  description?: string;
  /** Hint for how many repeatable entries the applicant has (Workday). */
  count?: number;
}

/** Options for building the scan → API payload (shared across sites). */
export interface AiScanPayloadOptions {
  token?: string;
  resumeId?: string;
  userId?: string;
  fromAgent?: boolean;
  parser?: string;
  /** Passed through when the site needs applicant profile for nested groups. */
  applicantData?: Applicant | null;
}

/** Payload shape sent to getJobApplicationFillWithAi. */
export interface AiScanPayload {
  elements: AiFormElement[];
  token: string;
  url: string;
  parser: string;
  source: string;
  fromAgent: boolean;
  resumeId: string;
  userId: string;
}

export interface AiFillResult {
  total?: number;
  filled: number;
  failed?: number;
  skipped?: number;
}

/**
 * Callback used by per-field icons to request one AI answer for a single element.
 * Implemented by the shared scan pipeline (dispatch → job-application-fill).
 */
export type RequestFieldAnswerFn = (
  element: AiFormElement,
) => Promise<string | null>;

export interface AiFieldScannerOptions {
  /** When set, field icon clicks call the real AI fill API for that one field. */
  requestFieldAnswer?: RequestFieldAnswerFn;
}

/**
 * Domain-specific AI autofill handler.
 * Add one implementation per ATS / career site (Greenhouse, Lever, Ashby, …).
 *
 * Shared UI flow (button + phases + API call) lives outside handlers;
 * only DOM scan / fill / optional field icons differ per site.
 */
export interface AiSiteHandler {
  /** Stable id used as API `source` and logs (e.g. "greenhouse"). */
  id: string;
  /** Whether Autofill with AI should run on this URL. */
  matches: (url?: string) => boolean;
  /**
   * Optional field icon scanner (Grammarly-style markers).
   * Returns how many fields were marked. Greenhouse-only for now.
   */
  initFieldScanner?: (
    applicantData: Applicant,
    options?: AiFieldScannerOptions,
  ) => number;
  /**
   * Optional prep before DOM scan (e.g. Workday: set Country from applicant,
   * wait for layout to settle; expand Work Experience / Education panels).
   */
  prepareBeforeScan?: (applicantData: Applicant) => Promise<void>;
  /** Read the page form and build the AI fill API payload. */
  buildScanPayload: (options: AiScanPayloadOptions) => Promise<AiScanPayload>;
  /**
   * Apply AI fill answers to the form (and site-specific extras like resume upload).
   * `fillData` is typically `fillResponse.data.fill_data_list`.
   */
  applyFill: (
    fillData: unknown,
    applicantData: Applicant,
  ) => Promise<AiFillResult>;
}
