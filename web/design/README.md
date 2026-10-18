# Design

The visual design for the Game Companion front end, derived from the mocks in this folder. Spec Kit features that touch the look build from this document (constitution principle IV). Colors were sampled from the mocks; anything the mocks don't show is marked **TBD** rather than invented.

## Mocks

| File | Theme | Shows |
|------|-------|-------|
| `general-sign-in-title-screen.png` | General | Sign-in, styled as a game title screen |
| `general-conversation.png` | General | Conversation with a spoiler gate |
| `elden-ring-conversation.png` | Elden Ring | Conversation with a run journal save |
| `elden-ring-panel-open.png` | Elden Ring | Run panel (bottom sheet) on the Character tab |

## Themes and games are separate

A **theme** is the look: colors, fonts, heading style, ornaments. A **game** is the content: what the character panel shows (Elden Ring's VIG/MND/… stats, equipment, sorceries), its terminology and its game knowledge. The two vary independently:

- Any theme can be used with any run. An Elden Ring run can use the General theme, and a future game's run could use the Elden Ring theme if the user likes it.
- Layout and components are shared by all themes. A theme never changes structure, only how it looks.
- Game-specific content (the stat grid, the Equipped list) is driven by the run's game, not by the theme.

## Layout and components

Mobile-first, single column, designed at phone width (the mocks are 390pt wide at 2x). The app is used on a phone or second screen while playing. Wider layouts are **TBD**.

**Run header.** Back button, run title ("Vaela's Run") in the display font, a muted subtitle line (class · level · region), and a menu button that opens the run panel. Separated from the conversation by a hairline divider.

**Conversation.**
- A centered, letter-spaced, uppercase date label ("CONVERSATION · TODAY").
- User messages are right-aligned bubbles: raised surface, 1px border, generous radius.
- Companion messages are not bubbled. They sit full width under a "Companion" label in the accent color and display font, so the companion reads like a person talking rather than a chat widget.
- **Inline cards** interrupt the companion's turn for things that need the user's attention. Each has an icon, an uppercase accent label and a short body, followed by two equal-width buttons.
  - *Run journal save* ("SAVING TO YOUR RUN JOURNAL"): shows the entry being saved. Buttons: **Correct** and **Stop**, both secondary.
  - *Spoiler gate* ("SPOILER AHEAD"): asks before revealing. Buttons: **Just a hint** (primary) and **Tell me anyway** (secondary). The safe choice is always the primary one.

**Composer.** Pinned to the bottom on a chrome-colored bar with a top divider: a pill-shaped input ("Ask your companion…") and a circular accent send button with an up arrow.

**Run panel.** A bottom sheet with a grab handle that dims the conversation behind it. Tabs: **Character**, **Progress**, **Journal**, **Lore So Far**, with the active tab in the accent color and an accent underline. The Character tab (only one mocked) shows:
- The character's name large in the display font, with class and level muted on the right.
- A 4 × 2 grid of stat tiles (uppercase label, large value). The character's main stat (INT for an Astrologer) is highlighted with an accent border and accent label.
- An "EQUIPPED" section: a list with dividers, item names on the left and muted detail on the right (+4, Armor, Sorceries).
- A muted footnote: "Updated from your conversations. Tell the companion about changes and it keeps this current."

**Sign-in.** Styled like a game's title screen, on a background with a faint warm glow behind the title that fades darker toward the bottom:
- An emblem, a letter-spaced eyebrow ("YOUR JOURNEY CONTINUES"), the "Game Companion" title in the display font, a diamond-and-rule divider and an italic tagline ("A friend who's played it, along for your run.").
- A card with an accent border and corner brackets holding a "Sign in" heading, uppercase letter-spaced field labels (EMAIL, PASSWORD), the fields, "Keep me signed in on this device", a full-width primary **Enter** button set in the display font, and a centered "Forgot password?" link.
- Below the card: "New here? Begin a new journey".

## Design tokens

Components use semantic tokens only, never raw colors or font names. Each theme supplies a value for every token.

### Color

| Token | Used for | General | Elden Ring |
|-------|----------|---------|------------|
| `bg` | Page background | `#1c1916` | `#12110d` |
| `bg-chrome` | Header and composer bars | `#221e1a` | `#191710` |
| `backdrop` | Dim layer behind the run panel | **TBD** | `#0a0806` |
| `surface` | User bubbles | `#2e2924` | `#2a261c` |
| `surface-input` | Text inputs (on a card, inputs use `bg` instead) | `#2b2621` | `#24211a` |
| `surface-sheet` | Run panel | **TBD** | `#1a1811` |
| `surface-card` | Stat tiles, sign-in card | `#221e19` | `#221f17` |
| `surface-callout` | Inline cards | `#1c1916` | `#1c1910` |
| `border` | Bubbles, inputs, secondary buttons | `#423a32` | `#3f382a` |
| `border-subtle` | Dividers, list rules | `#36302a` | `#3a3426` (lists `#2e2a20`) |
| `border-accent` | Inline cards, highlighted stat, sign-in card | `#5a4b37` | `#5a4a26` |
| `text` | Body text | `#e8dfcc` | `#e6dcc3` |
| `text-strong` | Titles, character name | `#efe6d3` | `#ede3ca` |
| `text-muted` | Subtitles, secondary detail, labels | `#a69b87` | `#a79c82` |
| `text-faint` | Date label, section eyebrows | `#8c8270` | `#8e8470` |
| `accent` | Primary buttons, send, active tab, labels, icons | `#b89462` | `#c9a44c` |
| `accent-bright` | Links, primary button edge | `#d0ae7a` | **TBD** |
| `on-accent` | Text and icons on `accent` | `#1c1916` | `#12110d` |

The two themes share a structure: warm near-black backgrounds, cream text and a gold accent. Elden Ring is darker and cooler with a brighter, more saturated gold; General is browner with a softer tan.

### Typography

| Token | General | Elden Ring |
|-------|---------|------------|
| `font-display` | Spectral 400, 600 and 400 italic, mixed case | Cinzel 400 and 600 (caps only; lowercase renders as small caps) |
| `font-body` | IBM Plex Sans 400, 500, 600 | Same as General |
| Display case | As written ("Vaela's Run", "Companion") | Small caps ("VAELA'S RUN", "COMPANION") |
| Tagline | Display font, italic | **TBD** |

Shared across themes: uppercase, letter-spaced labels for eyebrows, card labels and stat names; body text around 17px with relaxed line height.

### Shape

Shared by both themes: bubbles and cards have a large radius (about 16px); buttons and inputs a medium radius (about 12px); the composer input is fully rounded and the send button circular. Borders are 1px.

### Ornaments

A theme supplies decorative pieces for the slots a layout leaves for them. General's, from the sign-in mock: an emblem above the title, a diamond-and-rule divider under it, and corner brackets on the sign-in card. Elden Ring's are **TBD**; until they're designed it uses General's, recolored by its tokens.

## Theme switching

**Where the theme comes from.** The active theme is resolved in this order:
1. The current run's theme, when viewing a run.
2. The user's default theme, everywhere else (run list, settings) and for runs without their own.
3. **General**, when nothing else applies.

Before sign-in the user isn't known, so the sign-in screen uses the theme from the last session on this device (kept in `localStorage`), falling back to General.

**What the user can do.**
- Pick a default theme in settings.
- Set a theme on a run, or clear it to follow the default.
- When creating a run, the theme defaults to the game's own theme if one exists (an Elden Ring run starts with the Elden Ring theme). The user can change it.

Switching is instant: no reload, no flash of the wrong theme. Any color transition is skipped under `prefers-reduced-motion`.

**How it's built.**
- Each theme is a CSS file that sets the token values as CSS custom properties under a `[data-theme="<id>"]` selector. Theme ids are stable strings such as `general` and `elden-ring`.
- Tailwind v4's `@theme` maps utilities to those variables (`bg-surface`, `text-accent`, `border-border-accent`, `font-display`), so components never know which theme is active.
- Switching themes sets `data-theme` on the root element. Theme-specific behavior beyond tokens (small caps, ornaments) hangs off the same attribute.
- Fonts are self-hosted from `web/src/assets/fonts/` with `@font-face`. Browsers only download a face when it's used, so a theme's fonts cost nothing until that theme is active.
- An unknown or removed theme id falls back to the user's default, then General.

**Accessibility.** Every theme must keep `text`, `text-muted` and `accent` readable against `bg`, `surface` and `surface-callout`, and `on-accent` readable against `accent`. One to watch: `text-faint` on `bg` is about 4.4:1 in General, just under the 4.5:1 guideline for small text. It's only used for short uppercase labels, but nudging it slightly lighter would clear it.

## API needs

Themes are defined in the front end; the backend only stores which one is chosen. When theme switching is specified, these go into `specs/backend-needs.md`:

- Read and update the user's default theme id.
- Read and update a run's theme id (empty means "follow the user's default"), returned with the run.

## Open questions

- **Not yet mocked:** the General run panel, an Elden Ring sign-in, the Progress, Journal and Lore So Far tabs, the run list, settings and theme picker, and hover, focus, disabled, loading and error states. Until then these derive from the tokens above.
- **Sign-in copy:** "Enter" and "Begin a new journey" are written as the app's own wording here, the same for every theme. If themes should be able to change a few strings, that's easy to support for a small, fixed set; it shouldn't extend to general UI text.
- **Light themes:** both themes are dark. If a light theme is ever wanted, the tokens support it, but it hasn't been designed.
