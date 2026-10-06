# Peaches design system

Peaches is a serious, verified social discovery and dating platform for Metro
Atlanta. The interface is built on [shadcn/ui](https://ui.shadcn.com) with its
**Neutral** palette: modern, quiet, and professional. At a glance it should read
as a well-made membership product, not a stereotypical dating app. Once in use,
its purpose of meeting people is clear.

Colors, radii, sizes, and type live in `packages/core/src/theme/tokens.ts`
under shadcn's own token names; the web declares the same values as shadcn CSS
variables in `apps/web/src/index.css`. Never hard-code a color, size, or radius
that exists there.

## Brand

- Name: **Peaches**. Wordmark: `PEACHES` in Georgia regular, letter-spaced
  (0.2em on the web, 4px on the phone), in `foreground`.
- Monogram: a Georgia `P` in `#fafafa` on `#0a0a0a`, used for the favicon, the
  app icon, and the splash (`scripts/generate-icons.mjs` renders them all).
- Line: *People worth meeting.*
- Georgia is the subtle nod to the Peach State and appears only in the wordmark
  and the monogram. Everything else is set in the sans.
- Never: peach emoji, peach illustrations, pink, big hearts, flames, Cupid,
  romantic gradients, sexual imagery, "hot singles", "crush", "soulmate",
  "swipe right", or childish dating language.

## Foundation

- **Web**: shadcn/ui components (style `base-vega`, on Base UI primitives) with
  Tailwind CSS v4, base color Neutral, CSS variables. The generated components
  live in `apps/web/src/components/ui`; add more with the shadcn CLI, then run
  `npm run ui:icons --workspace apps/web` so their icons come from react-icons.
  App components compose them and never restyle them past their variants.
- **Phone**: shadcn/ui renders DOM, so the phone mirrors its components in
  React Native (`apps/mobile/components`): same token names, same variants,
  same sizes where touch allows. Components read the active palette with
  `useTheme()`.

## Themes

System, Light, and Dark on both platforms. **System** is the default and
follows the device. The choice lives in Settings > Appearance (and in the user
menu on the web), applies immediately, and stays on the device: `localStorage`
on the web, applied before first paint so nothing flashes; AsyncStorage on the
phone, mirrored into the native appearance so alerts, keyboards, and sheets
follow. Every screen is checked in both themes.

## Color

shadcn's Neutral values, plus one Peaches token, `verified`.

| Token | Light | Dark |
|---|---|---|
| `background` / `foreground` | `#ffffff` / `#0a0a0a` | `#0a0a0a` / `#fafafa` |
| `card`, `popover` | `#ffffff` | `#171717` |
| `primary` / `primary-foreground` | `#171717` / `#fafafa` | `#e5e5e5` / `#171717` |
| `secondary`, `muted`, `accent` | `#f5f5f5` | `#262626` |
| `muted-foreground` | `#737373` | `#a1a1a1` |
| `destructive` | `#e7000b` | `#ff6467` |
| `border` / `input` | `#e5e5e5` / `#e5e5e5` | white at 10% / white at 15% |
| `ring` | `#a1a1a1` | `#737373` |
| `verified` | `#179765` | `#5ecd97` |

- `primary` is near-black in light and near-white in dark. It fills the one
  main action on a screen, selected controls, and small status pills.
- `verified` is the only hue besides `destructive`, and it only ever tints a
  verification mark. `destructive` is only for destructive actions (report,
  block, delete, log out) and errors.
- The phone derives a few colors from these in `apps/mobile/constants/theme.ts`
  (the sheet overlay, the dark input fill, the focus halo, the hairline image
  ring) the way shadcn's classes do with opacity, e.g. `input/30`.

## Type

- Web: Geist (`@fontsource-variable/geist`). Phone: the platform's system font.
- Phone scale: title 28/34 semibold, tracking -2.5%; heading 20/28 semibold;
  section and name 16/22 semibold; body 15/22; small 14/20 in
  `muted-foreground`; label 14/20 medium; caption 12/16 and micro 11/14 in
  `muted-foreground`. The web uses Tailwind's scale in the same roles (page
  titles `text-2xl` semibold and tight, section headers `text-base` semibold,
  dense UI `text-sm`).
- Labels, buttons, and headings are sentence case. The Settings list keeps its
  product names (`Discovery Preferences`, `Blocked Users`, `Data & Account`),
  and each settings page is titled with its row's label. No uppercase eyebrows;
  a small label above a block is 13px medium `muted-foreground`.

## Icons

Lucide, the set shadcn/ui draws with: outline, stroke 2, never filled.

- Web: `react-icons/lu` (react-icons' Lucide set), e.g. `LuHouse`.
- Phone: `lucide-react-native` through `components/Icon.tsx`, by Lucide's
  kebab-case names, e.g. `house`.
- Sizes: 16 inline and in menus, 20 in rows and actions, 24 in the tab bar
  and headers. Icons take the text color: `muted-foreground` beside a row
  label, `foreground` on an action, `destructive` on a destructive row.
- The same glyph means the same thing on both platforms. Navigation: house,
  compass, newspaper, inbox, user. Settings: user, sun-moon, eye-off,
  sliders-horizontal, bell, shield-check, user-x, shield, database, log-out.
  Profile facts: ruler, map-pin, signpost, baby, wine, cigarette, dumbbell,
  briefcase, graduation-cap, tag, flag, languages, user. Verification states:
  badge-check, clock-3, circle-x, circle-dashed. No hearts anywhere.

## Radius, spacing, sizes

- Radius from shadcn's 0.625rem: sm 6, md 8, lg 10, xl 14, 2xl 18, pill.
  Buttons and inputs use md; cards, grouped lists, and photos use xl; sheets
  use 2xl at the top; avatars are circles.
- 8pt rhythm. Page padding 16 on phones, 24 to 32 on wider screens. Web
  content widths: 1120 for card grids, 720 for lists, reading, and settings,
  560 for auth and application forms.
- Touch targets at least 44px. Every interactive element has an accessible
  name.
- Avatars: 40 in lists (48 for phone conversations), 36 on posts, 28 small.
- Person cards: 2 columns (3 and 4 as the web container widens), gap 12,
  3:4 portraits. Widths come from the layout, never fixed.

## Components

The web uses shadcn/ui directly: Button, Card, Item, Avatar, Badge, Tabs,
Sheet, Dialog, AlertDialog, DropdownMenu, ContextMenu, Select, Combobox,
Field, Input, InputGroup, Textarea, Checkbox, Switch, Slider, Progress,
Tooltip, Toast, Sidebar, Empty, Skeleton, Spinner, Alert, Collapsible,
Separator, Message, Bubble. The phone's equivalents follow the same specs:
`Button`, `Field`, `Switch`, `Checkbox`, `Group` + `SettingsRow` (Card +
Item), `SegmentedTabs` (Tabs), `Sheet` + `ActionSheet` (Sheet and
DropdownMenu), `EmptyState` (Empty), `TagChip` (Badge), `CompletenessBar`
(Progress), `Avatar`.

- **Button**: shadcn's variants. `default` fills `primary`; `outline` has a
  1px border on `background` (`input/30` fill and `input` border in dark);
  `secondary` fills `secondary`; `ghost` is text with an `accent` press or
  hover; `destructive` is `destructive` text on `destructive` at 10% (20% in
  dark). Radius md. Web 36px (`sm` 32, `lg` 40); phone 44 (`sm` 36, `lg` 48).
  One `default` button per screen.
- **Input**: 1px `input` border, transparent (`input/30` in dark), radius md,
  44px tall with 16px text on the phone. Focus turns the border `ring` inside
  a 3px `ring/50` halo; an error draws both in `destructive` (halo at 20%, 40%
  in dark). The halo is a ring around the input, never a fill. The label sits
  above in 14px medium; helper or error text below in 13px.
- **Switch**: `primary` track when on, `input` when off.
- **Card and grouped list**: `card` background, 1px border (`ring-foreground/10`
  on the web, with `shadow-xs`), radius xl. Rows inside are separated by 1px
  `border` lines, inset from the leading icon or avatar on the phone; rows
  have no borders of their own. Settings, Me, Inbox, filters, and admin
  dossiers all use it.
- **Tabs** (Home sections, Inbox sections, preference strength): a `muted`
  track, radius lg; the active tab is `background` with a small shadow (in
  dark, `input/30` with an `input` border). Count badges are pills at
  `foreground/10`, `primary` on the active tab.
- **Badge / TagChip**: `secondary` for interests and tags; on Explore,
  required filters are `default` (filled) and preferred ones `outline`.
- **PersonCard**: a 3:4 photo, radius xl, with a hairline `foreground/10`
  ring; below it the name and age (16 semibold) with the verification mark,
  then one metadata line in 13px `muted-foreground`. It opens the profile.
  No like buttons on cards.
- **VerificationBadge**: Lucide `badge-check` in `verified`, 14 to 16px, with
  an optional label. Calm, like professional trust language.
- **PreferenceStrengthSelector**: one small Tabs-style control per preference:
  `Required · Preferred · Any`.
- **Sheet**: `popover` background, a 1px border, radius 2xl at the top, a
  36x4 grabber at `muted-foreground` 35%. Web dialogs are shadcn Dialog and
  AlertDialog; a destructive confirmation always uses AlertDialog (web) or a
  native alert (phone).
- **Empty state**: shadcn Empty. A 40px `muted` tile holding a `foreground`
  icon, an 18/26 semibold title, one sentence in `muted-foreground`, at most
  one outline action. Centered text never leaves one word alone on its last
  line (`lineBreakStrategyIOS="push-out"` on the phone).
- **MonogramPortrait**: a member without photos gets a `muted` frame with
  their initial in the sans, in `muted-foreground`.
- **Toast** (web): short confirmations such as `Link copied`. The phone
  confirms in place or with a native alert.

## Menus: one list, every way in

Every action list (on a member, a post, a conversation, a message) is defined
once and opened from all its entry points, so they always match.

- Web: a visible ⋯ button opens the list as a shadcn DropdownMenu, and the
  same list opens as a shadcn ContextMenu on right-click and on long-press.
  The ⋯ button is always present; the context menu is a shortcut, never the
  only way in.
- Phone: the ⋯ button and a long-press (350ms) open the same ActionSheet.
- Each item has a 16 to 20px icon and a label that names the person
  (`Report Amara`, `Block Amara`). Destructive items are `destructive` and
  come last, after a separator on the web. The phone sheet ends with an
  outline Cancel.

## Navigation

Five tabs, in this order: Home, Explore, Feed, Inbox, Me. On the web they
live in a shadcn Sidebar on wide screens (collapsible to icons, remembered in a
cookie, with the user menu at the bottom) and in a bottom tab bar under
768px. On the phone the tab bar is `background` with a 1px `border` top,
`foreground` for the active tab, `muted-foreground` for the rest, and a
`primary` badge on Inbox. Settings is never a tab: it is a gear at the top
right of Me. Profile View is one reusable route (`/profile/:id`) used from
Home, Explore, Feed, and Inbox.

Pushed screens go back with an arrow at the leading edge. Phone modals (New
post, Filters, single-choice pickers) close with an X there instead.
Multi-choice pickers apply each tap as it happens and end with a `Done`
button, with no X that would read as Cancel.

## Copy

Plain, warm, adult. "Interested" or "Request introduction" for the primary
profile action. "Connections" not "matches". "Introduction request" not
"like". Empty states are one calm sentence and, where useful, one action.
No exclamation marks in system copy. Never surface any internal score,
demand, popularity, ranking, or "top" language.

## Privacy rules visible in the UI

- Location is shown only as the coarse area label (e.g. "Duluth area").
- Race/ethnicity and nationality appear on a profile only if the member
  disclosed them; "Prefer not to say" shows nothing.
- Only `verified` badges are shown on other members' profiles. A member sees
  their own pending/rejected states on Me and in Settings > Verification.

## Web layout

- Pages open with a header: the title, an optional one-line description, and
  at most one or two actions. The tab bar and sticky save bars are solid
  `background`; only the public header may be translucent (`background` at
  80% with a backdrop blur).
- Landing: a sticky header with the wordmark, Sign in, Apply, and the theme
  switch; a hero limited to 720px; the three admission steps as numbered
  cards; the verification dimensions as cards; a quiet footer.
- Inbox on desktop (>= 1024px): two panes. A 360px list on the left and the
  conversation on the right; `/inbox` shows a calm "Choose a conversation"
  placeholder there. Narrower screens open the chat full screen.
- Explore on desktop keeps the filters in a side column with a Save button;
  on phones they open as a bottom Sheet.
- Forms: grouped cards with a heading inside; labels above inputs; optional
  fields say "Optional" beside the label, never inside it.

## Phone pass: profile story, requests, inbox, Me

The structure of the best consumer profile UIs is worth borrowing: a profile
that reads as one scrollable story of photo and text cards, a vitals strip, an
icon-led details list, conversations split into your turn and their turn, a
hub-style Me tab. Borrow the structure, never the look: everything stays in
the Neutral palette and free of hearts and like buttons. When these rules
conflict with an earlier line, these win on the phone.

### Home: one member at a time

- Home is not a grid. It shows one member at a time as their full profile
  story (below), led by the identity block so the name is read before the
  first photo, with a ⋯ menu (full profile, report, block) on the identity
  row. The section tabs (For You, Nearby, New, Active) choose which ranking
  feeds it; Explore keeps the grid for browsing.
- Filters live on the deck: a sliders icon at the top right opens the same
  filter sheet Explore uses. Filters are the member's saved preferences, so a
  change from either screen applies to both, and to Me > Discovery
  preferences. Home's empty states offer `Edit filters` (or `Choose area`)
  and open that sheet in place.
- When anyone has asked to meet the member, one row sits between the section
  tabs and the card: up to three of the newest faces (28px, overlapping by
  8px, each with a 2px ring in the row color), then `Priya wants to meet you`
  for one person or `3 people want to meet you` for more, then a chevron. It
  is a `card` container with a 1px `border` and radius xl, at least 52px
  tall, 16px below the tabs and 16px above the identity block. It opens
  Inbox > Requests; the decision is never made on Home.
- The action bar holds `Not now` (outline, 1 part) and `Interested`
  (default, 2 parts). `Interested` opens the written introduction; sending it
  moves to the next member. `Not now` slides the card out to the left and
  hides that member from the viewer's pool for 30 days, one-directionally
  (they still see the viewer). Either way the next member fades in.
- A horizontal drag mirrors the two buttons: left is `Not now`, right is
  `Interested` (the card springs back and the note sheet opens). The card
  follows the finger with at most 3 degrees of rotation, and a small
  `primary` pill with the exact button label fades in at the top. Vertical
  movement scrolls the story; the drag only wins once it is clearly
  horizontal. The gesture never appears in copy: no "swipe right", no
  hearts, no X.
- The member is reported as an impression when their card is shown.

### Profile View

- One vertical story, not a photo pager with a form under it. Blocks, in
  order: main photo, identity block, request note (when they wrote to you),
  bio card, vitals strip, details list, interests, verification, posts. The
  remaining photos are interleaved one at a time between the content blocks
  so every photo is seen in context; any left over follow at the end.
- Photo cards are inset 16px, 4:5, radius xl, with the hairline image ring.
  The main photo is the first thing on the screen. A member without photos
  gets the monogram portrait in the same frame.
- Identity block: name and age at 28/34 semibold with the verification mark
  to the right, then one metadata line (`Product designer · Midtown Atlanta`)
  in 15px `muted-foreground`. As the block scrolls under the header, the name
  fades into the header (16 semibold, centered) over 24px of travel, and the
  header's bottom border fades in with it.
- Bio card: `card`, 1px `border`, radius xl, 20px padding, a small label
  (`About Priya`) and the bio at reading size, 17/26.
- Vitals strip: one horizontally scrolling `card`, radius xl. Items are an
  18px icon and a 15px value with 16px padding, separated by 1px vertical
  `border` lines. Contents, when present: height, area, relationship intent,
  children, drinking, smoking, exercise. No labels: the icon and a
  self-describing value carry the meaning (`Drinks socially`, `Wants
  children`, `Doesn't smoke`).
- Details list: a grouped list of icon rows (work, education, field and
  standing, nationality, languages, ethnicity when disclosed). Values are
  readable phrases (`Speaks Korean and English`, `From Nigeria`). No label
  column; the label is the accessibility name. The web shows the same facts
  with the same icons (`profileVitals` and `profileDetails` in
  `@peaches/core`).
- Verification: a `card` with the verified dimensions as calm badge rows and
  one caption. Shown only when at least one dimension is verified.
- Action bar: the only `default` button on the screen. For an incoming
  request the bar holds Decline (outline, 1 part) and Accept (default, 2
  parts).

### Requests ("liked you")

- Requests are portrait cards, not rows: the same 3:4 PersonCard grid as
  Explore, with a two-line excerpt of the note in place of the metadata line.
  Tapping a card opens the profile; the decision is made there, with the
  whole profile in view and the note as a card under the identity block.
- Requests the member sent stay as rows under a `Sent by you` header, with
  a Withdraw ghost action.
- The Inbox section is part of its route (`/inbox?section=requests`), so the
  requests row on Home always lands on Requests, whichever section was open.

### Inbox

- Two sections: `Requests` and `Connections`. A fresh connection with no
  messages is a conversation like any other.
- Connections are grouped into `Your turn` and `Their turn`: collapsible
  grouped lists, each header with a count pill and a chevron. It is your turn
  when the last message is theirs, or when nobody has written yet and you
  were the one who accepted; it is their turn otherwise.
- Conversation rows: 48px avatar, name 15px medium (semibold, with the
  preview in `foreground`, when it is your turn), one preview line (`You:
  ...` for your own last message, `Say hello` for a fresh connection), a time
  on the right, a `primary` unread pill.
- Chat: one header row (back, avatar with name, area, and verification mark,
  ⋯). Your messages are `primary` bubbles with `primary-foreground` text,
  theirs are `muted`; the composer is a rounded `input` field with a round
  `primary` send button.
- The Inbox tab shows a badge with pending requests plus unread messages.

### Me

- Me is a hub, not an editor. A centered 96px circular portrait with a small
  `primary` edit disc at its corner (opens Photos); name and age at 20/28
  semibold with the verification mark; one metadata line; then the
  completeness card and the grouped rows. Photos are managed on the Photos
  screen; the bio is edited in Edit profile and previewed with `View as
  others see you`.

### Explore

- Explore shows the active filters as a chip row above the grid: a round
  sliders chip first, then distance, then each required (`default`) and
  preferred (`outline`) dimension with a short value. Tapping any chip opens
  the filter sheet (the same sheet as Home's). The people count sits under
  the row as a caption.
- Lists refresh silently when their tab regains focus. Only a pull starts
  the pull-to-refresh spinner.
