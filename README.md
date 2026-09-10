# Peaches

*People worth meeting.*

Peaches is a serious, verified social discovery and dating platform launching in
Metro Atlanta. Membership is by application: anyone can apply, a committee
reviews each application by hand, and only admitted applicants create an
account. Members discover people through a calm two-column grid (no swiping),
send a written introduction request, and message once it is accepted. Identity,
education, student status, and employment are each verified separately and
only verified badges are ever shown.

This repository holds the whole product on one Supabase project:

| Path | What it is |
|---|---|
| `apps/web` | Web app: public landing and admission flow, member experience, legal pages, committee admin panel. Vite 7, React 19, TypeScript, Tailwind v4. Deploys to Vercel. |
| `apps/mobile` | iOS/Android app for members. Expo SDK 57, Expo Router, TypeScript. Runs in Expo Go. |
| `packages/core` | `@peaches/core`: TypeScript models, taxonomies, Metro Atlanta areas, design tokens, the deterministic matching engine, the Supabase data layer, legal documents, and the fictional demo dataset. Both apps import it. |
| `supabase/` | SQL migrations `001`-`013` and the two seed scripts. |
| `docs/DESIGN.md` | The design system both apps follow. |

## Requirements

- Node.js 22 or newer, npm 10 or newer
- A Supabase project (free tier is fine)
- For the mobile app: the Expo Go app on a phone, or Xcode / Android Studio for a simulator

## Setup

### 1. Install

```bash
npm install
```

One install at the repository root covers all three workspaces.

### 2. Create the database

In the Supabase SQL Editor run the migrations in `supabase/migrations/` in
order, `001` through `013`. Each one is a separate file; paste and run one at a
time. Notes that matter:

- `013_peaches.sql` is the Peaches model: areas, structured public profiles,
  owner-only private data and preferences, multi-dimensional verification, the
  feed, the discovery function, realtime publication for messages, introduction
  requests, and posts, and explicit table grants for the API roles. It is
  idempotent and safe to re-run.
- `001`, `006`, `007`, and `010` are not idempotent. Run them once. The others
  can be re-run safely.
- After `013`, no manual Replication or Storage steps are needed. Confirm in
  Storage that `profile-photos` and `post-photos` are public buckets and
  `verifications` is private.

Then run the seeds:

1. `supabase/seed_admin.sql` creates the first committee admin:
   `admin@admin.local` / `admin`. Change the password from Settings after the
   first sign-in.
2. `supabase/seed_demo.sql` (optional, for demos, App Review, and development)
   creates twenty fictional members, posts, introduction requests, two
   connections, and one conversation. Review account: `review@peaches.app` /
   `review123`. A second account, `elena@peaches.app` with the same password,
   can sign in for two-sided testing. No other demo member can sign in.

`seed_demo.sql` is generated. Edit `packages/core/src/mock/people.ts` and run
`npm run seed:generate`; never edit the SQL by hand.

### 3. Configure Auth

Authentication > URL Configuration: set the Site URL to your web domain
(`http://localhost:5173` locally). Authentication > Providers > Email: turning
off "Confirm email" lets a new member land in the app right after sign-up;
leaving it on sends them to sign in after confirming.

### 4. Environment files

```bash
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in the project URL and anon key from Supabase > Settings > API. The mobile
file also needs `EXPO_PUBLIC_WEB_URL`, the deployed web domain, because the
app links to the hosted Privacy Policy and Terms.

### 5. Run

```bash
npm run dev            # web at http://localhost:5173
npm run dev:mobile     # Expo dev server; scan the QR code with Expo Go
```

Expo Go supports only the current Expo SDK. This app tracks SDK 57; when Expo
Go updates, upgrade with `npx expo install expo@latest --fix` inside
`apps/mobile`.

## How the product works

### Admission

```
/apply  ->  committee reviews in /admin  ->  Admit / Defer / Decline (silent)
                                                    |
                                     /status/:token shows "Admitted"
                                                    |
                                     /signup/:token  ->  password  ->  member
```

Nothing exists in `auth.users` until an approved applicant creates a password.
The `handle_new_user` trigger checks for an approved application, builds the
profile, private data, preferences, and signals rows, and marks the application
claimed. Declined applicants see "under review" indefinitely; the status
functions never reveal a decline.

### Data model

Members are split into separate tables so that a naming convention is never
the only boundary:

| Concept | Where | Who can read it |
|---|---|---|
| `PublicProfile` | `public_profiles` view over `profiles` | any signed-in member |
| `PrivateUserData` (area, search radius, structured education and employment) | `member_private` | the owner and admins |
| `Preferences` (one strength per dimension) | `member_preferences` | the owner only |
| `RecommendationSignals` (exposure counters) | `recommendation_signals` | no client role |
| `VerificationData` (four states) | `profiles.verification_*` | the owner; others see verified badges only |
| Moderation (suspension, reports) | `profiles.suspended_at`, `reports` | admins |

Other members never read `profiles` directly. The view projects public columns
only, so the admin score, consent versions, pending or rejected verification
states, and `is_admin` never leave the table. A trigger derives the public
display strings (`employment_display`, `education_display`, `display_area`)
from the private rows, honoring the member's display toggles.

Location is an area chosen from a fixed list of Metro Atlanta areas. Other
members see a coarse label such as "Duluth area". Distances are computed
between area centroids on the server and returned as whole miles.

### Matching

Discovery is deterministic and lives in `packages/core/src/matching/`:

| Function | Role |
|---|---|
| `eligible(A, B)` | Hard filters: distance boundary and every `required` preference. |
| `compatibility(A, B)` | Directional: how well B satisfies A's `preferred` dimensions. |
| `compatibilityBA(A, B)` | `compatibility(B, A)`, computed server-side from B's private preferences and returned as a rounded number so B's preferences never reach A's device. |
| `reciprocalCompatibility(A, B)` | Harmonic mean of the two directions. |
| `distanceSignal(A, B)` | Modest advantage for closer members inside the radius. |
| `demandSignal(B)` | Internal engagement measure with diminishing returns. Never shown. |
| `activitySignal(B)` | Recency of activity, stepped by day. |
| `newUserExploration(B)` | Temporary boost for members in their first two weeks. |
| `exposureAdjustment(B)` | Small lift for under-shown members, small penalty for over-shown ones. |
| `recommendationScore(A, B)` | Weighted sum; compatibility and reciprocity carry 60%. |

`get_discovery_candidates()` returns candidate ids with coarse signals (whole
miles, bucketed counters, day-truncated timestamps, reverse compatibility);
the client joins them to public profiles and ranks the four Home sections
(For You, Nearby, New, Active). Explore applies the member's saved preferences
manually. The SQL mirror of the compatibility rules is checked against the
TypeScript implementation by `npm run check:parity`.

Rules enforced in code and tests: nationality and race/ethnicity affect
matching only when a member selects them in their own preferences; they are
never inputs to demand or exposure. "Prefer not to say" is a disclosure state,
not a category, and never participates in matching.

### Verification

Members request review of one dimension at a time from Me or Settings. The
committee sets each dimension to unverified, pending, verified, or rejected
from the admin panel. Peaches collects no government IDs and no biometrics.

### Feed, inbox, safety

Members post short text with an optional photo, comment, save posts, and can
request a conversation from a post. The inbox has Requests, Connections, and
Messages. Members can block and report members, posts, and conversations, and
delete their own account from Settings. A trigger caps introduction requests at
eight per rolling day and refuses requests across a block.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm run build` | Web dev server / production build |
| `npm run dev:mobile` | Expo dev server for the mobile app |
| `npm run typecheck` | TypeScript across core, web, and mobile |
| `npm test` | Matching engine and formatting tests |
| `npm run seed:generate` | Regenerate `supabase/seed_demo.sql` from the dataset |
| `npm run check:parity` | Compare SQL and TypeScript compatibility on a database (see the script header for env vars) |
| `DATABASE_URL=... npm run db:test` | Transactional functional checks of the schema: row security, derived fields, discovery, requests, blocks (24 checks, rolls back) |
| `cd apps/web && npm run test:e2e` | Web end-to-end smoke test against a running, seeded Supabase |
| `cd apps/mobile && npm run export:check` | Bundle the mobile app the way Expo Go loads it |

## Local end-to-end testing

With Docker and the Supabase CLI installed you can run the whole schema
locally: create a scratch directory, copy `supabase/migrations/*.sql` into
`supabase/migrations/` there, run `supabase init` then `supabase start`, and
point the apps' `.env` files at the printed API URL and anon key. Apply the
seeds with `psql "$DB_URL" -f supabase/seed_admin.sql` and
`-f supabase/seed_demo.sql`. If another local Supabase project already uses the
default ports, change the `port` values in the scratch `config.toml`.

## Deployment

- **Web**: `vercel.json` at the root builds `apps/web` from the monorepo. Set
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project.
- **Mobile**: see `apps/mobile/README.md` for EAS build and App Store notes.

## Legal

`packages/core/src/legal/documents.ts` holds the Privacy Policy and Terms of
Service rendered at `/privacy` and `/terms`. They are starter drafts with
bracketed placeholders (entity, contact, address, governing law) and have not
been reviewed by counsel. Bump `LEGAL_VERSIONS` in
`packages/core/src/constants/limits.ts` on any material change so consent is
re-recorded.

## Not built yet

Payments and subscriptions, push notifications, government ID verification,
machine-learned ranking, video or voice calls, stories, livestreaming, and
device location tracking are intentionally out of scope for this build.
