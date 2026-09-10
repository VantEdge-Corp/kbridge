import type {
  ChildrenPlan,
  DegreeLevel,
  DrinkingHabit,
  EmploymentStatus,
  ExerciseHabit,
  Industry,
  RaceEthnicity,
  RelationshipIntent,
  SmokingHabit,
  StudentStatus,
} from '../types/profile';

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

/**
 * Race / ethnicity: an illustrative broad taxonomy for the prototype. Multiple
 * selections are allowed. "Prefer not to say" is deliberately NOT in this list;
 * it is a disclosure state (see RaceEthnicityDisclosure) and never a category.
 */
export const RACE_ETHNICITY_OPTIONS: ReadonlyArray<Option<RaceEthnicity>> = [
  { value: 'east_asian', label: 'East Asian' },
  { value: 'southeast_asian', label: 'Southeast Asian' },
  { value: 'south_asian', label: 'South Asian' },
  { value: 'black_african_descent', label: 'Black / African descent' },
  { value: 'white', label: 'White' },
  { value: 'hispanic_latino', label: 'Hispanic / Latino' },
  { value: 'middle_eastern_north_african', label: 'Middle Eastern / North African' },
  { value: 'native_indigenous', label: 'Native / Indigenous' },
  { value: 'pacific_islander', label: 'Pacific Islander' },
  { value: 'mixed_multiracial', label: 'Mixed / Multiracial' },
  { value: 'other', label: 'Other' },
];

export const DEGREE_LEVEL_OPTIONS: ReadonlyArray<Option<DegreeLevel>> = [
  { value: 'high_school', label: 'High school' },
  { value: 'associate', label: 'Associate' },
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'professional', label: 'Professional (JD, MD, etc.)' },
  { value: 'other', label: 'Other' },
];

/** Short degree label used in the public education line, e.g. "Master's, Analytics". */
export const DEGREE_SHORT_LABEL: Record<DegreeLevel, string> = {
  high_school: 'High school',
  associate: "Associate's",
  bachelor: "Bachelor's",
  master: "Master's",
  doctorate: 'Doctorate',
  professional: 'Professional degree',
  other: '',
};

export const EMPLOYMENT_STATUS_OPTIONS: ReadonlyArray<Option<EmploymentStatus>> = [
  { value: 'student', label: 'Student' },
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'between_roles', label: 'Between roles' },
  { value: 'other', label: 'Other' },
];

export const STUDENT_STATUS_OPTIONS: ReadonlyArray<Option<StudentStatus>> = [
  { value: 'undergraduate', label: 'Undergraduate student' },
  { value: 'graduate', label: 'Graduate student' },
  { value: 'professional', label: 'Working professional' },
];

export const RELATIONSHIP_INTENT_OPTIONS: ReadonlyArray<Option<RelationshipIntent>> = [
  { value: 'long_term', label: 'Long-term relationship' },
  { value: 'marriage_minded', label: 'Marriage-minded' },
  { value: 'intentional_dating', label: 'Intentional dating' },
  { value: 'open_to_possibilities', label: 'Open to possibilities' },
];

export const DRINKING_OPTIONS: ReadonlyArray<Option<DrinkingHabit>> = [
  { value: 'never', label: 'Never' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const SMOKING_OPTIONS: ReadonlyArray<Option<SmokingHabit>> = [
  { value: 'never', label: 'Never' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const EXERCISE_OPTIONS: ReadonlyArray<Option<ExerciseHabit>> = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'daily', label: 'Daily' },
];

export const CHILDREN_OPTIONS: ReadonlyArray<Option<ChildrenPlan>> = [
  { value: 'has_children', label: 'Has children' },
  { value: 'wants_children', label: 'Wants children' },
  { value: 'does_not_want', label: "Doesn't want children" },
  { value: 'open', label: 'Open either way' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const INDUSTRY_OPTIONS: ReadonlyArray<Option<Industry>> = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'law', label: 'Law' },
  { value: 'medicine_health', label: 'Medicine & health' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education_research', label: 'Education & research' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'design_creative', label: 'Design & creative' },
  { value: 'media_communications', label: 'Media & communications' },
  { value: 'government_public_service', label: 'Government & public service' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'real_estate', label: 'Real estate' },
  { value: 'architecture_construction', label: 'Architecture & construction' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'arts_entertainment', label: 'Arts & entertainment' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'logistics_operations', label: 'Logistics & operations' },
  { value: 'sales_marketing', label: 'Sales & marketing' },
  { value: 'aviation', label: 'Aviation' },
  { value: 'military', label: 'Military' },
  { value: 'other', label: 'Other' },
];

/** Language codes (BCP 47 primary subtags) with English names. */
export const LANGUAGE_OPTIONS: ReadonlyArray<Option> = [
  { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' },
  { value: 'pt', label: 'Portuguese' }, { value: 'de', label: 'German' }, { value: 'it', label: 'Italian' },
  { value: 'ko', label: 'Korean' }, { value: 'zh', label: 'Mandarin' }, { value: 'yue', label: 'Cantonese' },
  { value: 'ja', label: 'Japanese' }, { value: 'vi', label: 'Vietnamese' }, { value: 'tl', label: 'Tagalog' },
  { value: 'th', label: 'Thai' }, { value: 'hi', label: 'Hindi' }, { value: 'ur', label: 'Urdu' },
  { value: 'bn', label: 'Bengali' }, { value: 'pa', label: 'Punjabi' }, { value: 'gu', label: 'Gujarati' },
  { value: 'ta', label: 'Tamil' }, { value: 'te', label: 'Telugu' }, { value: 'ar', label: 'Arabic' },
  { value: 'fa', label: 'Persian' }, { value: 'tr', label: 'Turkish' }, { value: 'he', label: 'Hebrew' },
  { value: 'ru', label: 'Russian' }, { value: 'uk', label: 'Ukrainian' }, { value: 'pl', label: 'Polish' },
  { value: 'nl', label: 'Dutch' }, { value: 'sv', label: 'Swedish' }, { value: 'el', label: 'Greek' },
  { value: 'am', label: 'Amharic' }, { value: 'sw', label: 'Swahili' }, { value: 'yo', label: 'Yoruba' },
  { value: 'ig', label: 'Igbo' }, { value: 'ha', label: 'Hausa' }, { value: 'ht', label: 'Haitian Creole' },
  { value: 'asl', label: 'American Sign Language' },
];

export const INTERESTS: readonly string[] = [
  'Running', 'Tennis', 'Golf', 'Pickleball', 'Hiking', 'Cycling', 'Climbing', 'Yoga', 'Pilates',
  'Cooking', 'Wine', 'Coffee', 'Farmers markets', 'Restaurants', 'Baking',
  'Reading', 'Writing', 'Podcasts', 'Chess', 'Board games',
  'Live music', 'Jazz', 'Theater', 'Museums', 'Film', 'Photography', 'Art', 'Architecture', 'Design',
  'Travel', 'Languages', 'Volunteering', 'Faith', 'Mentoring',
  'Startups', 'Investing', 'Real estate',
  'Soccer', 'Basketball', 'Football', 'Baseball', 'Braves games', 'BeltLine walks',
  'Dogs', 'Cats', 'Gardening', 'Sailing', 'Skiing',
];

export const HEIGHT_CM = { min: 140, max: 215 } as const;
export const AGE = { min: 18, max: 99 } as const;

export function labelFor<T extends string>(options: ReadonlyArray<Option<T>>, value: T | null | undefined): string {
  if (value == null) return '';
  return options.find((o) => o.value === value)?.label ?? value;
}
