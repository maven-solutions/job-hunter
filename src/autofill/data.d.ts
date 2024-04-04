export interface Applicant {
  address?: string;
  city?: string;
  country?: string;
  email_address?: string;
  first_name?: string;
  full_name?: string;
  last_name?: string;
  linkedin_url?: string;
  pdf_url?: string;
  phone_number?: string;
  state?: string | undefined;
  zip_code?: number | null;
  education?: [] | null | undefined | any;
  employment_history?: [] | null;
  professional_summary?: string | null;
}
