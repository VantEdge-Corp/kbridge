// ─────────────────────────────────────────────────────────────────────────────
// legal.js — Consent versions + links to the hosted legal documents.
//
// The documents themselves live on the web app (rendered at /privacy and
// /terms from src/legal/documents.js). The mobile consent screens link out to
// those canonical pages, so there is one source of truth.
//
// ⚠️  LEGAL_VERSIONS must match src/legal/documents.js on the web. When you
//     bump a document version there, bump it here too — these strings are
//     written into the consent records (migration 008).
//
// Set EXPO_PUBLIC_WEB_URL in mobile/.env to your deployed web domain so the
// links open the real hosted policies (e.g. https://your-app.vercel.app or,
// for local dev, http://localhost:5173).
// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL_VERSIONS = Object.freeze({
  terms: '2026-07-09',
  privacy: '2026-07-09',
});

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://kbridge.app').replace(/\/+$/, '');

export const LEGAL_URLS = Object.freeze({
  privacy: `${WEB_URL}/privacy`,
  terms: `${WEB_URL}/terms`,
});
