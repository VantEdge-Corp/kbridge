import type { PublicProfile } from './profile';

/* ---------- Introductions, connections, messages ---------- */

export type IntroductionStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface IntroductionRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  note: string;
  status: IntroductionStatus;
  matchId: string | null;
  createdAt: string;
  respondedAt: string | null;
  /** The other party, from the viewer's perspective. */
  counterpart: PublicProfile;
  /** True when the viewer sent this request. */
  outgoing: boolean;
  /** Set when the request was started from a Feed post. */
  postId: string | null;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

/** An accepted introduction: two members who may message each other. */
export interface Connection {
  matchId: string;
  counterpart: PublicProfile;
  createdAt: string;
  lastMessage: Message | null;
  unreadCount: number;
  /** The introduction note that opened this connection, if any. */
  introductionNote: string | null;
  introducedBy: 'viewer' | 'counterpart' | null;
}

/* ---------- Feed ---------- */

export interface Post {
  id: string;
  author: PublicProfile;
  body: string;
  photoUrl: string | null;
  createdAt: string;
  commentCount: number;
  savedByViewer: boolean;
  /** True when the viewer is the author. */
  own: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  author: PublicProfile;
  body: string;
  createdAt: string;
}

/* ---------- Applications (the admission gate) ---------- */

export type PublicApplicationStatus = 'pending' | 'waitlisted' | 'approved' | 'claimed';
export type AdminApplicationStatus = PublicApplicationStatus | 'rejected';

export interface ApplicationStatusRecord {
  status: PublicApplicationStatus;
  firstName: string;
  createdAt: string;
}

export interface ApplicationSubmission {
  email: string;
  firstName: string;
  age: number | null;
  /** Area id from the AREAS taxonomy. */
  areaId: string | null;
  occupation: string;
  employer: string;
  yearsExperience: number | null;
  linkedinUrl: string;
  school: string;
  degree: string;
  bio: string;
  why: string;
  consent: {
    ageConfirmed: boolean;
    termsVersion: string;
    privacyVersion: string;
  };
}

export interface ApplicationRow {
  id: string;
  email: string;
  status: AdminApplicationStatus;
  firstName: string;
  age: number | null;
  city: string | null;
  occupation: string | null;
  company: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  school: string | null;
  degree: string | null;
  bio: string | null;
  why: string | null;
  internalNote: string | null;
  score: number | null;
  createdAt: string;
  decidedAt: string | null;
  claimedBy: string | null;
  ageConfirmed: boolean | null;
  termsVersion: string | null;
  privacyVersion: string | null;
  consentedAt: string | null;
}

/* ---------- Safety ---------- */

export const REPORT_REASONS = [
  'Fake or misleading profile',
  'Harassment or abuse',
  'Inappropriate content',
  'Spam or solicitation',
  'Someone underage',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportStatus = 'open' | 'reviewed' | 'actioned' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string | null;
  reportedId: string;
  reason: string;
  detail: string | null;
  matchId: string | null;
  postId: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; firstName: string } | null;
  reported: { id: string; firstName: string };
}
