import {
  CHILDREN_OPTIONS,
  EXERCISE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  countryName,
  formatHeight,
  labelFor,
  type PublicProfile,
} from '@peaches/core';
import type { Vital } from '@/components/ProfileBlocks';

/**
 * Profile facts as short, self-describing phrases, so an icon and a value
 * can stand on their own without a label column.
 */
const DRINKING: Record<string, string> = { never: "Doesn't drink", socially: 'Drinks socially', regularly: 'Drinks regularly' };
const SMOKING: Record<string, string> = { never: "Doesn't smoke", socially: 'Smokes socially', regularly: 'Smokes' };
const EXERCISE: Record<string, string> = { rarely: 'Rarely exercises', sometimes: 'Exercises sometimes', often: 'Exercises often', daily: 'Exercises daily' };
const CHILDREN: Record<string, string> = { open: 'Open either way on children' };

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/** Height, area, intent, children, drinking, smoking, exercise: whatever is present, in that order. */
export function vitalsFor(p: PublicProfile): Vital[] {
  const { drinking, smoking, exercise, children } = p.lifestyle;
  const items: Array<Vital | null> = [
    p.height ? { icon: 'arrow-up', label: 'Height', value: formatHeight(p.height) } : null,
    p.displayArea ? { icon: 'map-pin', label: 'Area', value: p.displayArea } : null,
    p.relationshipIntent ? { icon: 'compass', label: 'Looking for', value: labelFor(RELATIONSHIP_INTENT_OPTIONS, p.relationshipIntent) } : null,
    children && children !== 'prefer_not_to_say' ? { icon: 'users', label: 'Children', value: CHILDREN[children] ?? labelFor(CHILDREN_OPTIONS, children) } : null,
    drinking && drinking !== 'prefer_not_to_say' ? { icon: 'coffee', label: 'Drinking', value: DRINKING[drinking] ?? drinking } : null,
    smoking && smoking !== 'prefer_not_to_say' ? { icon: 'wind', label: 'Smoking', value: SMOKING[smoking] ?? smoking } : null,
    exercise ? { icon: 'activity', label: 'Exercise', value: EXERCISE[exercise] ?? labelFor(EXERCISE_OPTIONS, exercise) } : null,
  ];
  return items.filter((v): v is Vital => v !== null);
}

export interface Detail {
  icon: Vital['icon'];
  label: string;
  value: string;
}

/** Work, education, field and standing, nationality, languages, ethnicity when disclosed. */
export function detailsFor(p: PublicProfile): Detail[] {
  const field = [p.industry ? labelFor(INDUSTRY_OPTIONS, p.industry) : '', p.studentStatus ? labelFor(STUDENT_STATUS_OPTIONS, p.studentStatus) : '']
    .filter(Boolean)
    .join(' · ');
  const nationalities = p.nationalities.map(countryName).filter(Boolean);
  const languages = p.languages.map((l) => labelFor(LANGUAGE_OPTIONS, l)).filter(Boolean);
  const ethnicities = p.raceEthnicityDisclosure === 'disclosed' ? p.raceEthnicities.map((r) => labelFor(RACE_ETHNICITY_OPTIONS, r)).filter(Boolean) : [];
  const items: Array<Detail | null> = [
    p.employmentDisplay || p.occupation ? { icon: 'briefcase', label: 'Work', value: p.employmentDisplay || p.occupation } : null,
    p.educationDisplay ? { icon: 'book-open', label: 'Education', value: p.educationDisplay } : null,
    field ? { icon: 'tag', label: 'Field', value: field } : null,
    nationalities.length > 0 ? { icon: 'flag', label: 'Nationality', value: `From ${joinList(nationalities)}` } : null,
    languages.length > 0 ? { icon: 'globe', label: 'Languages', value: `Speaks ${joinList(languages)}` } : null,
    ethnicities.length > 0 ? { icon: 'user', label: 'Ethnicity', value: joinList(ethnicities) } : null,
  ];
  return items.filter((v): v is Detail => v !== null);
}

/** "Product designer · Midtown Atlanta" under the name. */
export function metaLineFor(p: PublicProfile): string {
  return [p.occupation || p.employmentDisplay || '', p.displayArea].filter(Boolean).join(' · ');
}
