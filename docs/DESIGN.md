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
