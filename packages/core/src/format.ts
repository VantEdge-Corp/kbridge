import { DEGREE_SHORT_LABEL } from './constants/taxonomies';
import type { DegreeLevel } from './types/profile';

/** 180 -> 5'11" */
export function formatHeight(cm: number | null | undefined): string {
  if (cm == null) return '';
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

export function cmFromFeetInches(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function initials(firstName: string): string {
  return firstName.trim().charAt(0).toUpperCase();
}

/** "Georgia Institute of Technology · Master's, Analytics". Mirrored by the SQL trigger in migration 013. */
export function educationDisplay(school: string, degreeLevel: DegreeLevel | null, fieldOfStudy: string): string {
  const parts: string[] = [];
  if (school.trim()) parts.push(school.trim());
  const degree = degreeLevel ? DEGREE_SHORT_LABEL[degreeLevel] : '';
  const tail = [degree, fieldOfStudy.trim()].filter(Boolean).join(', ');
  if (tail) parts.push(tail);
  return parts.join(' · ');
}

export function employmentDisplay(occupation: string, employer: string, showEmployer: boolean): string {
  const o = occupation.trim();
  const e = showEmployer ? employer.trim() : '';
  return [o, e].filter(Boolean).join(' · ');
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Compact relative time for inbox rows and feed posts. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, now - t);
  if (diff < MINUTE) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d`;
  if (diff < 5 * WEEK) return `${Math.floor(diff / WEEK)}w`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function messageTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function longDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/** "Priya, 29" style card line. */
export function nameAge(firstName: string, age: number | null): string {
  return age != null ? `${firstName}, ${age}` : firstName;
}

export function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidLinkedin(url: string): boolean {
  if (!url.trim()) return true;
  return /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(url.trim());
}

/** Profile completeness in whole percent, from the fields members are asked to fill. */
export function profileCompleteness(input: {
  photos: number;
  bio: string;
  occupation: string;
  educationDisplay: string | null;
  height: number | null;
  nationalities: number;
  languages: number;
  relationshipIntent: string | null;
  interests: number;
  displayArea: string;
}): number {
  const checks = [
    input.photos >= 1,
    input.photos >= 3,
    input.bio.trim().length >= 40,
    input.occupation.trim().length > 0,
    !!input.educationDisplay,
    input.height != null,
    input.nationalities > 0,
    input.languages > 0,
    !!input.relationshipIntent,
    input.interests >= 3,
    input.displayArea.trim().length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
