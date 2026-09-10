/**
 * Verification is multi-dimensional. There is deliberately no `verified: boolean`
 * anywhere in the product: each dimension is reviewed and recorded on its own,
 * and a public profile shows only the dimensions that are `verified`.
 */
export type VerificationState = 'unverified' | 'pending' | 'verified' | 'rejected';

export const VERIFICATION_STATES: readonly VerificationState[] = [
  'unverified',
  'pending',
  'verified',
  'rejected',
];

export type VerificationDimension = 'identity' | 'education' | 'student' | 'employment';

export const VERIFICATION_DIMENSIONS: readonly VerificationDimension[] = [
  'identity',
  'education',
  'student',
  'employment',
];

export interface VerificationData {
  identity: VerificationState;
  education: VerificationState;
  student: VerificationState;
  employment: VerificationState;
}

export const UNVERIFIED: VerificationData = Object.freeze({
  identity: 'unverified',
  education: 'unverified',
  student: 'unverified',
  employment: 'unverified',
});

/** The dimensions a public profile may show. Only `verified` ever leaves the server. */
export function publicBadges(v: VerificationData): VerificationDimension[] {
  return VERIFICATION_DIMENSIONS.filter((d) => v[d] === 'verified');
}

export const VERIFICATION_LABEL: Record<VerificationDimension, string> = {
  identity: 'Identity',
  education: 'Education',
  student: 'Student',
  employment: 'Employment',
};

export const VERIFICATION_STATE_LABEL: Record<VerificationState, string> = {
  unverified: 'Not verified',
  pending: 'Under review',
  verified: 'Verified',
  rejected: 'Not confirmed',
};
