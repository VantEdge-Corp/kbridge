# Peaches mobile

The members' iOS/Android app: apply, track your application, create your
account once admitted, then Home, Explore, Feed, Inbox, and Me. Expo SDK 57,
Expo Router, TypeScript, `@peaches/core` for everything shared. Every
dependency runs inside Expo Go; no development build is needed.

## Run

```bash
cp .env.example .env      # EXPO_PUBLIC_SUPABASE_URL, _ANON_KEY, EXPO_PUBLIC_WEB_URL
npm run dev:mobile        # from the repository root, or `npm start` here
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. Expo Go
supports only the current SDK; when it moves past 57, run
`npx expo install expo@latest --fix` here.

For development only, `EXPO_PUBLIC_DEV_EMAIL` and `EXPO_PUBLIC_DEV_PASSWORD`
in `.env` sign the app in automatically on launch. The code path is removed
from production bundles.

## Structure (Expo Router)

```
app/_layout.tsx           providers, splash, signed-out / signed-in gates
app/(auth)/               welcome, login, apply, status, signup
app/(tabs)/               index (Home: one member at a time), explore (grid), feed, inbox, me
app/profile/[id].tsx      reusable Profile View with the single Interested action
app/chat/[matchId].tsx    conversation
app/post/                 new, [id] (comments)
app/me/                   edit, preferences, photos, saved
app/settings/             index, [section]
components/               DiscoverCard, ProfileStory, PersonCard, VerificationBadge, ...
constants/theme.ts        spacing, radii, icon sizes, Georgia / serif fonts, text style factory
lib/theme.tsx             ThemeProvider, useTheme, useStyles: light and dark palettes, System / Light / Dark preference
lib/                      supabase client, api binding, auth context, inbox summary, image picking
hooks/                    useCandidates, useRefreshOnFocus
```

## Checks

```bash
npm run typecheck         # TypeScript 6 as pinned by Expo
npm run export:check      # bundles the app the way Expo Go loads it
```

## Android

The same code is the Android app; there is no separate Android project to
maintain. `app.json` holds the Android identity (`android.package`, the
adaptive icon, permissions) and Expo generates the native project at build
time.

- On a phone: install Expo Go from Google Play, run `npm run dev:mobile`, and
  scan the QR code (same Wi-Fi as the computer, or add `-- --tunnel`).
- In an emulator: install Android Studio, create a recent Pixel device in
  Device Manager, start it, and press `a` in the Expo terminal.
- Against a local Supabase stack, an emulator reaches the computer at
  `10.0.2.2`, not `127.0.0.1`; a phone needs the computer's LAN address.
- Worth checking on Android specifically: the keyboard over the chat composer,
  the apply form, and the introduction note; the back button inside sheets;
  Georgia headings, which fall back to the system serif.
- Permissions are kept to internet, vibration, and storage on Android 12 and
  older (for the photo picker). `app.json` blocks the microphone, camera, and
  draw-over-other-apps permissions that the image picker and the template
  would otherwise add. Keep it that way unless a feature needs more.

## Shipping

`expo start` and Expo Go are for development. Store builds come from EAS:

1. One-time: an Expo account and `npm i -g eas-cli`, then from this directory
   `eas login`, `eas init` (writes `projectId` into `app.json`), and
   `eas build:configure` (writes `eas.json` with build profiles). With
   `"cli": { "appVersionSource": "remote" }` and `"autoIncrement": true` in
   the `production` profile, EAS bumps the build number on every build.
2. Cloud builds do not read your local `.env`. Create EAS environment variables
   for `production` (and `preview`): `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_WEB_URL` (the deployed web
   domain, so the in-app Terms and Privacy links resolve).
3. Settle the store identifiers before the first upload.
   `ios.bundleIdentifier` and `android.package` (both `com.peaches.app` today)
   can never change once published and must be unused in each store; a reverse
   domain you own is safest.
4. Test the production build on a real device: apply, admit in `/admin`, sign
   up, add a photo, send a request, accept it from the other side, message,
   block, report, delete the account.

Both stores need a demo account for review. Reviewers cannot pass the
committee gate, so run `supabase/seed_demo.sql` and give them
`review@peaches.app` / `review123`. Keep those fictional members out of real
members' discovery before launch; nothing separates them today. Both stores
also reject placeholders: `assets/icon.png` and the `assets/android-icon-*.png`
layers are still Expo's template, and the legal documents still contain
`[LEGAL ENTITY NAME]`, `[privacy@your-domain.com]`, `[MAILING ADDRESS]`,
`[STATE]`, and `[REVIEW WITH COUNSEL]`.

### App Store

1. An Apple Developer account.
2. `eas build --platform ios --profile production`, then `eas submit --platform ios`.

App Store Connect checklist:

- Age rating 18+. Apple replaced 17+ with 13+, 16+, and 18+ in 2025; the
  Terms require members to be 18.
- Guideline 4.3(b) names dating as a saturated category: Apple accepts a new
  dating app only if it is meaningfully different. Say what is in the review
  notes: committee-reviewed membership, manually verified details, written
  introductions instead of likes, one metro area.
- Guideline 1.2 (user-generated content) asks for a filter for objectionable
  posts and messages, reporting with action within 24 hours, blocking, and
  published contact information. Reporting, blocking, and the admin Reports
  tab exist; there is no automatic filter yet.
- App Privacy labels: contact info (email), photos, coarse location (area),
  user content. They must match the Privacy Policy.
- Support URL and Privacy Policy URL (`https://<your-domain>/privacy`).

### Google Play

1. A Google Play developer account. An organization account (it needs a
   D-U-N-S number) can publish right away. A personal account created after
   November 13, 2023 must first run a closed test with at least 12 testers
   opted in for 14 days in a row before it can apply for production.
2. In Play Console, create the app. Create a Google service account key
   ([Expo's guide](https://github.com/expo/fyi/blob/main/creating-google-service-account.md))
   and add it under EAS > Credentials > Android.
3. `eas build --platform android --profile production` (an `.aab`), then
   `eas submit --platform android`, which puts the build on the internal
   testing track. For installing on test phones directly, a profile with
   `"android": { "buildType": "apk" }` produces an APK.

Play Console checklist (App content):

- Target API level: new apps and updates must target Android 16 (API 36)
  since August 31, 2026. Expo SDK 57 targets 36; keep the SDK current.
- Content rating questionnaire (a dating app), and Target audience: 18 and over
  only.
- Data safety: email, photos, coarse location (area), messages, and other user
  content; encrypted in transit; users can delete their account. It must match
  the Privacy Policy.
- Account deletion URL: Play wants a web page that loads for anyone, names the
  app, and shows how to request deletion. `/settings/data-account` requires
  signing in, so publish a short public page that explains the in-app path
  (Me > Settings > Data & Account) and the web path, with a support email.
- Child safety standards (required for dating apps): a public page that
  explicitly prohibits child sexual abuse and exploitation, points to in-app
  reporting, commits to removing and reporting abuse material (to NCMEC in the
  US), and names a child-safety contact. The Terms only ban "sexually
  exploitative content" in general today.
- App access: the demo account above.
