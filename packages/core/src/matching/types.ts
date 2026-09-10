import type { Preferences } from '../types/preferences';
import type { PublicProfile, RecommendationSignals } from '../types/profile';

/** The signed-in member as the ranking functions see them. */
export interface Viewer {
  profile: PublicProfile;
  preferences: Preferences;
  /** Hard search boundary, in miles, from the viewer's private area. */
  maxDistanceMiles: number;
}

/** A candidate as returned by the server: public profile plus coarse signals. */
export interface Candidate {
  profile: PublicProfile;
  signals: RecommendationSignals;
}

export interface RankedCandidate extends Candidate {
  score: number;
}
