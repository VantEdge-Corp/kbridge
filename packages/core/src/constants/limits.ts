/** Product limits shared by the apps and mirrored by database constraints where noted. */
export const LIMITS = {
  /** Profile photos per member. Mirrors the `profiles.photo_paths` check in migration 013. */
  photos: 6,
  /** Introduction note length. Mirrors the `introduction_requests.note` check in migration 006. */
  introNoteMin: 20,
  introNoteMax: 500,
  /** Conversation requests a member may send per rolling 24 hours. Enforced by a trigger in migration 013. */
  introRequestsPerDay: 8,
  bioMax: 400,
  postBodyMax: 600,
  commentBodyMax: 300,
  interestsMax: 10,
  /** Candidates fetched per discovery request. */
  discoveryPoolSize: 200,
  /** Days a member counts as "new" for exploration boosts and the New tab. */
  newMemberDays: 14,
  /** Days of inactivity after which a member no longer counts as active. */
  activeWithinDays: 7,
} as const;

/** Legal document versions written into consent records. Bump when the documents change. */
export const LEGAL_VERSIONS = Object.freeze({
  terms: '2026-09-23.1',
  privacy: '2026-09-23.1',
});
export const LEGAL_EFFECTIVE_DATE = 'September 23, 2026';

export const BRAND = Object.freeze({
  name: 'Peaches',
  wordmark: 'PEACHES',
  tagline: 'People worth meeting.',
  market: 'Metro Atlanta',
  /** The company that operates Peaches, as named in the legal documents. */
  company: 'HyberTec LLC',
  supportEmail: 'vantedge67@gmail.com',
  /** Plus-addressed, so it lands in the support inbox and can be filtered and flagged there. */
  childSafetyEmail: 'vantedge67+childsafety@gmail.com',
});
