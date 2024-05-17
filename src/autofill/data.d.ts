export interface Education {
  id: string;
  school: string;
  major?: string;
  degree?: string;
  gpa?: string;
  startDate?: string;
  endDate?: string;
}

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
  education?: Education[];

  first_name?: string;
  full_name?: string;
  gpa?: string | number | null;
  gender?: string | null;
  github_url?: string | null;
  is_over_18?: boolean | null;

  last_name?: string;
  linkedin_url?: string;
  language?: string | null;
  pdf_url?: string;
  phone_number?: string;
  professional_summary?: string | null;
  phone_type?: string | number | null;
  portfolio_url?: string | null;

  race?: string | null;
  resume_title?: string | null;

  state?: string | undefined;
  salary?: string | number | null;

  terms_and_condation?: boolean | null;
  us_work_authoriztaion?: boolean | null;
  veteran_status?: number | null;
  zip_code?: number | null;
}
