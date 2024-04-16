export interface Applicant {
  address?: string;
  city?: string;
  citizenship_status?: string | null;
  country?: string;
  covid_vaccination_status?: boolean | null;

  dob?: string | null;
  disability_status?: string | null;

  email_address?: string;
  employment_history?: [] | null;
  education?: [] | null | undefined | any;

  first_name?: string;
  full_name?: string;
  gpa?: string | number | null;
  gender?: string | null;
  is_over_18?: boolean | null;

  last_name?: string;
  linkedin_url?: string;
  languages?: string | null;
  pdf_url?: string;
  phone_number?: string;
  professional_summary?: string | null;
  phone_type?: string | number | null;

  race?: string | null;
  state?: string | undefined;
  salary?: string | number | null;

  terms_and_condation?: boolean | null;
  us_work_authoriztaion?: boolean | null;
  veteran_status?: boolean | null;
  zip_code?: number | null;
}
