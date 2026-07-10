// ─────────────────────────────────────────────────────────────────────────────
// tiers.js — Membership tiers (display model), mirrors web src/lib/tiers.js.
// ─────────────────────────────────────────────────────────────────────────────

export const TIERS = {
  observer: {
    key: 'observer',
    name: 'Observer',
    price: 'Free',
    priceMeta: '',
    features: ['5 introductions per week', 'Standard profile', 'Messaging after match'],
  },
  member: {
    key: 'member',
    name: 'Member',
    price: '$32',
    priceMeta: 'per month',
    recommended: true,
    features: ['Unlimited introductions', 'See who viewed you', 'Priority in review queue', 'Verified member badge'],
  },
  founding: {
    key: 'founding',
    name: 'Founding',
    price: '$120',
    priceMeta: 'per month',
    features: ['Everything in Member', 'Personal concierge matchmaker', 'Curated events in your city', '3 invitations per month'],
  },
};

export const TIER_ORDER = ['observer', 'member', 'founding'];

export function tierMeets(userTier, requiredTier) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

// Free-tier daily like cap (tunable). Enforced client-side in Discover, same
// as the app's other tier limits; move to a DB trigger to make it tamper-proof.
export const DAILY_LIKE_LIMIT = { observer: 30, member: Infinity, founding: Infinity };

export function dailyLikeLimit(tierKey) {
  return DAILY_LIKE_LIMIT[tierKey] ?? DAILY_LIKE_LIMIT.observer;
}
