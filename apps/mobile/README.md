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
lib/                      supabase client, api binding, auth context, image picking
hooks/                    useCandidates, useRefreshOnFocus, useInboxBadge
```

## Checks

```bash
npm run typecheck         # TypeScript 6 as pinned by Expo
npm run export:check      # bundles the app the way Expo Go loads it
```

## Shipping to the App Store

`expo start` and Expo Go are for development. A store build needs EAS:

1. One-time: an Apple Developer account and an Expo account. `npm i -g eas-cli`,
   then from this directory `eas login` and `eas init` (writes `projectId` into
   `app.json`). Add an `eas.json` with `development`, `preview`, and
   `production` build profiles.
2. Cloud builds do not read your local `.env`. Create EAS environment variables
   for `production` (and `preview`): `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_WEB_URL` (the deployed web
   domain, so the in-app Terms and Privacy links resolve).
3. `eas build --platform ios --profile production`, then `eas submit --platform ios`.

App Store Connect checklist:

- Age rating 17+ (required for dating).
- App Privacy labels: contact info (email), photos, coarse location (area),
  user content. They must match the Privacy Policy.
- Support URL and Privacy Policy URL (`https://<your-domain>/privacy`).
- App Review notes with a demo account. Reviewers cannot pass the committee
  gate, so run `supabase/seed_demo.sql` and give them
  `review@peaches.app` / `review123`.
- Test the production build on a real device: apply, admit in `/admin`, sign
  up, add a photo, send a request, accept it from the other side, message,
  block, report, delete the account.
