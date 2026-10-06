import {
  CHILDREN_OPTIONS,
  EXERCISE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  labelFor,
} from './constants/taxonomies';
import { countryName } from './constants/countries';
import { formatHeight } from './format';
import type { PublicProfile } from './types';

/**
 * What a fact is about. Each app maps a kind to its icon (the same Lucide
 * glyph on web and phone), so the value can stand on its own without a
 * label column.
 */
export type ProfileFactKind =
  | 'height'
  | 'area'
  | 'intent'
  | 'children'
  | 'drinking'
  | 'smoking'
  | 'exercise'
  | 'work'
  | 'education'
  | 'field'
  | 'nationality'
  | 'languages'
  | 'ethnicity';

export interface ProfileFact {
  kind: ProfileFactKind;
  /** Spoken name for the value, e.g. "Height". Never drawn. */
  label: string;
  /** A short, self-describing phrase, e.g. "Drinks socially". */
  value: string;
}

const DRINKING: Record<string, string> = { never: "Doesn't drink", socially: 'Drinks socially', regularly: 'Drinks regularly' };
const SMOKING: Record<string, string> = { never: "Doesn't smoke", socially: 'Smokes socially', regularly: 'Smokes' };
const EXERCISE: Record<string, string> = { rarely: 'Rarely exercises', sometimes: 'Exercises sometimes', often: 'Exercises often', daily: 'Exercises daily' };
const CHILDREN: Record<string, string> = { open: 'Open either way on children' };

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function present<T>(items: Array<T | null>): T[] {
  return items.filter((item): item is T => item !== null);
}

/** Height, area, intent, children, drinking, smoking, exercise: whatever is present, in that order. */
export function profileVitals(p: PublicProfile): ProfileFact[] {
  const { drinking, smoking, exercise, children } = p.lifestyle;
  return present<ProfileFact>([
    p.height ? { kind: 'height', label: 'Height', value: formatHeight(p.height) } : null,
    p.displayArea ? { kind: 'area', label: 'Area', value: p.displayArea } : null,
    p.relationshipIntent ? { kind: 'intent', label: 'Looking for', value: labelFor(RELATIONSHIP_INTENT_OPTIONS, p.relationshipIntent) } : null,
    children && children !== 'prefer_not_to_say' ? { kind: 'children', label: 'Children', value: CHILDREN[children] ?? labelFor(CHILDREN_OPTIONS, children) } : null,
    drinking && drinking !== 'prefer_not_to_say' ? { kind: 'drinking', label: 'Drinking', value: DRINKING[drinking] ?? drinking } : null,
    smoking && smoking !== 'prefer_not_to_say' ? { kind: 'smoking', label: 'Smoking', value: SMOKING[smoking] ?? smoking } : null,
    exercise ? { kind: 'exercise', label: 'Exercise', value: EXERCISE[exercise] ?? labelFor(EXERCISE_OPTIONS, exercise) } : null,
  ]);
}

/** Work, education, field and standing, nationality, languages, ethnicity when disclosed. */
export function profileDetails(p: PublicProfile): ProfileFact[] {
  const field = [p.industry ? labelFor(INDUSTRY_OPTIONS, p.industry) : '', p.studentStatus ? labelFor(STUDENT_STATUS_OPTIONS, p.studentStatus) : ''].filter(Boolean).join(' · ');
  const nationalities = p.nationalities.map(countryName).filter(Boolean);
  const languages = p.languages.map((l) => labelFor(LANGUAGE_OPTIONS, l)).filter(Boolean);
  const ethnicities = p.raceEthnicityDisclosure === 'disclosed' ? p.raceEthnicities.map((r) => labelFor(RACE_ETHNICITY_OPTIONS, r)).filter(Boolean) : [];
  return present<ProfileFact>([
    p.employmentDisplay || p.occupation ? { kind: 'work', label: 'Work', value: p.employmentDisplay || p.occupation } : null,
    p.educationDisplay ? { kind: 'education', label: 'Education', value: p.educationDisplay } : null,
    field ? { kind: 'field', label: 'Field', value: field } : null,
    nationalities.length > 0 ? { kind: 'nationality', label: 'Nationality', value: `From ${joinList(nationalities)}` } : null,
    languages.length > 0 ? { kind: 'languages', label: 'Languages', value: `Speaks ${joinList(languages)}` } : null,
    ethnicities.length > 0 ? { kind: 'ethnicity', label: 'Ethnicity', value: joinList(ethnicities) } : null,
  ]);
}

/** "Product designer · Midtown Atlanta" under a name. */
export function profileMetaLine(p: PublicProfile): string {
  return [p.occupation || p.employmentDisplay || '', p.displayArea].filter(Boolean).join(' · ');
}
