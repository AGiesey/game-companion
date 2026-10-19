# Feature: Theme Foundation

**Feature directory:** `specs/002-theme-foundation`
**Status:** Draft
**Design source:** `web/design/README.md` and the mocks in `web/design/`

## Overview

Turn the design doc into a working theme system: the design tokens, the **General** and **Elden Ring** themes, Tailwind utilities that read from the active theme, the fonts, the ornaments, and the mechanics for choosing and switching themes. A theme preview page replaces the current ping screen so the themes can be compared against the mocks.

Choosing a default theme in settings, setting a theme on a run, and saving either to the backend are out of scope. Those screens don't exist yet; they arrive with the settings and run features, which will add the matching backend needs.

## Users

- **The developer**, building later features: styles components with theme-aware utilities and never touches raw colors or font names.
- **The player** (on the preview page for now): sees the app in a theme and can switch between themes.

## User Scenarios

1. **Style a component once, get every theme.** The developer writes `bg-surface text-text border-border` and the component looks right in General and Elden Ring with no theme-specific code.
2. **Switch themes instantly.** On the preview page, the player picks Elden Ring; every color, the display font and the ornaments change at once, with no reload and no flash of the previous theme.
3. **Theme follows the run.** When something sets a run theme, it wins; when the run has none, the user's default theme applies; when neither is set, General applies.
4. **Return to the last theme.** The player reloads the page (or opens the app signed out) and sees the theme they last used on this device from the first paint, not General first and then a switch.
5. **Survive a bad theme id.** A stored or supplied theme id that doesn't exist (for example a removed theme) falls back to the next source in the order, and finally to General, without an error.
6. **Compare against the mocks.** The developer opens the preview page, switches between themes and checks the run header, conversation, inline card, buttons, input, composer, stat tiles, sign-in card and ornaments against `web/design/`.

## Functional Requirements

### Tokens and themes

- **FR-1 Token set.** The app defines every token in the design doc's Design tokens section as a CSS custom property: the 19 color tokens (`bg`, `bg-chrome`, `backdrop`, `surface`, `surface-input`, `surface-sheet`, `surface-card`, `surface-callout`, `border`, `border-subtle`, `border-list`, `border-accent`, `text`, `text-strong`, `text-muted`, `text-faint`, `accent`, `accent-bright`, `on-accent`), the two font tokens (`font-display`, `font-body`), and the shared radius tokens (large, medium, full).
  - `border-list` is the separate list-divider value the design doc gives for Elden Ring (`#2e2a20`); in General it equals `border-subtle`.
- **FR-2 General and Elden Ring.** Each theme supplies a value for every token, using the design doc's values exactly. A theme is applied by a `data-theme="<id>"` attribute on the root `<html>` element; ids are `general` and `elden-ring`.
- **FR-3 Values the mocks don't show.** Where the design doc marks a value **TBD**, the theme uses a value already present in the design, never a new one, and the code marks it provisional:
  - General `backdrop`: `#141210`, the darkest tone of the General sign-in background.
  - General `surface-sheet`: General `surface-card` (`#221e19`).
  - Elden Ring `accent-bright`: Elden Ring `accent` (`#c9a44c`).
- **FR-4 Contrast.** In every theme, at least 4.5:1 for:
  - `text`, `text-strong`, `text-muted` and `accent` against `bg`, `bg-chrome`, `surface`, `surface-card` and `surface-callout`;
  - `text-faint` against `bg` only. It measures 3.8–4.45:1 on the raised surfaces in both themes, so it is used only on the page background, as in the mocks (date label, section eyebrows); labels on raised surfaces use `text-muted`;
  - `on-accent` against `accent`.

  All of these pass with the design doc's values. If a later token change fails one, it is reported to the developer rather than silently changed.

### Tailwind and fonts

- **FR-5 Theme-aware utilities.** Tailwind utilities read the tokens, so `bg-bg`, `bg-surface`, `text-text-muted`, `border-border-accent`, `text-accent`, `bg-accent`, `text-on-accent`, `font-display`, `font-body`, `rounded-lg`/`rounded-md`/`rounded-full` (or equivalent names) resolve to the active theme's values at runtime.
- **FR-6 No raw values in components.** Components use the theme utilities only. No hex colors, `rgb()` values or font family names appear in component files.
- **FR-7 Fonts.** Body text uses `font-body` (IBM Plex Sans) in every theme. Display text uses `font-display`: Spectral in General and Cinzel in Elden Ring. The page `<body>` uses the theme's `bg`, `text` and `font-body`.
- **FR-8 Shared text styles.** Reusable styles exist for the recurring patterns in the design doc: the uppercase letter-spaced label (date label, card labels, stat names, section eyebrows) and the italic tagline. Elden Ring's tagline is not italic, since Cinzel has no italic.

### Choosing the theme

- **FR-9 Theme registry.** A single list of themes (id and display name) drives everything that needs to know which themes exist. Unknown ids are detectable with a type guard.
- **FR-10 Resolution order.** The active theme is the first valid id among: the run theme, the user's default theme, the last theme used on this device, and finally `general`. Resolution is a pure function with unit tests for every step of the order, including invalid ids at each step.
- **FR-11 ThemeProvider.** A provider at the root of the app resolves the active theme from its inputs, sets `data-theme` on `<html>` whenever it changes, and exposes the active theme and a way to change it to components through a hook. The run theme and user default are inputs that later features will supply; in this feature they come from the preview page.
- **FR-12 Last used on this device.** The active theme id is saved to `localStorage` whenever it changes and read on startup. Storage that is unavailable or throws (private browsing, blocked storage) is ignored without breaking the app.
- **FR-13 No flash on load.** The saved theme is applied before the first paint, so a reload shows the last theme immediately. This works with JavaScript-rendered React, before the bundle has loaded.
- **FR-14 Reduced motion.** If switching themes animates colors, the animation is skipped when the user prefers reduced motion.

### Ornaments

- **FR-15 Ornament components.** The three General ornaments from the sign-in mock are reusable components: the emblem, the diamond-and-rule divider and the card corner brackets. They draw in theme colors (accent and `border-accent`), are decorative (hidden from assistive technology), and scale cleanly. Elden Ring uses the same ornaments in its own colors until it has its own.

### Theme preview page

- **FR-16 Preview page.** The app's start page becomes a theme preview showing, in the active theme, built from the theme utilities and matching the mocks' structure:
  - the run header (back button, run title, subtitle, menu button);
  - the conversation date label, a user bubble, a companion message with its label;
  - both inline cards (run journal save with two secondary buttons; spoiler gate with primary and secondary buttons);
  - the composer (pill input and circular send button);
  - a row of stat tiles with one highlighted, and an equipped list with dividers;
  - the sign-in card with its ornaments, eyebrow, title, tagline, labeled inputs, checkbox and primary button.
  The sample content (Vaela, Rennala and so on) is static and lives in the preview, not in the API layer.
- **FR-17 Theme switcher.** The preview page has a theme switcher listing every registered theme. It is a labeled, keyboard-operable control (for example a radio group or select), and the current theme is indicated accessibly. Switching updates the whole page.
- **FR-18 API status kept.** The ping check from the front-end foundation stays on the page as a small status line, so the existing API pattern is still exercised.

### Tests

- **FR-19 Tests.** Tests cover:
  - theme resolution (every step of the order and every fallback);
  - the provider setting `data-theme` and saving to storage, and tolerating storage that throws;
  - the preview's switcher changing the active theme, found by its accessible label;
  - contrast: every pair in FR-4 checked against each theme's token values, failing with the theme, token pair and ratio;
  - the existing App ping tests, updated for the new page.

## API Needs

None. Saving the user's default theme and a run's theme are recorded in the design doc and will be added to `specs/backend-needs.md` by the settings and run features that need them.

## Out of Scope

- Settings screen, run theme picker and any persistence beyond `localStorage`.
- Real screens (sign-in, conversation, run panel); the preview only shows their parts.
- Theme-specific wording, light themes, wider layouts, and the states the mocks don't show (hover, focus, disabled, loading, error) beyond sensible defaults from the tokens. Keyboard focus is still visible on every interactive element.

## Defaults Chosen

- Display and body sizes, spacing and weights follow the mocks by eye at phone width (body around 17px); exact numbers are a plan decision.
- Theme switching is instant, with no color transition. FR-14 applies if one is added later.
- The theme switcher is a native `<select>` or radio group; no custom dropdown.
- The preview's sample content is in English and hard-coded.

## Success Criteria

- **SC-1** `npm run build`, `npm run lint` and `npm test` pass.
- **SC-2** Every token in FR-1 is defined for both themes; a test fails if a theme is missing any token.
- **SC-3** Every FR-4 contrast pair passes in both themes, checked by an automated test.
- **SC-4** No hex, `rgb(`/`hsl(` color or font family name appears in `.tsx` files under `web/src/`.
- **SC-5** Switching themes on the preview page changes `data-theme` on `<html>` and the computed background of `<body>`, with no reload.
- **SC-6** After choosing Elden Ring and reloading, the first paint is in Elden Ring (no General flash).
- **SC-7** With `localStorage` unavailable, the page loads in General and switching still works for the session.
- **SC-8** Side by side with the mocks, the preview's components match in colors, fonts, case and structure in both themes. Manual check by the developer.
- **SC-9** Nothing outside `web/` and this feature's spec folder changes.
