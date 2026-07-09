# kbridge mobile

The kbridge app: apply for membership from your phone (with camera/library
photo upload), track your application, claim your account once admitted —
then swipe through the Discover deck, match when the interest is mutual,
and message your matches directly. Expo (managed) + React Navigation,
talking to the **same Supabase project as the web app** — same tables,
same RLS, same realtime chat. There is no separate backend.

## One-time setup

1. **Run the new migration.** In the Supabase SQL Editor, run
   `../supabase/migrations/007_swipes.sql` (after 001–006). It adds the
   `swipes` table, the mutual-like → match trigger, the
   `get_swipe_candidates` RPC, and realtime on swipes.

2. **Configure env.**

   ```bash
   cd mobile
   cp .env.example .env
   ```

   Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   with the same values the web app uses for `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`.

3. **Install and run.**

   ```bash
   npm install
   npx expo start
   ```

   Scan the QR code with **Expo Go** (iOS/Android), or press `i` / `a`
   for a simulator. Every dependency here runs inside Expo Go — no dev
   build needed.

## Applying & signing in

The full admission flow works on the phone, mirroring the web contract
exactly (same table, same RPCs, same silent-decline policy):

1. **Apply** (from the login screen) — the same form as the web `/apply`,
   with face + passport photos from the camera or library, uploaded to the
   private `verifications` bucket. On submit you get a **reference token**;
   it's shown once and also saved on the device.
2. **Check your status** — enter (or auto-load) the token. Pending /
   deferred / admitted / claimed, with the same wording as the web.
3. **Create your account** — once admitted, choose a password right there.
   The `handle_new_user` trigger enforces the approval gate server-side,
   and a session drops you straight into the member tabs.

Accounts created on the web work here too — it's the same email + password
either way. The admin review queue stays web-only (`/admin`).

## How matching works

- **Discover** calls `get_swipe_candidates()` — completed profiles you
  haven't swiped on or matched with — and records each swipe.
- A DB trigger (`handle_swipe`) opens a row in `matches` the moment a like
  is reciprocated (reusing an existing match if one was opened earlier via
  a web introduction). The second swiper sees the match modal from the
  insert's returned `match_id`; the first swiper hears about it live via a
  realtime `UPDATE` stamped onto their earlier swipe row.
- **Matches** lists everything in `matches` — swipe matches and
  introduction matches alike; new ones (no messages) sit in the strip up
  top. Tapping opens the same realtime chat thread the web app's
  Correspondence page uses.

## Layout

```
App.js                       providers + status bar
src/theme.js                 palette / type / portrait gradients (mirrors web)
src/lib/supabase.js          client (AsyncStorage sessions, AppState token refresh)
src/lib/{chat,swipes,profile,applications,storage,format}.js
src/auth/AuthContext.js      session + own profile
src/navigation/RootNavigator.js   login gate → tabs (+ Chat above tabs)
src/components/ui.js         editorial primitives (Screen, Button, Portrait…)
src/components/SwipeDeck.js  PanResponder card deck
src/components/MatchModal.js "a mutual interest"
src/screens/                 Login, Apply, Status, Signup,
                             Discover, Matches, Chat, Profile
```
