// =====================================================
// Tier configuration — single source of truth
// =====================================================

export const TIERS = {
  observer: {
    key: "observer",
    name: "Observer",
    price: "Free",
    priceMeta: "",
    introsPerWeek: 5,
    canSeeWhoViewed: false,
    canAccessEvents: false,
    canSendInvites: false,
    invitesPerMonth: 0,
    profileVisibility: "standard",
    badge: null,
    features: [
      "5 introductions per week",
      "Standard profile",
      "Messaging after match",
    ],
  },
  member: {
    key: "member",
    name: "Member",
    price: "$32",
    priceMeta: "per month",
    introsPerWeek: Infinity,
    canSeeWhoViewed: true,
    canAccessEvents: false,
    canSendInvites: false,
    invitesPerMonth: 0,
    profileVisibility: "standard",
    badge: "verified",
    features: [
      "Unlimited introductions",
      "See who viewed you",
      "Priority in review queue",
      "Verified member badge",
    ],
    recommended: true,
  },
  founding: {
    key: "founding",
    name: "Founding",
    price: "$120",
    priceMeta: "per month",
    introsPerWeek: Infinity,
    canSeeWhoViewed: true,
    canAccessEvents: true,
    canSendInvites: true,
    invitesPerMonth: 3,
    profileVisibility: "featured",
    badge: "founding",
    features: [
      "Everything in Member",
      "Personal concierge matchmaker",
      "Curated events in your city",
      "Profile reviewed by committee",
      "3 invitations per month",
    ],
  },
};

// ── Helpers ──────────────────────────────────────

/** Returns true if the user's tier meets the requirement */
export function tierMeets(userTier, requiredTier) {
  const order = ["observer", "member", "founding"];
  return order.indexOf(userTier) >= order.indexOf(requiredTier);
}

/** Check if user can send an intro (weekly limit for observer) */
export function canSendIntro(profile) {
  const tier = TIERS[profile.tier] ?? TIERS.observer;
  if (tier.introsPerWeek === Infinity) return { allowed: true };
  const used = profile.intros_used_this_week ?? 0;
  if (used >= tier.introsPerWeek) {
    return {
      allowed: false,
      reason: `Observer members are limited to ${tier.introsPerWeek} introductions per week.`,
      upgradeRequired: "member",
    };
  }
  return { allowed: true, remaining: tier.introsPerWeek - used };
}

/** Check if user can send an invite */
export function canSendInvite(profile) {
  const tier = TIERS[profile.tier] ?? TIERS.observer;
  if (!tier.canSendInvites) {
    return {
      allowed: false,
      reason: "Invitations are a Founding member privilege.",
      upgradeRequired: "founding",
    };
  }
  const sent = profile.invites_sent_this_month ?? 0;
  if (sent >= tier.invitesPerMonth) {
    return {
      allowed: false,
      reason: `You've used all ${tier.invitesPerMonth} invitations for this month.`,
      upgradeRequired: null,
    };
  }
  return { allowed: true, remaining: tier.invitesPerMonth - sent };
}

/** Check if user can access events */
export function canAccessEvents(profile) {
  const tier = TIERS[profile.tier] ?? TIERS.observer;
  if (!tier.canAccessEvents) {
    return {
      allowed: false,
      reason: "Events are exclusive to Founding members.",
      upgradeRequired: "founding",
    };
  }
  return { allowed: true };
}
