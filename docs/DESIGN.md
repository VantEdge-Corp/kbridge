# Peaches design system

Peaches is a serious, verified social discovery and dating platform for Metro
Atlanta. The interface is dark, restrained, premium, professional, editorial,
and modern. At a glance it should read as a premium membership or professional
community app, not a stereotypical dating app. Once in use, its purpose of
meeting people is clear.

Tokens live in `packages/core/src/theme/tokens.ts`. Both apps consume them;
never hard-code a color, size, or radius that exists there.

## Brand

- Name: **Peaches**. Wordmark: `PEACHES`, Georgia, letter-spaced (4px), ivory.
- Line: *People worth meeting.*
- Georgia is the subtle nod to the Peach State. Nothing else references it.
- Never: peach emoji, peach illustrations, pink, bright red, big hearts, flames,
  Cupid, romantic gradients, sexual imagery, "hot singles", "crush",
  "soulmate", "swipe right", or childish dating language.

## Themes

Two palettes share one set of semantic token names. **Dark** is the brand
default and the one described throughout this document. **Light** keeps the
same restraint on warm off-white and exists so members can choose; the phone
app follows the device appearance by default and offers System / Light / Dark
under Settings > Appearance (stored on the device, applied immediately, and
mirrored into the native appearance so alerts, keyboards, and sheets follow).

`ivory` / `onIvory` name the primary control color and the text on it, not a
literal hue: warm ivory with near-black text in dark mode, near-black ink with
warm off-white text in light mode. Never hard-code either; read the active
palette from `useTheme()` on the phone.

| Token | Dark | Light |
|---|---|---|
| `canvas` | `#0b0b0c` | `#f7f5f1` |
| `surface` | `#131315` | `#ffffff` |
| `surfaceElevated` | `#1b1b1e` | `#f3f0ea` |
| `border` / `borderStrong` | `#26262a` / `#36363b` | `#e7e3dc` / `#d6d1c8` |
| `ivory` / `onIvory` | `#f1ece2` / `#0f0f10` | `#161513` / `#f7f5f1` |
| `text` / `textSecondary` / `textMuted` | `#f1ece2` / `#b7b1a6` / `#7f7a71` | `#161513` / `#5f5a52` / `#8b857b` |
| `verified` | `#9db8a5` | `#4c7c5c` |
| `danger` | `#c9908a` | `#b2544a` |
| `portraitA` / `portraitB` | `#2a2622` / `#3a3129` | `#d9d1c5` / `#ebe4d8` |

Everything below describes the dark palette; the light palette maps
one-to-one (white cards on warm off-white, ink where ivory is named).

## Surfaces

90-95% of every screen is dark.

| Token | Value | Use |
|---|---|---|
| `canvas` | `#0b0b0c` | page background (near-black) |
| `surface` | `#131315` | cards, rows, inputs (charcoal) |
| `surfaceElevated` | `#1b1b1e` | sheets, modals, popovers (graphite) |
| `surfaceWarm` | `#171512` | warm section grounds (very dark warm gray) |
| `border` | `#26262a` | thin 1px borders and separators |
| `borderStrong` | `#36363b` | focused inputs, emphasized dividers |

No large white or ivory cards or sections. Ivory appears only as text, the
selected state of a control, small buttons, and important information.

## Type

| Token | Value | Use |
|---|---|---|
| `ivory` / `text` | `#f1ece2` | primary text, selected controls |
| `textSecondary` | `#b7b1a6` | secondary copy |
| `textMuted` | `#7f7a71` | metadata, timestamps, placeholders |
| `textFaint` | `#55524c` | disabled, hairline labels |
| `onIvory` | `#0f0f10` | text on an ivory button |
| `verified` | `#9db8a5` | verification badge tint only |
| `danger` | `#c9908a` | destructive actions, muted |

Georgia (serif) is used **only** for: the wordmark, major screen titles,
important profile names (cards and profile view), selected editorial headings.
Everything else uses the platform's modern system sans-serif: navigation,
metadata, buttons, filters, descriptions, timestamps, settings, utility text.

Sizes: title 28, heading 22, subheading 18, name 17, body 15, bodySmall 13,
caption 12, micro 11. Eyebrow labels are 11px sans, uppercase, 1.2px tracking,
`textMuted`.

## Icons

Small, thin, monochrome, outline. 18-22px; bottom navigation 20px.
Web: `lucide-react` with `strokeWidth={1.5}`. Mobile: `@expo/vector-icons`
Feather. Icons take the current text color. No filled icons, no oversized
circular action buttons, no hearts as navigation or discovery controls.

## Layout

- Page padding 16. Card grid: 2 columns, gap 12, 3:4 portrait images with
  radius 12. Card width is computed from the viewport, never fixed.
- Radius: sm 6, md 10, lg 14, xl 20, pill 999.
- Touch targets at least 44px. Accessibility labels on every interactive element.
- Avatars: inbox rows 40px, feed 36px, small 28px. Always circular.

## Components (shared vocabulary)

`Wordmark`, `PersonCard`, `VerificationBadge`, `SectionHeader`, `TagChip`,
`FilterRow`, `PreferenceStrengthSelector`, `BottomNavigation` (mobile) /
`SideNav` (web), `ProfileMetadata`, `ProfilePhotoGallery`, `InboxRow`,
`PostCard`, `SettingsRow`, `SegmentedTabs`, `Button`, `Field`, `EmptyState`,
`MonogramPortrait`.

- **PersonCard**: 3:4 portrait, then one line `First name, age` in Georgia
  17px with a small verification indicator to the right, then one metadata
  line in sans 12px muted (e.g. `Product designer · Midtown Atlanta`).
  Tapping opens the profile. No like/heart buttons on the card.
- **VerificationBadge**: a 14px outline check-circle in `verified` with an
  optional label (`Verified` or the dimension). Calm and understated; reads
  like professional trust language, not a social-network tick.
- **PreferenceStrengthSelector**: one compact segmented control per
  preference row: `Required · Preferred · Any`. Selected segment is ivory
  with `onIvory` text. Never three large buttons.
- **SegmentedTabs** (Home sections, Inbox sections): text tabs, sans 13px,
  selected is ivory text with a 1px ivory underline, others `textMuted`.
- **Primary button**: ivory background, `onIvory` text, radius 10, 44px tall,
  sans 15px medium. Used sparingly, one per screen at most.
- **Secondary button**: transparent, 1px `border`, ivory text.
- **MonogramPortrait**: for members without photos: a warm dark gradient
  (`portraitA` to `portraitB`) with the first initial in Georgia, ivory.

## Navigation

Five bottom tabs on mobile, in this order: Home, Explore, Feed, Inbox, Me.
On the web the same five sections live in a slim left rail on desktop and a
bottom bar under 768px. Settings is never a tab: it is a small gear icon at the
top right of Me. Profile View is one reusable route (`/profile/:id`) used from
Home, Explore, Feed, and Inbox.

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

## Polish pass (clean, modern)

These rules refine everything above. When they conflict with an earlier
line, these win.

### Rhythm

- 8pt grid everywhere. Page padding 16 on phones, 32 on desktop.
- Content widths on the web: 1120 for card grids, 720 for lists, reading
  and settings, 560 for auth and application forms. Center them.
- Sections are separated by 32 to 40px; items inside a section by 12 to 16px.
- A screen title (Georgia 28/34) has 8px of subtitle below it and 24px before
  content. Subtitles are 15px `textSecondary`.

### Surfaces and radii

- Radii: sm 8, md 12, lg 16, xl 24, pill 999. Inputs and buttons use md,
  cards and grouped lists use lg, sheets and dialogs use xl.
- Grouped list pattern: rows live inside one container with `surface`
  background, a 1px `border`, and radius lg. Rows are separated by 1px
  `border` lines inset from the leading avatar or icon; individual rows have
  no outer borders of their own. Use it for Settings, Inbox, Me rows, filter
  groups, admin dossiers.
- Inputs: 44px tall (48 on phones), `surface` background, 1px `border`,
  radius md, 12 to 14px horizontal padding, placeholder `textMuted`. Focus:
  border `borderStrong` plus a 2px outer ring of ivory at 8% opacity.
- Buttons: 44px tall, radius md, 15px medium. Primary: ivory background,
  `onIvory` text; hover `#e6e0d4`. Secondary: transparent with 1px `border`,
  ivory text; hover `surfaceHover`. Ghost: text only. Pressed: 0.8 opacity on
  phones, 0.9 on the web. One primary per screen.
- Thin 1px dividers only. No drop shadows on the canvas; sheets and dialogs
  may use a soft 24px shadow at 40% black.

### Type

- Field labels are sentence case, 13px, `textSecondary`, 6px above the
  input. Never uppercase per-field labels.
- Uppercase eyebrows (11px, 1.2px tracking, `textMuted`) are only for section
  headers and tiny status words.
- Body 15/22 `text`; secondary 15/22 `textSecondary`; metadata 12 or 13
  `textMuted`, one line, ellipsized.

### Cards

- PersonCard: 3:4 image with radius lg and a hairline inner ring at 6% ivory;
  10px below it the name row (Georgia 17 plus the badge), then one metadata
  line. Web hover: image brightens 5% over 150ms and the name gains a 1px
  ivory underline. Phone press: 0.85 opacity.
- PostCard: 16px padding inside a grouped container (see above), 36px
  avatar, actions row of thin icons at 20px with 24px gaps; the
  "Request conversation" action is a ghost button with an icon.

### Tabs and rails

- SegmentedTabs: 14px medium text, 20px gap, `textMuted`; the active tab is
  ivory with a 2px ivory underline that hugs the label. Count badges are
  11px pills on `surfaceElevated`.
- Web rail: 76px wide; the active item is a 40px radius-md `surfaceElevated`
  square with the icon in ivory; hover `surfaceHover`; labels 11px.
- Phone tab bar: 20px icons, 11px labels, active ivory, a 1px `border` top.

### Sheets, dialogs, empty states, motion

- Sheets: `surfaceElevated`, top radius xl, a 36x4 `borderStrong` grabber,
  24px padding. Dialogs on the web: radius xl, 24px padding, max width 480.
- Empty states: centered, one sentence in `textSecondary`, optional single
  secondary button, 48px vertical padding.
- Transitions 150ms ease on hover and focus. No bounces, no springs on
  navigation.

### Web-specific

- Landing: a sticky header with the wordmark, blurred `canvas` at 80%; a
  hero limited to 720px with a very subtle warm radial glow (6% opacity)
  behind it; the three admission steps in one grouped container as three
  columns; the verification list as a two-column grouped container; a quiet
  footer.
- Inbox on desktop (>= 1024px): two panes. A 360px list on the left with the
  three sections and a conversation on the right. `/inbox` shows a calm
  "Choose a conversation" placeholder on the right; `/chat/:matchId` shows
  the thread there. On narrower screens the existing full-screen chat stays.
- Forms: sections are grouped containers with an eyebrow title inside;
  sentence-case labels; helper text 13px `textMuted` below the input.

### Phone-specific

- Screen headers: back arrow, Georgia 28 title, one small trailing action.
- Settings, Me, Inbox, Blocked users, Saved posts: grouped containers with
  16px side margins.
- Pickers and multi-selects: full-screen modal with a search field on top and
  a Done button; selected rows show a check at the trailing edge.

## Phone pass: profile story, requests, inbox, Me

The structure of the best consumer profile UIs is worth borrowing: a profile
that reads as one scrollable story of photo and text cards, a vitals strip, an
icon-led details list, conversations split into your turn and their turn, a
hub-style Me tab. Borrow the structure, never the look: everything stays dark,
restrained, and free of hearts and like buttons. When these rules conflict
with an earlier line, these win on the phone.

### Home: one member at a time

- Home is not a grid. It shows one member at a time as their full profile
  story (below), led by the identity block so the name is read before the
  first photo, with a small "more" action (full profile, report, block) on
  the identity row. The section tabs (For You, Nearby, New, Active) choose
  which ranking feeds it; Explore keeps the grid for browsing.
- The action bar holds `Not now` (secondary, 1 part) and `Interested`
  (primary, 2 parts). `Interested` opens the written introduction; sending it
  moves to the next member. `Not now` slides the card out to the left and
  hides that member from the viewer's pool for 30 days, one-directionally
  (they still see the viewer). Either way the next member fades in.
- A horizontal drag mirrors the two buttons: left is `Not now`, right is
  `Interested` (the card springs back and the note sheet opens). The card
  follows the finger with at most 3 degrees of rotation, and a small ivory
  pill with the exact button label fades in at the top. Vertical movement
  scrolls the story; the drag only wins once it is clearly horizontal.
  The gesture never appears in copy: no "swipe right", no hearts, no X.
- The member is reported as an impression when their card is shown.

### Profile View

- One vertical story, not a photo pager with a form under it. Blocks, in
  order: main photo, identity block, request note (when they wrote to you),
  bio card, vitals strip, details list, interests, verification, posts. The
  remaining photos are interleaved one at a time between the content blocks
  so every photo is seen in context; any left over follow at the end.
- Photo cards are inset 16px, 4:5, radius lg, with the hairline image ring.
  The main photo is the first thing on the screen. A member without photos
  gets the monogram portrait in the same frame.
- Identity block: name and age in Georgia 28/34 with the verification mark
  to the right, then one metadata line (`Product designer · Midtown Atlanta`)
  in 15px `textSecondary`. As the block scrolls under the header, the name
  fades into the header (Georgia 17, centered) over 24px of travel.
- Bio card: `surface`, 1px `border`, radius lg, 20px padding, an eyebrow
  (`About Priya`) and the bio in Georgia 20/28 ivory. This is the one
  sanctioned editorial use of Georgia for body copy; it reads like a
  pull-quote, never like a form field.
- Vitals strip: one horizontally scrolling `surface` card, radius lg. Items
  are an 18px icon and a 15px value with 16px padding, separated by 1px
  vertical `border` lines. Contents, when present: height, area,
  relationship intent, children, drinking, smoking, exercise. No labels: the
  icon and a self-describing value carry the meaning (`Drinks socially`,
  `Wants children`, `Doesn't smoke`).
- Details list: a grouped container of icon rows (work, education, field and
  standing, nationality, languages, ethnicity when disclosed). Values are
  readable phrases (`Speaks Korean, English`, `From Nigeria`). No label
  column; the label is the accessibility name.
- Verification: a `surface` card with the verified dimensions as calm badge
  rows and one caption. Shown only when at least one dimension is verified.
- Action bar: the only primary button on the screen. For an incoming request
  the bar holds Decline (secondary, 1 part) and Accept (primary, 2 parts).

### Requests ("liked you")

- Requests are portrait cards, not rows: the same 3:4 PersonCard grid as
  Home, with a two-line excerpt of the note in place of the metadata line.
  Tapping a card opens the profile; the decision is made there, with the
  whole profile in view and the note as a card under the identity block.
- Requests the member sent stay as rows under a `Sent by you` header, with
  a Withdraw ghost action.

### Inbox

- Two sections: `Requests` and `Connections`. A fresh connection with no
  messages is a conversation like any other.
- Connections are grouped into `Your turn` and `Their turn`: collapsible
  grouped lists, each header with a count pill and a chevron. It is your turn
  when the last message is theirs, or when nobody has written yet and you
  were the one who accepted; it is their turn otherwise.
- Conversation rows: 48px avatar, name 15px medium (ivory when it is your
  turn), one preview line (`You: ...` for your own last message, `Say hello`
  for a fresh connection), a time on the right, an ivory unread pill.
- The Inbox tab shows a badge with pending requests plus unread messages.

### Me

- Me is a hub, not an editor. A centered 96px circular portrait with a small
  ivory edit disc at its corner (opens Photos); name and age in Georgia 22
  with the verification mark; one metadata line; then the completeness card
  and the grouped rows. Photos are managed on the Photos screen; the bio is
  edited in Edit profile and previewed with `View as others see you`.

### Empty states and Explore

- Empty states may lead with a 48px `surface` disc holding a 20px muted
  icon. The title is Georgia 20/26 ivory, the body 13px `textMuted`, with
  one optional secondary action.
- Explore shows the active filters as a chip row above the grid: a round
  sliders chip first, then distance, then each required (ivory) and
  preferred (outline) dimension with a short value. Tapping any chip opens
  the filter sheet. The people count sits under the row as a caption.
