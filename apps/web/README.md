# Peaches web

The web app: public landing and admission flow, legal pages, the member
experience (Home, Explore, Feed, Inbox, Me, Profile View, Settings), and the
committee panel at `/admin`. Vite 7, React 19, TypeScript, Tailwind v4,
react-router v7, `@peaches/core` for everything shared.

## Run

```bash
cp .env.example .env      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev               # from the repository root, or `npm run dev` here
```

## Structure

```
src/main.tsx              entry; ErrorBoundary + router
src/App.tsx               routes and guards
src/theme.css             Tailwind v4 theme from the shared tokens
src/lib/supabase.ts       client (fails loudly without env)
src/lib/api.ts            createApi(supabase)
src/auth/                 AuthProvider (session + own profile), route guards
src/components/           PersonCard, VerificationBadge, PreferencesEditor,
                          PreferenceStrengthSelector, InboxRow, PostCard,
                          SettingsRow, SegmentedTabs, Dialog, MultiSelect, ...
src/routes/               one file per route; routes/admin/ for the committee
e2e/                      Playwright smoke test and screenshot capture
```

## Checks

```bash
npm run typecheck
npm run build
npm run test:e2e          # needs .env pointing at a seeded Supabase (see the root README)
PEACHES_SHOTS=/tmp/shots npm run test:e2e:shots   # full-page captures at 390 and 1280
```

## Deploy

Vercel builds this app from the repository root using `vercel.json`. Set the
two `VITE_` variables in the Vercel project; they are baked in at build time.
