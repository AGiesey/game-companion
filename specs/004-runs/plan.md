# Plan: Runs

**Spec:** `specs/004-runs/spec.md`
**Design source:** `web/design/README.md` (Themes and games, Run header, Theme switching). The run list and create-run screens aren't mocked: they reuse the tokens, `Button`, `TextField` and the Equipped list's divider pattern, and invent nothing visually.
**Constitution:** 1.0.0. Front end only (I). Every run call is a stub behind `web/src/api/runs.ts` (II). The four needs are tracked in `specs/backend-needs.md` (III). Screens reuse existing design pieces (IV). Accessible forms, lists and headings (V). Vitest and Testing Library (VI).

## Technical Context

Builds on 002 (themes, `ThemeProvider`, `resolveTheme`, ornaments, `ThemePreview`) and 003 (React Router in declarative mode, `RequireSession`, the session query, `endSession`, form error handling, `FullPageLoading`). The account endpoints are now real; tests use `src/test/fakeAccountServer.ts` through `vi.mock` in `setup.ts`.

**No new dependencies.** Relative times use `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`. Page titles use React 19's built-in `<title>` support: a `<title>` rendered anywhere in the tree is hoisted into `<head>`, so no helmet library or `document.title` effect is needed.

## Design Decisions

### Theme sources from inside the routes

Today `ThemeProvider` takes `runThemeId` and `userThemeId` as props, but it sits above the router in `main.tsx`, so routes can't pass them. Routes need to set them:

- The run screen sets the run theme (FR-19).
- The create-run screen sets the run theme to the picked game's theme (FR-15).
- Signed-in screens set the user theme to the player's default (FR-7, Defaults).

**Change:** `ThemeProvider` also keeps `runThemeId` and `userThemeId` in state, set through a second context, `ThemeSourcesContext`. Two hooks in `src/theme/useThemeSources.ts` set them while the calling component is mounted:

```ts
useRunTheme(themeId: string | null | undefined)   // sets the run theme; clears it on unmount
useUserTheme(themeId: string | null | undefined)  // same for the user theme
```

- Each is a `useLayoutEffect` that sets the value and returns a cleanup that clears it. Layout effects run before paint, so a screen never paints in the previous screen's theme. When one screen replaces another in a single commit (create run → run screen), the old cleanup and the new setter run in that commit, so there's no General frame between two Elden Ring screens.
- The existing props stay and take precedence over the context values (`props.runThemeId ?? state.runThemeId`), so `ThemeProvider.test.tsx` and any preview use keep working.
- `resolveTheme` doesn't change. Invalid ids are already skipped, which covers a run whose theme was removed (FR-19).

**Player default:** `src/theme/themes.ts` gains `playerDefaultThemeId: ThemeId = 'general'`, commented as the stand-in until settings supply the real default. `RequireSession` calls `useUserTheme(session.data ? playerDefaultThemeId : null)` before its early returns, so every signed-in screen uses it and the sign-in screens keep the device's last theme.

### Games

`src/games/games.ts`, shaped like `themes.ts`:

```ts
export const games = [{ id: 'elden-ring', name: 'Elden Ring', themeId: 'elden-ring' }] as const satisfies readonly Game[]
export type GameId = (typeof games)[number]['id']
export function isGameId(value: unknown): value is GameId
export function gameName(gameId: string): string  // "Unknown game" for unregistered ids (FR-18)
export function gameThemeId(gameId: string): ThemeId | null
```

`Game.themeId` is `ThemeId | null`, so a future game without its own theme is just `null`.

### API layer

**`src/api/runs.ts`**: one function per need, each `// STUB: <need> (specs/backend-needs.md)`, delegating to the stub server.

```ts
export interface Run {
  id: string
  name: string
  gameId: string            // string, not GameId: the API may return games this build doesn't know
  themeId: string | null    // null means "follow the player's default"
  createdAt: string         // ISO 8601
  lastOpenedAt: string | null
}
```

| Function | Need |
|----------|------|
| `listRuns({ signal })` → `Run[]` | List the player's runs, most recently opened first |
| `createRun({ name, gameId, themeId })` → `Run` | Create a run |
| `getRun(runId, { signal })` → `Run` | Get one run |
| `recordRunOpened(runId)` → `void` | Record that the player opened a run |

**`src/api/stubs/runStub.ts`**: an in-browser fake run store, imported only by `runs.ts` (SC-7).
- **Whose runs:** each operation first calls `getSession()` from `account.ts`, the real endpoint (or the fake in tests), and throws a `401` `ApiError` if nobody is signed in. This keeps the functions' signatures what the real endpoints will need (the cookie identifies the player) while keeping runs separate per account (FR-24).
- **Storage:** `localStorage` key `game-companion.stub.runs`, holding `Record<userId, Run[]>`. Every account starts with none. Reads and writes are in `try/catch` with an in-memory fallback, as the fake account server does.
- **Ordering:** `lastOpenedAt ?? createdAt`, newest first (FR-5).
- **Failures**, as `ApiError`s a real backend would send:
  - blank name, name over 60 characters, unknown game: `400` validation ProblemDetails with `errors.Name` / `errors.GameId`
  - run missing or another player's: `404`, title "Run not found"
- **Ids** from `crypto.randomUUID()`; times from `new Date().toISOString()`.
- Every operation goes through `stub()` for delay and cancellation.
- Exports `seedStubRuns(userId, runs)` and `resetRunStubMemory()` for tests only.

The `400` keys are PascalCase, as ASP.NET sends them; `fieldErrorsFrom` already matches ignoring case.

### Queries

`src/runs/runQueries.ts`:

- `runsQueryKey = ['runs']`, `runQueryKey(runId) = ['runs', runId]`. Both sit under `'runs'`, so `endSession` clears them on sign-out or a `401` with no change.
- `useRuns()`: `useQuery` on `listRuns`.
- `useRun(runId)`: `useQuery` on `getRun`. The `404` isn't retried (existing `shouldRetry`).
- `useCreateRun()`: `useMutation` on `createRun`. `onSuccess` puts the run into `runQueryKey(run.id)` with `setQueryData`, so the run screen renders without a loading state, and invalidates `runsQueryKey`.
- `useRecordRunOpened(run)`: see below.

### Recording an opened run (FR-5, FR-6)

`RunPage` calls `useRecordRunOpened(runId, run.isSuccess)`:

- A `useEffect` fires the `recordRunOpened` mutation once the run has loaded, so a not-found run isn't recorded.
- "Once per arrival" is keyed on `location.key` from React Router. The hook keeps the last recorded `runId` + `location.key` in a ref and skips a repeat. That covers re-renders and refetches, and StrictMode's development-only double effect run (React keeps refs across it). Coming back to the run later is a new history entry with a new key, so it records again.
- `onSuccess` invalidates `runsQueryKey`, so the list and the next landing see the new order. Errors are swallowed: no `onError` UI. A `401` is still handled globally.

### Routes

```
<Route element={<RequireSession />}>
  <Route path="/" element={<LandingPage />} />
  <Route path="/runs" element={<RunListPage />} />
  <Route path="/runs/new" element={<NewRunPage />} />
  <Route path="/runs/:runId" element={<RunPage />} />
</Route>
```

`/runs/new` is a static segment, so React Router ranks it above `/runs/:runId`. `src/home/` is deleted (FR-4).

**`LandingPage`** (FR-2): `useRuns()`. Pending → `<FullPageLoading />`. Error → `<Navigate to="/runs" replace />`. Data → `<Navigate to={runs[0] ? `/runs/${runs[0].id}` : '/runs'} replace />`. `replace` keeps `/` out of history. The list prefetched here is reused by the run list.

**Sign-in return path** (FR-3): unchanged. `RequireSignedOut` already sends the player to the return path or `/`.

### Screens

```
src/runs/
  LandingPage.tsx
  RunListPage.tsx       heading, list or empty state, New run, Sign out
  RunListItem.tsx       one row: a Link covering the row
  NewRunPage.tsx        name, game radio group, Start run, Cancel
  RunPage.tsx           RunHeader + placeholder note; loading, not found, error
  RunHeader.tsx         extracted from ThemePreview
  RunNotFound.tsx
  runQueries.ts
  useRecordRunOpened.ts
  formatLastOpened.ts   + formatLastOpened.test.ts
  validation.ts         + validation.test.ts
```

All screens use the existing page frame (`mx-auto max-w-sm px-4`) and set their `<title>` (FR-22).

**`RunListPage`** (FR-7 to FR-11)
- `<h1>` "Your runs" (display font, `text-text-strong`).
- The list is a `<ul>` with dividers in `border-list`, like the Equipped list. Each `RunListItem` is an `<li>` holding one `<Link to={`/runs/${id}`}>` with block display and padding, so the whole row is the link. Inside it: the name in the display font (`text-text-strong`) and a muted line, "Elden Ring · Opened 3 days ago". So the link's accessible name is just the run's name, the link has `aria-labelledby` pointing at the name's id and `aria-describedby` pointing at the muted line. Tests find links by the run's name (FR-9).
- The time is a `<time dateTime={iso}>`.
- Loading: a `role="status"` "Loading your runs…" in place of the list. Error: `FormError`-style alert with `error.message` and a **Try again** `Button` that calls `refetch()`.
- Empty: a `<p>` "No runs yet. Start one when you begin a game." (`text-text-muted`) in place of the list.
- **New run** is a `<Link to="/runs/new">` styled as the primary button, and **Sign out** is a secondary `Button` using `useSignOut()`, at the bottom.

**Link styled as a button.** `Button.tsx` exports `buttonClasses(variant)`, which `Button` itself uses, so a `Link` can share the styles without nesting a `<button>` in an `<a>`.

**`formatLastOpened(iso, now = new Date())`** gives the muted line's time. It compares local calendar days. For 0 to 6 days it uses `Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })` with unit `day`, giving "today", "yesterday" and "3 days ago". For a week or more it uses `Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })`. A never-opened run shows "Started …" with `createdAt`. Unit tests pass `now` and an explicit `en` locale through an optional parameter, so they don't depend on the machine's locale.

**`NewRunPage`** (FR-12 to FR-17)
- `<h1>` "New run", then a `<form noValidate>`:
  - `TextField` "Name" with `maxLength={60}` and `autoComplete="off"`.
  - A `<fieldset>` with `<legend>` "Game", one native radio per registered game (`<input type="radio" name="game">` inside its `<label>`), with Tailwind's `accent-accent` for the control color. Nothing is checked at first (FR-14). The group's error is a `<p>` linked from the fieldset with `aria-describedby`, and the fieldset gets `aria-invalid`.
  - `FormError` for form-level errors.
  - **Start run** (primary, `type="submit"`, "Starting run…" while pending) and a **Cancel** `<Link to="/runs">`.
- Theme: `useRunTheme(gameId ? gameThemeId(gameId) : null)`. Unmounting (Cancel, Back, success) clears it (FR-15).
- Submit: trim the name; `validateNewRun({ name, gameId })` returns `FieldErrors<'name' | 'gameId'>`. If valid, `createRun.mutate({ name, gameId, themeId: gameThemeId(gameId) })`. On success: `navigate(`/runs/${run.id}`, { replace: true })`. On error: `fieldErrorsFrom(error, ['name', 'gameId'])`.
- Focus: `useFocusOnError<'name' | 'gameId' | 'form'>()`. `register('gameId')` goes on the first radio, so focus lands in the group.

**`RunPage`** (FR-19 to FR-21)
- `const { runId } = useParams()`, then `useRun(runId)`.
- `useRunTheme(run.data?.themeId)`.
- Pending → `<FullPageLoading />`. A `404` `ApiError` → `<RunNotFound />` ("Run not found", a short muted line, and a link "Your runs" to `/runs`). Any other error → its message and **Try again**.
- Loaded → `<RunHeader title={name} subtitle={gameName(gameId)} />`, then a centered `text-text-muted` note: "Your conversation with the companion will appear here."

**`RunHeader`**: the preview's markup moved into `src/runs/RunHeader.tsx`.
- Props: `title`, `subtitle`, `titleAs?: 'h1' | 'h3'` (default `h1`), and `actions?: ReactNode` for the right side.
- The back control is a `<Link to="/runs" aria-label="Your runs">` instead of a button.
- The preview renders `<RunHeader titleAs="h3" actions={<menu button>} … />`, so there's one copy of the markup. On the preview, the back link going to `/runs` is fine: the preview is dev-only, and signed out it leads to sign-in.

### Shared form helpers

Run forms need the helpers that live in `src/account/`, so they move to `src/forms/`:

- `formErrors.ts` (+ test)
- `useFocusOnError.ts`
- the `FieldErrors<Field>` type from `account/validation.ts`

Imports in the account pages update. Account-specific validation stays in `account/validation.ts`. This is a move with no behavior change.

`src/runs/validation.ts`: `validateNewRun({ name, gameId })` checks that the name is present after trimming, that it's at most 60 characters, and that `gameId` is a registered game (FR-13, FR-14, FR-17). The messages are "Give your run a name.", "Keep the name to 60 characters or fewer." and "Choose a game."

### Tests

- **`src/test/runs.ts`** has helpers:
  - `signInAsDemo()` calls the mocked `signIn` with the demo account and returns the session.
  - `seedRuns(...)` wraps `seedStubRuns` for that session's `userId`.
- **`src/test/setup.ts`**: `afterEach` also calls `resetRunStubMemory()`. `localStorage` is already cleared there.
- **Page tests** render `<App />` with `renderWithProviders(<App />, { route })`, so routing, the guards and the theme run as in the app. They check `document.documentElement.dataset.theme` for theme assertions (SC-5).
- **Time-dependent tests** pass fixed ISO times to `seedRuns` relative to `Date.now()`, rather than faking timers, which would interfere with `userEvent` and the stub delays.
- **Coverage, by file:**
  - `LandingPage.test.tsx`: most recent run, empty list, list failure (via `vi.spyOn` on `runs.ts`), and Back not returning to `/`, checked with a `MemoryRouter` history of more than one entry.
  - `RunListPage.test.tsx`: order, the muted line, empty state, error and retry, sign out.
  - `NewRunPage.test.tsx`: success lands in the run and the run becomes most recent; client validation with focus; server field errors; network error; cancel; the theme switching to `elden-ring` when the game is picked and back to `general` on cancel.
  - `RunPage.test.tsx`: theme applied, opened recorded once, not found, other error and retry, unknown game id shown as "Unknown game", an unknown theme id falling back to `general`.
  - `runStub.test.ts`: per-player isolation, ordering, validation, `404` for another player's run.
  - `ThemeProvider.test.tsx`: `useRunTheme` and `useUserTheme` set and clear on unmount, and props win over hooks.

### backend-needs.md

When the stubs land, the four `004-runs` entries move from `open` to `stubbed`. Their function names are already there.

## File Changes

| Path | Change |
|------|--------|
| `web/src/api/runs.ts`, `web/src/api/stubs/runStub.ts` (+ test) | New |
| `web/src/api/README.md` | "Stubs with state" names the run stub and its storage key |
| `web/src/games/games.ts` (+ test) | New |
| `web/src/theme/ThemeProvider.tsx`, `useThemeSources.ts`, `themes.ts` (+ tests) | Context-set run and user themes; `playerDefaultThemeId` |
| `web/src/account/RequireSession.tsx` | `useUserTheme` for signed-in screens |
| `web/src/forms/*` | Moved from `account/`; account imports updated |
| `web/src/components/Button.tsx` | Export `buttonClasses` |
| `web/src/runs/*` | New screens, queries, helpers and tests |
| `web/src/preview/ThemePreview.tsx` | Uses `RunHeader` |
| `web/src/home/*` | Deleted |
| `web/src/App.tsx`, `App.test.tsx`, `routing.test.tsx` | New routes; tests that expected the home screen now expect the landing |
| `web/src/test/runs.ts`, `setup.ts` | Helpers; reset run stub |
| `specs/backend-needs.md` | Four entries → `stubbed` |

## Verification

1. `npm run build`, `npm run lint` and `npm test` pass (SC-1, SC-3 to SC-5).
2. `grep` finds `fetch(` only in `client.ts`, and `game-companion.stub.runs` only in `src/api/stubs/runStub.ts` and tests (SC-7).
3. `specs/backend-needs.md` shows the four entries `stubbed` (SC-6).
4. Browser run-through with `npm run dev`, against the real account endpoints through the Aspire app (SC-2): every scenario, keyboard only, in both themes (SC-8).
5. `git status` shows changes only under `web/` and `specs/` (SC-9).

## Risks

- **A General frame while a run loads.** On a cold load of `/runs/:id`, the run's theme isn't known until `getRun` resolves, so the loading state shows in the player's default theme, then the run appears in its own. It's brief with a real backend. Coming from the create screen or a warm cache, there's no flash. If it bothers in practice, the list query's cached run (`themeId`) can seed `useRun` through `placeholderData`.
- **The run stub calls the real session endpoint** on every operation. That's cheap locally. It also means the run stubs fail with a `401` when signed out, which is what the real endpoints will do.
- **Locale:** `formatLastOpened` follows the browser locale in the app, so its exact wording ("3 days ago") is only guaranteed in tests, which pin `en`.
