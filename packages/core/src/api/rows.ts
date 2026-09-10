/** Database row shapes as returned by PostgREST. Keep in sync with supabase/migrations. */

export const PUBLIC_PROFILE_COLUMNS =
  'id, first_name, age, height_cm, photo_paths, occupation, employment_display, education_display, ' +
  'education_degree_level, industry, student_status, nationalities, race_ethnicities, ' +
  'race_ethnicity_disclosure, languages, display_area, relationship_intent, lifestyle, interests, bio, ' +
  'verified_badges';

export interface PublicProfileRow {
  id: string;
  first_name: string;
  age: number | null;
  height_cm: number | null;
  photo_paths: string[] | null;
  occupation: string | null;
  employment_display: string | null;
  education_display: string | null;
  education_degree_level: string | null;
  industry: string | null;
  student_status: string | null;
  nationalities: string[] | null;
  race_ethnicities: string[] | null;
  race_ethnicity_disclosure: string | null;
  languages: string[] | null;
  display_area: string | null;
  relationship_intent: string | null;
  lifestyle: Record<string, unknown> | null;
  interests: string[] | null;
  bio: string | null;
  verified_badges: string[] | null;
}

export const OWN_PROFILE_COLUMNS =
  'id, first_name, age, height_cm, photo_paths, occupation, employment_display, education_display, ' +
  'education_degree_level, industry, student_status, nationalities, race_ethnicities, ' +
  'race_ethnicity_disclosure, languages, display_area, relationship_intent, lifestyle, interests, bio, ' +
  'is_admin, created_at, last_active_at, suspended_at, onboarding_complete, terms_version, privacy_version, ' +
  'verification_identity, verification_education, verification_student, verification_employment';

export interface OwnProfileRow extends Omit<PublicProfileRow, 'verified_badges'> {
  is_admin: boolean;
  created_at: string;
  last_active_at: string;
  suspended_at: string | null;
  onboarding_complete: boolean;
  terms_version: string | null;
  privacy_version: string | null;
  verification_identity: string;
  verification_education: string;
  verification_student: string;
  verification_employment: string;
}

export interface MemberPrivateRow {
  user_id: string;
  area_id: string | null;
  max_distance_miles: number;
  school: string;
  degree_level: string | null;
  field_of_study: string;
  graduation_year: number | null;
  currently_enrolled: boolean;
  education_display_enabled: boolean;
  occupation: string;
  employer: string;
  employment_status: string | null;
  employer_display_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreferencesRow {
  user_id: string;
  prefs: unknown;
}

export interface CandidateSignalRow {
  profile_id: string;
  distance_miles: number;
  demand_bucket: number;
  exposure_bucket: number;
  last_active_day: string;
  created_day: string;
  reverse_compatibility: number | string;
  reverse_eligible: boolean;
}

export interface IntroductionRow {
  id: string;
  requester_id: string;
  recipient_id: string;
  note: string;
  status: string;
  match_id: string | null;
  created_at: string;
  responded_at: string | null;
  post_id: string | null;
}

export interface MatchRow {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface PostRow {
  id: string;
  author_id: string;
  body: string;
  photo_path: string | null;
  created_at: string;
}

export interface PostCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface ApplicationDbRow {
  id: string;
  email: string;
  status: string;
  first_name: string;
  age: number | null;
  city: string | null;
  area_id: string | null;
  occupation: string | null;
  profession: string | null;
  company: string | null;
  years_experience: number | null;
  linkedin_url: string | null;
  link: string | null;
  school: string | null;
  degree: string | null;
  bio: string | null;
  why: string | null;
  internal_note: string | null;
  score: number | string | null;
  created_at: string;
  decided_at: string | null;
  claimed_by: string | null;
  age_confirmed: boolean | null;
  terms_version: string | null;
  privacy_version: string | null;
  consented_at: string | null;
}

export interface ReportRow {
  id: string;
  reporter_id: string | null;
  reported_id: string;
  reason: string;
  detail: string | null;
  match_id: string | null;
  post_id: string | null;
  status: string;
  created_at: string;
}

export interface AdminMemberRow extends OwnProfileRow {
  member_number: string | null;
}
