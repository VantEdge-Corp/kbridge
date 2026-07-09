// ─────────────────────────────────────────────────────────────────────────────
// purchases.js — Subscription purchase abstraction (the IAP integration point).
//
// ⚠️  NOT WIRED TO A STORE YET, on purpose — real in-app purchases need things
//     only you can provide, and the native SDK won't run in Expo Go. To turn it
//     on:
//       1. Create a RevenueCat account (recommended over raw StoreKit), and
//          set up auto-renewing subscription products in App Store Connect and
//          Google Play Console with the identifiers in PRODUCT_IDS below.
//       2. `npx expo install react-native-purchases` and switch to an Expo dev
//          build: `eas build --profile development` (Expo Go can't load native
//          purchase modules).
//       3. Put your RevenueCat public key in EXPO_PUBLIC_REVENUECAT_IOS_KEY and
//          call Purchases.configure(...) once at startup (in App.js).
//       4. Replace the stubbed bodies below with the SDK calls in the comments,
//          and flip isPurchasesConfigured() to true.
//     Apple also requires that digital subscriptions use IAP (Guideline 3.1.1)
//     — you can't sell these through Stripe inside the iOS app.
//
// Everything above this line (the paywall UI, the tier model) already works;
// only these three functions need the SDK.
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_IDS = {
  member: 'kbridge_member_monthly',
  founding: 'kbridge_founding_monthly',
};

export function isPurchasesConfigured() {
  return false; // flip to true once react-native-purchases is configured
}

export async function purchaseTier(tierKey) {
  // With RevenueCat:
  //   const offerings = await Purchases.getOfferings();
  //   const pkg = offerings.current.availablePackages
  //     .find(p => p.product.identifier === PRODUCT_IDS[tierKey]);
  //   const { customerInfo } = await Purchases.purchasePackage(pkg);
  //   return customerInfo.entitlements.active[tierKey] != null;
  const err = new Error('Memberships aren’t available for purchase yet.');
  err.notConfigured = true;
  throw err;
}

export async function restorePurchases() {
  // With RevenueCat: return Purchases.restorePurchases();
  const err = new Error('Memberships aren’t available for purchase yet.');
  err.notConfigured = true;
  throw err;
}
