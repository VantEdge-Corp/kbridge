import type { Client } from './client';
import { BUCKETS, publicUrl } from './storage';
import type {
  CandidateSignalRow,
  IntroductionRow,
  MemberPrivateRow,
  MessageRow,
  OwnProfileRow,
  PublicProfileRow,
} from './rows';
import type {
  ChildrenPlan,
  DegreeLevel,
  DrinkingHabit,
  Education,
  Employment,
  EmploymentStatus,
  ExerciseHabit,
  Industry,
  Lifestyle,
  OwnProfile,
  PrivateUserData,
  PublicProfile,
  RaceEthnicity,
  RaceEthnicityDisclosure,
  RecommendationSignals,
  RelationshipIntent,
  SmokingHabit,
  StudentStatus,
} from '../types/profile';
import type { VerificationData, VerificationDimension, VerificationState } from '../types/verification';
import { VERIFICATION_DIMENSIONS, VERIFICATION_STATES } from '../types/verification';
import type { IntroductionStatus, Message } from '../types/social';
import type { MultiPreference, PreferenceStrength, Preferences, RangePreference } from '../types/preferences';
import { MULTI_PREFERENCE_KEYS, PREFERENCE_STRENGTHS, RANGE_PREFERENCE_KEYS, defaultPreferences } from '../types/preferences';
import {
  CHILDREN_OPTIONS,
  DEGREE_LEVEL_OPTIONS,
  DRINKING_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  EXERCISE_OPTIONS,
  INDUSTRY_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  SMOKING_OPTIONS,
  STUDENT_STATUS_OPTIONS,
} from '../constants/taxonomies';

/* ---------- small validators ---------- */

function oneOf<T extends string>(value: unknown, allowed: ReadonlyArray<{ value: T }>): T | null {
  if (typeof value !== 'string') return null;
  return allowed.some((o) => o.value === value) ? (value as T) : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function verificationState(value: unknown): VerificationState {
  return typeof value === 'string' && (VERIFICATION_STATES as readonly string[]).includes(value)
    ? (value as VerificationState)
    : 'unverified';
}

export function toLifestyle(raw: unknown): Lifestyle {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    drinking: oneOf<DrinkingHabit>(o.drinking, DRINKING_OPTIONS),
    smoking: oneOf<SmokingHabit>(o.smoking, SMOKING_OPTIONS),
    exercise: oneOf<ExerciseHabit>(o.exercise, EXERCISE_OPTIONS),
    children: oneOf<ChildrenPlan>(o.children, CHILDREN_OPTIONS),
  };
}

export function photoUrls(client: Client, paths: string[] | null | undefined): string[] {
  return (paths ?? []).map((p) => publicUrl(client, BUCKETS.profilePhotos, p));
}

/* ---------- profiles ---------- */

function baseProfile(client: Client, row: Omit<PublicProfileRow, 'verified_badges'>): Omit<PublicProfile, 'publicVerificationBadges'> {
  const disclosure = (row.race_ethnicity_disclosure ?? 'not_provided') as RaceEthnicityDisclosure;
  const raceEthnicities =
    disclosure === 'disclosed'
      ? strings(row.race_ethnicities).filter((v): v is RaceEthnicity => RACE_ETHNICITY_OPTIONS.some((o) => o.value === v))
      : [];
  return {
    id: row.id,
    firstName: row.first_name,
    age: row.age,
    height: row.height_cm,
    photos: photoUrls(client, row.photo_paths),
    occupation: row.occupation ?? '',
    employmentDisplay: row.employment_display,
    educationDisplay: row.education_display,
    educationDegreeLevel: oneOf<DegreeLevel>(row.education_degree_level, DEGREE_LEVEL_OPTIONS),
    industry: oneOf<Industry>(row.industry, INDUSTRY_OPTIONS),
    studentStatus: oneOf<StudentStatus>(row.student_status, STUDENT_STATUS_OPTIONS),
    nationalities: strings(row.nationalities),
    raceEthnicities,
    raceEthnicityDisclosure: disclosure,
    languages: strings(row.languages),
    displayArea: row.display_area ?? 'Metro Atlanta',
    relationshipIntent: oneOf<RelationshipIntent>(row.relationship_intent, RELATIONSHIP_INTENT_OPTIONS),
    lifestyle: toLifestyle(row.lifestyle),
    interests: strings(row.interests),
    bio: row.bio ?? '',
  };
}

export function toPublicProfile(client: Client, row: PublicProfileRow): PublicProfile {
  const badges = strings(row.verified_badges).filter((b): b is VerificationDimension =>
    (VERIFICATION_DIMENSIONS as readonly string[]).includes(b),
  );
  return { ...baseProfile(client, row), publicVerificationBadges: badges };
}

export function toVerification(row: OwnProfileRow): VerificationData {
  return {
    identity: verificationState(row.verification_identity),
    education: verificationState(row.verification_education),
    student: verificationState(row.verification_student),
    employment: verificationState(row.verification_employment),
  };
}

export function toOwnProfile(client: Client, row: OwnProfileRow): OwnProfile {
  const verification = toVerification(row);
  const badges = VERIFICATION_DIMENSIONS.filter((d) => verification[d] === 'verified');
  return {
    ...baseProfile(client, row),
    publicVerificationBadges: badges,
    verification,
    isAdmin: !!row.is_admin,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
    suspended: !!row.suspended_at,
    photoPaths: row.photo_paths ?? [],
    termsVersion: row.terms_version,
    privacyVersion: row.privacy_version,
  };
}

/* ---------- private ---------- */

export function toEducation(row: MemberPrivateRow): Education {
  return {
    school: row.school ?? '',
    degreeLevel: oneOf<DegreeLevel>(row.degree_level, DEGREE_LEVEL_OPTIONS) ?? 'other',
    fieldOfStudy: row.field_of_study ?? '',
    graduationYear: row.graduation_year,
    currentlyEnrolled: !!row.currently_enrolled,
    publicDisplayEnabled: row.education_display_enabled !== false,
  };
}

export function toEmployment(row: MemberPrivateRow): Employment {
  return {
    occupation: row.occupation ?? '',
    employer: row.employer ?? '',
    employmentStatus: oneOf<EmploymentStatus>(row.employment_status, EMPLOYMENT_STATUS_OPTIONS) ?? 'other',
    publicEmployerDisplayEnabled: row.employer_display_enabled !== false,
  };
}

export function toPrivate(
  row: MemberPrivateRow,
  meta: { email: string; isAdmin: boolean; termsVersion: string | null; privacyVersion: string | null },
): PrivateUserData {
  return {
    id: row.user_id,
    email: meta.email,
    areaId: row.area_id,
    maxDistanceMiles: row.max_distance_miles,
    education: row.school || row.degree_level ? toEducation(row) : null,
    employment: row.occupation || row.employer ? toEmployment(row) : null,
    createdAt: row.created_at,
    isAdmin: meta.isAdmin,
    termsVersion: meta.termsVersion,
    privacyVersion: meta.privacyVersion,
  };
}

/* ---------- preferences ---------- */

function strength(value: unknown): PreferenceStrength | null {
  return typeof value === 'string' && (PREFERENCE_STRENGTHS as readonly string[]).includes(value)
    ? (value as PreferenceStrength)
    : null;
}

/** Parses stored JSON leniently: unknown or malformed dimensions fall back to defaults. */
export function toPreferences(raw: unknown): Preferences {
  const prefs = defaultPreferences();
  if (!raw || typeof raw !== 'object') return prefs;
  const o = raw as Record<string, unknown>;
  for (const key of RANGE_PREFERENCE_KEYS) {
    const v = o[key];
    if (!v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    const base: RangePreference = prefs[key];
    const min = typeof r.min === 'number' && Number.isFinite(r.min) ? r.min : base.min;
    const max = typeof r.max === 'number' && Number.isFinite(r.max) ? r.max : base.max;
    prefs[key] = {
      strength: strength(r.strength) ?? base.strength,
      min: Math.min(min, max),
      max: Math.max(min, max),
    };
  }
  for (const key of MULTI_PREFERENCE_KEYS) {
    const v = o[key];
    if (!v || typeof v !== 'object') continue;
    const m = v as Record<string, unknown>;
    const base = prefs[key] as MultiPreference;
    (prefs[key] as MultiPreference) = {
      strength: strength(m.strength) ?? base.strength,
      values: strings(m.values),
    };
  }
  return prefs;
}

/* ---------- signals ---------- */

export function toSignals(row: CandidateSignalRow): RecommendationSignals {
  const reverse = typeof row.reverse_compatibility === 'string' ? Number(row.reverse_compatibility) : row.reverse_compatibility;
  return {
    profileId: row.profile_id,
    distanceMiles: Number(row.distance_miles) || 0,
    demandBucket: Number(row.demand_bucket) || 0,
    exposureBucket: Number(row.exposure_bucket) || 0,
    lastActiveAt: row.last_active_day,
    createdAt: row.created_day,
    reverseCompatibility: Number.isFinite(reverse) ? reverse : 0.5,
    reverseEligible: row.reverse_eligible !== false,
  };
}

/* ---------- social ---------- */

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export function introductionStatus(value: string): IntroductionStatus {
  return value === 'accepted' || value === 'declined' || value === 'withdrawn' ? value : 'pending';
}

export function counterpartId(row: IntroductionRow, viewerId: string): string {
  return row.requester_id === viewerId ? row.recipient_id : row.requester_id;
}
