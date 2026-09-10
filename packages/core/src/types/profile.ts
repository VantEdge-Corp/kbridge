import type { VerificationData, VerificationDimension } from './verification';

/* ---------- Structured background ---------- */

export type DegreeLevel =
  | 'high_school'
  | 'associate'
  | 'bachelor'
  | 'master'
  | 'doctorate'
  | 'professional'
  | 'other';

export interface Education {
  school: string;
  degreeLevel: DegreeLevel;
  fieldOfStudy: string;
  graduationYear: number | null;
  currentlyEnrolled: boolean;
  publicDisplayEnabled: boolean;
}

export type EmploymentStatus = 'student' | 'employed' | 'self_employed' | 'between_roles' | 'other';

export interface Employment {
  occupation: string;
  employer: string;
  employmentStatus: EmploymentStatus;
  publicEmployerDisplayEnabled: boolean;
}

/** Student / professional standing, shown publicly and filterable. */
export type StudentStatus = 'undergraduate' | 'graduate' | 'professional';

export type RelationshipIntent =
  | 'long_term'
  | 'marriage_minded'
  | 'intentional_dating'
  | 'open_to_possibilities';

export type DrinkingHabit = 'never' | 'socially' | 'regularly' | 'prefer_not_to_say';
export type SmokingHabit = 'never' | 'socially' | 'regularly' | 'prefer_not_to_say';
export type ExerciseHabit = 'rarely' | 'sometimes' | 'often' | 'daily';
export type ChildrenPlan = 'has_children' | 'wants_children' | 'does_not_want' | 'open' | 'prefer_not_to_say';

export interface Lifestyle {
  drinking: DrinkingHabit | null;
  smoking: SmokingHabit | null;
  exercise: ExerciseHabit | null;
  children: ChildrenPlan | null;
}

/**
 * Race/ethnicity disclosure is a separate signal from the values themselves so that
 * "Prefer not to say" is never treated as a category. A profile with
 * `raceEthnicityDisclosure === 'prefer_not_to_say'` has an empty `raceEthnicities`
 * array and never participates in race/ethnicity matching.
 */
export type RaceEthnicityDisclosure = 'disclosed' | 'prefer_not_to_say' | 'not_provided';

export type RaceEthnicity =
  | 'east_asian'
  | 'southeast_asian'
  | 'south_asian'
  | 'black_african_descent'
  | 'white'
  | 'hispanic_latino'
  | 'middle_eastern_north_african'
  | 'native_indigenous'
  | 'pacific_islander'
  | 'mixed_multiracial'
  | 'other';

/* ---------- Public profile ---------- */

/**
 * Everything on this object may be shown to another signed-in member.
 * Nothing private (email, precise location, signals, moderation) is ever mapped here.
 */
export interface PublicProfile {
  id: string;
  firstName: string;
  age: number | null;
  /** Height in centimetres. Displayed in feet/inches in the US. */
  height: number | null;
  /** Fully qualified photo URLs, first is the primary portrait. */
  photos: string[];
  occupation: string;
  /** Occupation, plus the employer only when the member enabled employer display. */
  employmentDisplay: string | null;
  /** School and degree, only when the member enabled education display. */
  educationDisplay: string | null;
  /** Degree level, only when the member enabled education display. Used by the Education filter. */
  educationDegreeLevel: DegreeLevel | null;
  /** Field of work, used by the Occupation filter. */
  industry: Industry | null;
  studentStatus: StudentStatus | null;
  /** ISO 3166-1 alpha-2 country codes, user-provided, multiple allowed. */
  nationalities: string[];
  raceEthnicities: RaceEthnicity[];
  raceEthnicityDisclosure: RaceEthnicityDisclosure;
  /** Language codes from the LANGUAGES taxonomy, multiple allowed. */
  languages: string[];
  /** Coarse public area label, e.g. "Duluth area". Never an address or coordinates. */
  displayArea: string;
  relationshipIntent: RelationshipIntent | null;
  lifestyle: Lifestyle;
  interests: string[];
  bio: string;
  publicVerificationBadges: VerificationDimension[];
}

export type Industry =
  | 'technology'
  | 'finance'
  | 'law'
  | 'medicine_health'
  | 'consulting'
  | 'education_research'
  | 'engineering'
  | 'design_creative'
  | 'media_communications'
  | 'government_public_service'
  | 'nonprofit'
  | 'real_estate'
  | 'architecture_construction'
  | 'entrepreneurship'
  | 'sciences'
  | 'arts_entertainment'
  | 'hospitality'
  | 'logistics_operations'
  | 'sales_marketing'
  | 'aviation'
  | 'military'
  | 'other';

/** The signed-in member's own profile: public fields plus what only they may see. */
export interface OwnProfile extends PublicProfile {
  verification: VerificationData;
  isAdmin: boolean;
  createdAt: string;
  lastActiveAt: string;
  suspended: boolean;
  /** Storage paths behind `photos`, needed to remove a photo. */
  photoPaths: string[];
  termsVersion: string | null;
  privacyVersion: string | null;
}

/* ---------- Private data (owner only) ---------- */

/**
 * Only the owner can read this. It lives in `member_private` and
 * `member_preferences` behind owner-only row-level security; the client
 * never receives another member's PrivateUserData.
 */
export interface PrivateUserData {
  id: string;
  email: string;
  /** Private location: the area the member actually lives in. Never shown to others. */
  areaId: string | null;
  /** Hard search boundary in miles, measured from the private area. */
  maxDistanceMiles: number;
  education: Education | null;
  employment: Employment | null;
  createdAt: string;
  isAdmin: boolean;
  termsVersion: string | null;
  privacyVersion: string | null;
}

/* ---------- Signals (server-owned, coarse copies reach the client) ---------- */

/**
 * Coarse recommendation inputs for one candidate, produced server-side by
 * `get_discovery_candidates`. The raw counters and the other member's
 * preferences never leave the database. A naming convention is not a
 * security boundary, so nothing here is precise: distance is whole miles,
 * counters are bucketed, activity is truncated to the day, and the reverse
 * compatibility is a rounded 0..1 number computed from the candidate's
 * private preferences against the viewer's public profile.
 */
export interface RecommendationSignals {
  profileId: string;
  /** Whole miles between the two members' private areas. */
  distanceMiles: number;
  /** Bucketed count of introduction requests received recently. Internal only. */
  demandBucket: number;
  /** Bucketed count of recent impressions. Internal only. */
  exposureBucket: number;
  /** ISO timestamp truncated to the day. */
  lastActiveAt: string;
  createdAt: string;
  /** compatibility(candidate, viewer), 0..1 rounded to two decimals, computed server-side. */
  reverseCompatibility: number;
  /** Whether the viewer passes the candidate's required preferences. */
  reverseEligible: boolean;
}

/* ---------- Moderation (server-owned) ---------- */

export type ModerationStatus = 'active' | 'suspended';

export interface ModerationData {
  profileId: string;
  status: ModerationStatus;
  suspendedAt: string | null;
  openReports: number;
}
