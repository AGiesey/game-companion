# Plan: Theme Foundation

**Spec:** `specs/002-theme-foundation/spec.md`
**Design source:** `web/design/README.md`
**Constitution:** 1.0.0. Work stays in `web/` (I). No API needs (II, III). Values come from the design doc only (IV). Accessible defaults (V). Vitest and Testing Library (VI).

## Technical Context

Builds on 001-frontend-foundation: Tailwind 4.3 (CSS-first, `src/styles/index.css`), Vitest 5 with jsdom, TanStack Query, `src/api/`. Fonts are already declared in `src/styles/fonts.css`. No new dependencies.

## Design Decisions

### Two layers of CSS variables

Tailwind v4 generates utilities from variables declared in `@theme`. Those are fixed at build time, but our values must change at runtime with `data-theme`. So there are two layers:

1. **Theme variables** (`--theme-*`), one set per theme, switched by `data-theme`:
   ```css
   /* src/styles/themes/elden-ring.css */
   [data-theme='elden-ring'] {
     --theme-bg: #12110d;
     --theme-font-display: 'Cinzel', serif;
     /* … */
   }
   ```
   General's file uses the selector `:root, [data-theme='general']`, so General applies when no attribute is set or the attribute names an unknown theme. That is the CSS half of the fallback (spec scenario 5).

   `:root` and `[data-theme='elden-ring']` have equal specificity and both match `<html>`, so the later rule wins. `index.css` therefore imports `general.css` first and every other theme after it, with a comment saying so.

2. **Tailwind tokens** that point at them, declared with `@theme inline` in `index.css`:
   ```css
   @theme inline {
     --color-*: initial;            /* drop Tailwind's default palette */
     --color-bg: var(--theme-bg);
     --color-surface: var(--theme-surface);
     /* … one per color token … */
     --font-sans: var(--theme-font-body);
     --font-display: var(--theme-font-display);
   }
   ```
   `inline` makes each utility use the `var(--theme-…)` reference directly (`.bg-bg { background-color: var(--theme-bg) }`), so it resolves against whatever `data-theme` is active. Without `inline`, utilities would reference `--color-bg`, which is resolved once at `:root` and wouldn't follow a `data-theme` on `<html>` reliably.

   Clearing `--color-*` removes Tailwind's built-in palette (`bg-red-500` and so on), so the only colors available are the theme's (FR-6). Pointing `--font-sans` at the body font makes it Tailwind's default family, which its base styles apply to `<html>`.

**Utility names** that result: `bg-bg`, `bg-bg-chrome`, `bg-backdrop`, `bg-surface`, `bg-surface-input`, `bg-surface-sheet`, `bg-surface-card`, `bg-surface-callout`, `border-border`, `border-border-subtle`, `border-border-list`, `border-border-accent`, `text-text`, `text-text-strong`, `text-text-muted`, `text-text-faint`, `text-accent`, `bg-accent`, `text-accent-bright`, `text-on-accent`, `font-display`, `font-sans`. The doubled words (`border-border`, `text-text`) come from keeping the design doc's token names; they're accepted for consistency with the doc.

### Shared, non-color tokens

Declared once in `@theme` (not per theme), since the design doc says both themes share them:
- Radius: `--radius-md: 0.75rem` (12px, buttons and inputs), `--radius-lg: 1rem` (16px, bubbles and cards). `rounded-full` is built in.
- Text sizes: `--text-body: 1.0625rem` with line height 1.6 (body, about 17px); `--text-label: 0.8125rem` (13px labels). Headings use Tailwind's default scale.

Per-theme, non-color variables live with the theme:
- `--theme-tagline-style`: `italic` in General, `normal` in Elden Ring (Cinzel has no italic).

### Shared text styles (FR-8)

Custom utilities in `index.css`:
```css
@utility label-caps {
  font-size: var(--text-label);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
@utility tagline {
  font-family: var(--theme-font-display);
  font-style: var(--theme-tagline-style);
}
```

### Base styles

In `index.css`, `@layer base` gives `body` `bg-bg text-text font-sans text-body` and gives every focusable element a visible `:focus-visible` outline in `accent` (constitution V, spec out-of-scope note on focus).

### Provisional values (FR-3)

Each is marked in its theme file with `/* provisional: <reason> (web/design/README.md TBD) */`:
- General `--theme-backdrop: #141210`
- General `--theme-surface-sheet: #221e19`
- Elden Ring `--theme-accent-bright: #c9a44c`

### Theme module (`src/theme/`)

```
src/theme/
  themes.ts               registry, ThemeId, isThemeId
  resolveTheme.ts         pure resolution (FR-10)
  resolveTheme.test.ts
  storage.ts              last-used theme in localStorage (FR-12)
  storage.test.ts
  ThemeProvider.tsx       provider + useTheme hook (FR-11)
  ThemeProvider.test.tsx
  tokens.ts               token names and contrast pairs, shared by tests
  tokens.test.ts          completeness and contrast (FR-1, FR-4)
```

- **`themes.ts`**: `export const themes = [{ id: 'general', name: 'General' }, { id: 'elden-ring', name: 'Elden Ring' }] as const`. `ThemeId` is derived from it (`(typeof themes)[number]['id']`), so adding a theme updates the type. `isThemeId(value: unknown): value is ThemeId`. `defaultThemeId = 'general'`.
- **`resolveTheme({ runThemeId, userThemeId, lastUsedThemeId })`** returns the first input that passes `isThemeId`, else `defaultThemeId`. Inputs are `string | null | undefined`, since they'll come from API data and storage.
- **`storage.ts`**: `themeStorageKey = 'game-companion.theme'`; `readLastTheme(): string | null` and `writeLastTheme(id)`. Both wrap `localStorage` access in `try/catch` and do nothing on failure.
- **`ThemeProvider`** props: `runThemeId?`, `userThemeId?`, `children`. Internal state `deviceThemeId`, initialized from `readLastTheme()`. The context value is `{ themeId, setThemeId }`:
  - `themeId` = `resolveTheme({ runThemeId, userThemeId, lastUsedThemeId: deviceThemeId })`.
  - `setThemeId(id)` sets `deviceThemeId`. It's the "this device" choice; a run or user theme passed in still takes precedence. Later features pass `runThemeId` and `userThemeId` from API data.
  - A `useLayoutEffect` sets `document.documentElement.dataset.theme = themeId` (before paint, so no flash between React commits) and calls `writeLastTheme(themeId)`.
- **`useTheme()`** reads the context and throws a clear error if used outside the provider.

### No flash on load (FR-13)

A small classic (non-module) script at the top of `<head>` in `web/index.html`, which runs before CSS and the bundle:
```html
<script>
  try {
    var t = localStorage.getItem('game-companion.theme')
    if (t) document.documentElement.dataset.theme = t
  } catch (e) {}
</script>
```
It doesn't validate the id: an unknown id matches no theme selector, so the `:root` General values apply, and the provider corrects the attribute once React starts. It duplicates the storage key; a test reads `index.html` (via Vite's `?raw` import) and asserts it contains `themeStorageKey`, so the two can't drift.

In production, Vite emits the CSS as a `<link>` in `<head>`, so the first paint is already themed. In `npm run dev`, Vite injects CSS from JavaScript, so a brief unstyled flash in dev is expected and not covered by SC-6, which is checked against `npm run build` + `npm run preview`.

### Tokens and contrast tests (FR-1, FR-4, SC-2, SC-3)

- `tokens.ts` exports the 19 color token names, the other per-theme variables (`font-display`, `font-body`, `tagline-style`) and the FR-4 contrast pairs as data.
- `tokens.test.ts` imports each theme file with `?raw` (for example `import eldenRing from '../styles/themes/elden-ring.css?raw'`), extracts `--theme-<name>: <value>;` declarations with a regex, and checks:
  - every theme defines every token;
  - every FR-4 pair reaches 4.5:1 using the WCAG relative-luminance formula, failing with a message like `elden-ring: text-faint on surface is 4.08:1 (needs 4.5)`.
- Theme files must therefore use 6-digit hex for colors (documented in a comment at the top of each).

### Guard against raw values (FR-6, SC-4)

`src/styles/noRawValues.test.ts` loads every `.tsx` file under `src/` with `import.meta.glob('../**/*.tsx', { query: '?raw', import: 'default', eager: true })` and fails if any contains a hex color, `rgb(`, `hsl(`, or the font names `Spectral`, `Cinzel` or `IBM Plex`, naming the file.

### Ornaments (FR-15)

`src/components/ornaments/` with `Emblem.tsx`, `DiamondRule.tsx` and `CornerBrackets.tsx`:
- Inline SVG with `stroke="currentColor"`, colored by utility classes (`text-accent`, `text-border-accent`), redrawn from the mock: the emblem is two concentric circles with four tick marks and a four-point star; the rule is two lines with a diamond between; the brackets are four L-shaped corners placed absolutely on a `relative` card.
- `aria-hidden="true"` and `focusable="false"`; sized with `viewBox` so they scale.

### Shared components

Only what the preview needs more than once, kept small:
- `src/components/Button.tsx`: `variant: 'primary' | 'secondary'`. Primary is `bg-accent text-on-accent`; secondary is `border border-border text-text`. Both `rounded-md`, full width in cards.
- `src/components/icons.tsx`: back chevron, menu, journal, eye-off, arrow-up and check, as inline SVG with `aria-hidden`. Buttons that only show an icon get an `aria-label`.

Everything else (bubble, inline card, stat tile, run header, composer) stays inside the preview for now. The conversation and run panel features will decide their real component shape.

### Preview page (FR-16 to FR-18)

```
src/preview/
  ThemePreview.tsx        page layout, sections in mock order
  ThemeSwitcher.tsx       radio group
  ThemePreview.test.tsx
  ApiStatus.tsx           the ping line, moved out of App.tsx
```

- **Layout:** a single column, max width about 24rem (390pt) and centered, so it reads like the phone mocks on a desktop browser. Sections, each with a small `label-caps text-text-faint` heading: run header; conversation (date label, user bubble, companion message, run journal card, quick reply bubble, spoiler card); composer; run panel (character name, stat tiles with INT highlighted, equipped list, footnote) on `bg-surface-sheet`; sign-in card with ornaments.
- **`ThemeSwitcher`:** a `<fieldset>` with `<legend>Theme</legend>` and one native radio per registered theme, labeled with the theme's name; checked follows `useTheme().themeId`, and changing it calls `setThemeId`. Native radios give keyboard support (arrow keys) and announce the checked state.
- **Sample content:** constants at the top of `ThemePreview.tsx`, taken from the mocks.
- **`ApiStatus`:** the existing `useQuery` ping, rendered as one muted line at the bottom of the page. Same three states, same `role="alert"` on error.
- **`App.tsx`** renders `<ThemePreview />` (which includes `<ApiStatus />`).

### Wiring

- `main.tsx` wraps the app in `<ThemeProvider>` inside `<QueryClientProvider>`.
- `src/test/render.tsx`: `renderWithQuery` becomes `renderWithProviders`, wrapping both providers (fresh query client each time). The existing App tests are updated to use it.
- Test setup clears `localStorage` and removes `data-theme` from `<html>` after each test.

## File Changes

| Path | Change |
|------|--------|
| `web/index.html` | Inline theme script in `<head>` |
| `web/src/styles/index.css` | `@theme inline` mapping, shared tokens, `@utility` styles, base layer; imports the theme files |
| `web/src/styles/themes/general.css`, `elden-ring.css` | New |
| `web/src/styles/noRawValues.test.ts` | New |
| `web/src/theme/*` | New (see above) |
| `web/src/components/Button.tsx`, `icons.tsx`, `ornaments/*` | New |
| `web/src/preview/*` | New |
| `web/src/App.tsx`, `web/src/App.test.tsx` | Render the preview; tests move to `renderWithProviders` |
| `web/src/main.tsx` | Add `ThemeProvider` |
| `web/src/test/render.tsx`, `web/src/test/setup.ts` | Providers helper; storage and attribute cleanup |
| `web/design/README.md` | Already updated during specify (contrast note, `border-list`) |

## Verification

1. `npm run build`, `npm run lint`, `npm test` pass (SC-1); token, contrast and raw-value tests among them (SC-2, SC-3, SC-4).
2. A test switches theme through the switcher and checks `data-theme` on `<html>` (SC-5, automated half). jsdom doesn't compute styles from Tailwind, so the background change is checked in the browser.
3. With `npm run build && npm run preview`: pick Elden Ring, reload, confirm no General flash (SC-6); block site data in the browser and reload, confirm General and switching still work (SC-7). Manual, with the Claude in Chrome tools if available.
4. Developer compares the preview with the mocks in both themes (SC-8).
5. `git status` shows changes only under `web/` and `specs/002-theme-foundation/` (SC-9).

## Risks

- **`@theme inline` with `--color-*: initial`** also removes `white`, `black` and the built-in neutral colors. That's intended, but any third-party Tailwind-styled component added later would need theme colors. `transparent` and `currentColor` still work.
- **Ornament artwork** is redrawn by eye from a PNG, so it will be close rather than identical. SC-8 is where the developer judges it.
- **`?raw` CSS imports in tests** depend on Vite's handling of query imports in Vitest; if Tailwind's plugin tries to process them, the test can read the files with `node:fs` instead.
