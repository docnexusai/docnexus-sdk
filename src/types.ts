/**
 * DocNexus API types (v5).
 * Use with Kong API key (apikey header) or Bearer JWT.
 */

export interface SearchParams {
  first_name: string;
  last_name: string;
  specialty?: string | null;
  country?: string | null;
  other_info?: Record<string, unknown> | null;
  is_refresh_data?: boolean;
}

export interface DocnexusResult {
  id: string;
  profile_photo?: string | null;
  emails?: string[] | null;
  url?: string | null;
  country?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  conditions?: string[] | null;
  specialties?: string[] | null;
  confidence_score?: number;
}

export interface SearchResponse {
  title?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  biography?: string | null;
  research_areas?: string[] | null;
  timestamp?: string | null;
  docnexus_results: DocnexusResult[];
  international_tag?: boolean;
  profile_photo?: string | null;
}

export interface USProfileResponse {
  clinical_trials: unknown[];
  publications: unknown[];
  payments: unknown[];
  diagnosis: unknown[];
  prescriptions: unknown[];
  procedures: unknown[];
  conferences: unknown[];
  referrers: unknown[];
  diagnosis_referrals: unknown[];
  procedure_referrals: unknown[];
  affiliations: unknown[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
