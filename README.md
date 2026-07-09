# kbridge — Application-Gated Members' Society

A members-verified dating app with a hard application gate: anyone can apply, but no `auth.users` row exists until the committee approves them. Approved applicants are then prompted to choose a password and create their account. Declines are silent.

## Requirements

- Node.js 18+
- npm
- A Supabase project (free tier is fine)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project at https://supabase.com/dashboard. Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run migrations in order

In the Supabase SQL editor, run these in order:

1. `supabase/migrations/001_initial_schema.sql` — profiles, matches, messages, events, invitations
2. `supabase/migrations/002_applications_gate.sql` — applications table, `is_admin` flag, gated signup trigger, public status RPCs
3. `supabase/migrations/003_signup_flow.sql` — `get_application_for_signup` RPC used by `/signup/:token`
4. `supabase/migrations/004_rls_no_recursion.sql` — replaces the admin RLS policies with a SECURITY DEFINER `is_admin()` helper. Without this, sign-in succeeds but `/discover` hangs because the profile query trips infinite RLS recursion.
5. `supabase/migrations/005_verifications.sql` — profession/company/LinkedIn/years columns on applications, plus a private `verifications` storage bucket with policies (anon insert, admin select). After running, confirm in Supabase Dashboard → Storage that a bucket named `verifications` exists and is **not** marked public.
6. `supabase/migrations/006_introductions.sql` — `introduction_requests` table + trigger that opens a match on accept, message read-receipts policy
7. `supabase/migrations/007_swipes.sql` — `swipes` table + trigger that opens a match on a mutual like, `get_swipe_candidates` RPC, realtime on swipes. Required by the mobile app's Discover deck.

> The loose `supabase/migration_ai_scoring.sql` outside the `migrations/` folder is from the older prototype model and is no longer required. You can ignore it or delete it.

### 4. Configure Supabase Auth

In your Supabase dashboard:

- **Authentication → URL Configuration**
  - Site URL: `http://localhost:5173`
  - Redirect URLs: `http://localhost:5173/auth/callback` (kept for future flexibility; the active flow uses password sign-in)
- **Authentication → Providers → Email**
  - For easiest local development, **turn OFF "Confirm email"**. The signup will then create a session immediately and drop the new member into `/discover`.
  - If you leave it ON, new members are redirected to `/login?confirm=1` and must confirm via the email Supabase sends before they can sign in.

### 5. Seed the bootstrap admin

Run `supabase/seed_admin.sql` in the Supabase SQL Editor. It creates:

- An approved application for `admin@admin.local`
- An auth user with bcrypt-hashed password `admin` (bypasses the 6-char signup minimum by writing directly into `auth.users`)
- A profile flagged `is_admin = true`

Verify by signing in at `/login` with `admin@admin.local` / `admin`, then visiting `/admin`.

If the direct `auth.users` insert fails on your Supabase version, the file's footer has a Dashboard-based fallback.

### 6. Run the app

```bash
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview build
```

Or use the included shell script (does `.env` and `node_modules` checks, then starts dev):

```bash
./start.sh
```

## The flow

```
PUBLIC                       ADMIN (admin@admin.local)         APPLICANT
──────                       ─────────────────────────         ─────────
/  Landing
  ↓
/apply       ── insert ──→   /admin   Approve / Decline (silent) / Defer
                                      ↓ (approved)
                              applications.status = 'approved'
                                                                  ↓
                                                          /status/:token
                                                          → "Admitted"
                                                          → "Create your account"
                                                                  ↓
                                                          /signup/:token
                                                          → email pre-filled
                                                          → choose password
                                                          → supabase.auth.signUp
                                                          → handle_new_user trigger:
                                                            • verifies approved application
                                                            • creates profile from app
                                                            • marks application 'claimed'
                                                                  ↓
                                                          /discover (members area)
                                                                  ↓
                                                          Future logins → /login (email + password)
```

## Routes

| Path | Who | Purpose |
|---|---|---|
| `/` | Public | Landing |
| `/apply` | Public | Application form |
| `/status/:token` | Public | Application status (silent-decline aware) |
| `/signup/:token` | Public | Set password, create account (gated by approval) |
| `/login` | Public | Email + password sign-in |
| `/discover` etc. | Members | Existing dating UI (untouched) |
| `/admin` | Admin | Application review queue |

## Silent decline

Declined applications are stored as `status = 'rejected'`, but the public RPCs (`get_application_status`, `get_application_email_status`, `get_application_for_signup`) never reveal the `'rejected'` status to the applicant — `/status/:token` shows "still under review" forever, and `/signup/:token` simply refuses to load.

To change this policy (e.g. send a polite decline email instead), edit the RPCs in `002_applications_gate.sql` / `003_signup_flow.sql` and add a Supabase Edge Function for outbound mail.

## Edge cases handled

- **Duplicate apply**: a unique partial index on `(lower(email))` for open statuses blocks a second pending/approved app for the same email; the form surfaces "An application from this email is already on file."
- **Signup with the wrong email**: `handle_new_user` raises if no approved application exists for the email — the signup page surfaces the trigger's message.
- **Reapply after decline**: rejected and claimed rows are excluded from the unique constraint, so the email can reapply.
- **Bot signups**: the apply form includes an off-screen honeypot field.
- **Admin self-review**: nothing prevents you from reviewing your own application.

## What's been removed from the previous prototype

- The old `AuthPage` and `OnboardingPage` components in `App.jsx` are no longer routed. They're still in the file as dead code — feel free to delete them.
- Magic-link sign-in (`signInWithOtp`) was removed; everything is email + password now. `/auth/callback` is kept routed (harmless) but not used by the active flow.

## What's still mocked (from the original prototype)

- Identity verification (Veriff / Onfido / Persona would slot in)
- Education verification (MeasureOne)
- Photo upload (gradients only)
- Matching algorithm (random for demo)
- Chat replies (simulated)
- Payments (Stripe would slot in)

These are post-login features and are not on the critical path for the application gate.

## Mobile app

`mobile/` holds the members' iOS/Android app (Expo + React Navigation): a
swipeable Discover deck, mutual-like matching, and direct messaging with
matches. It talks to the same Supabase project — no separate backend. See
[`mobile/README.md`](mobile/README.md) for setup; migration 007 must be run
first.

## Tech stack

- React 18 + Vite + Tailwind
- React Router v6
- Supabase (Auth + Postgres + RLS)
- lucide-react
- Mobile: Expo SDK 54 (React Native), React Navigation v7, same Supabase project

Deploy target: Vercel (`vercel.json` is included). The mobile app ships via Expo/EAS and does not touch Vercel.
