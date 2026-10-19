# Tasks: Theme Foundation

**Spec:** `spec.md` · **Plan:** `plan.md` · **Design:** `web/design/README.md` · All paths are relative to the repo root. All work stays in `web/`.

Each task ends with a local commit naming the feature and task (for example `002-theme-foundation T003: Map theme tokens into Tailwind`). Run commands from `web/`. No new dependencies.

## Phase 1: Setup

- [x] [T001] Create `web/src/theme/themes.ts`: the `themes` registry (`general` / General, `elden-ring` / Elden Ring) `as const`, `ThemeId` derived from it, `isThemeId(value: unknown): value is ThemeId`, and `defaultThemeId = 'general'`. Create `web/src/theme/tokens.ts` exporting the 19 color token names, the other per-theme variables (`font-display`, `font-body`, `tagline-style`) and the FR-4 contrast pairs as data. (FR-1, FR-4, FR-9)

## Phase 2: Foundational — tokens and Tailwind

- [ ] [T002] Create `web/src/styles/themes/general.css` (selector `:root, [data-theme='general']`) and `web/src/styles/themes/elden-ring.css` (`[data-theme='elden-ring']`) defining every `--theme-*` variable from the design doc in 6-digit hex, the font stacks (Spectral / Cinzel for display, IBM Plex Sans for body, with serif and sans-serif fallbacks) and `--theme-tagline-style`. Mark the three FR-3 values `/* provisional: … */`. Add a header comment on each explaining the 6-digit hex rule. (FR-1, FR-2, FR-3)
- [ ] [T003] In `web/src/styles/index.css`: import `general.css` then `elden-ring.css` (with a comment on why order matters); add `@theme inline` that clears `--color-*` and maps every color token, `--font-sans` and `--font-display` to the `--theme-*` variables; add shared `--radius-md`, `--radius-lg`, `--text-body` (with line height) and `--text-label`; add the `label-caps` and `tagline` `@utility` rules; add `@layer base` styles for `body` (`bg-bg text-text font-sans text-body`) and a visible `:focus-visible` outline in `accent`. Confirm `npm run build` passes and the built CSS contains `var(--theme-bg)`. (FR-5, FR-7, FR-8)
- [ ] [T004] Create `web/src/theme/tokens.test.ts`: import both theme files with `?raw`, extract `--theme-*` declarations, and assert every theme defines every token in `tokens.ts` and every FR-4 pair reaches 4.5:1 (WCAG relative luminance), failing with theme, pair and ratio. If `?raw` CSS imports don't work under the Tailwind plugin, read the files with `node:fs` instead. (FR-1, FR-4, FR-19, SC-2, SC-3)

## Phase 3: User Story — Theme follows the run, user and device (scenarios 3, 4, 5)

- [ ] [T005] Create `web/src/theme/resolveTheme.ts` (first valid id among run, user, last used; else `defaultThemeId`) and `web/src/theme/resolveTheme.test.ts` covering each step of the order and an invalid id at each step. (FR-10, FR-19)
- [ ] [T006] Create `web/src/theme/storage.ts` (`themeStorageKey = 'game-companion.theme'`, `readLastTheme`, `writeLastTheme`, both swallowing storage errors) and `web/src/theme/storage.test.ts` covering read/write and a `localStorage` that throws. (FR-12, FR-19)
- [ ] [T007] Create `web/src/theme/ThemeProvider.tsx`: provider with `runThemeId?` / `userThemeId?` props, `deviceThemeId` state initialized from `readLastTheme()`, context `{ themeId, setThemeId }`, a `useLayoutEffect` that sets `data-theme` on `<html>` and calls `writeLastTheme`, and a `useTheme()` hook that throws outside the provider. Update `web/src/test/setup.ts` to clear `localStorage` and remove `data-theme` after each test. Create `web/src/theme/ThemeProvider.test.tsx`: sets `data-theme` from the resolved theme; run theme beats user theme beats device; `setThemeId` updates the attribute and storage; works when storage throws. (FR-11, FR-12, FR-19)
- [ ] [T008] Wrap the app in `<ThemeProvider>` (inside `QueryClientProvider`) in `web/src/main.tsx`. Replace `renderWithQuery` with `renderWithProviders` in `web/src/test/render.tsx` (both providers, fresh query client) and update `web/src/App.test.tsx` to use it. (FR-11)
- [ ] [T009] Add the inline theme script to the top of `<head>` in `web/index.html` (reads `game-companion.theme`, sets `data-theme`, ignores errors). Add a test (in `web/src/theme/storage.test.ts`) that imports `../../index.html?raw` and asserts it contains `themeStorageKey`. (FR-13)

## Phase 4: User Story — Style once, get every theme (scenarios 1, 6)

- [ ] [T010] Create `web/src/components/icons.tsx` (back chevron, menu, journal, eye-off, arrow-up, check; inline SVG, `currentColor`, `aria-hidden`) and `web/src/components/Button.tsx` (`variant: 'primary' | 'secondary'`, theme utilities only). (FR-5, FR-6)
- [ ] [T011] Create `web/src/components/ornaments/Emblem.tsx`, `DiamondRule.tsx` and `CornerBrackets.tsx`: inline SVG redrawn from `web/design/general-sign-in-title-screen.png`, `stroke="currentColor"`, colored with `text-accent` / `text-border-accent`, `aria-hidden="true"`, `focusable="false"`, scaled by `viewBox`. (FR-15)
- [ ] [T012] Create `web/src/styles/noRawValues.test.ts`: load every `.tsx` under `src/` via `import.meta.glob` with `?raw` and fail, naming the file, on hex colors, `rgb(`, `hsl(`, `Spectral`, `Cinzel` or `IBM Plex`. (FR-6, SC-4)

## Phase 5: User Story — Switch themes and compare with the mocks (scenarios 2, 6)

- [ ] [T013] Move the ping `useQuery` from `web/src/App.tsx` into `web/src/preview/ApiStatus.tsx` as one muted line with the same three states and `role="alert"` on error. (FR-18)
- [ ] [T014] Create `web/src/preview/ThemeSwitcher.tsx`: `<fieldset>` with `<legend>Theme</legend>` and a native radio per registered theme, checked from `useTheme().themeId`, calling `setThemeId` on change. (FR-17)
- [ ] [T015] Create `web/src/preview/ThemePreview.tsx` with the sample content from the mocks as constants and, in mock order, the run header, conversation (date label, user bubble, companion message, run journal card, quick reply, spoiler card), composer, run panel section on `bg-surface-sheet` (name, stat tiles with INT highlighted, equipped list with `border-border-list`, footnote) and the sign-in card with ornaments, eyebrow, title, divider, tagline, labeled inputs, checkbox, primary button and link. Single centered column about 24rem wide, `ThemeSwitcher` at the top, `ApiStatus` at the bottom. `text-text-faint` only on the page background. Make `web/src/App.tsx` render `<ThemePreview />`. (FR-16, FR-4)
- [ ] [T016] Create `web/src/preview/ThemePreview.test.tsx`: switching to Elden Ring via the radio found by its label sets `data-theme="elden-ring"` on `<html>` and checks that radio; the main sections render (run title, both inline card labels, sign-in button). Update `web/src/App.test.tsx` so the ping tests find the status line on the new page. (FR-17, FR-18, FR-19, SC-5)

## Phase 6: Polish and verification

- [ ] [T017] Verify: `npm run build`, `npm run lint`, `npm test` pass (SC-1–SC-4); built CSS contains rules for both `[data-theme='elden-ring']` and `:root`; `git status` shows changes only under `web/` and `specs/002-theme-foundation/` (SC-9). With `npm run build && npm run preview` in a browser: switching changes the page background (SC-5); Elden Ring survives a reload with no General flash (SC-6); with site data blocked the page loads in General and switching works (SC-7). Fix anything that fails.
- [ ] [T018] Manual check for the developer (SC-8): compare the preview with the mocks in `web/design/` in both themes (colors, fonts, case, structure, ornaments). Report as a step for the developer to confirm.

## Dependencies

- T001 → T002 → T003 → T004.
- T005, T006 depend on T001. T007 depends on T005, T006. T008 depends on T007. T009 depends on T006.
- T010, T011 depend on T003. T012 depends on T010, T011 (so it has files to scan; it passes vacuously otherwise).
- T013 depends on T008. T014 depends on T007. T015 depends on T010, T011, T013, T014. T016 depends on T015.
- T017 depends on all prior tasks; T018 last.
