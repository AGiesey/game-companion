# Tasks: Runs

**Spec:** `spec.md` · **Plan:** `plan.md` · **Design:** `web/design/README.md` · All paths are relative to the repo root. Work stays in `web/` and `specs/`.

Each task ends with a local commit naming the feature and task (for example `004-runs T003: Add the run stub server`). Run commands from `web/`.

## Phase 1: Setup — shared helpers

- [x] [T001] Move `web/src/account/formErrors.ts` (+ `formErrors.test.ts`) and `web/src/account/useFocusOnError.ts` to `web/src/forms/`, and move the `FieldErrors<Field>` type out of `web/src/account/validation.ts` into `web/src/forms/fieldErrors.ts`. Update the account pages' imports. No behavior change: `npm run build`, `npm run lint` and `npm test` pass.
- [x] [T002] Export `buttonClasses(variant)` from `web/src/components/Button.tsx` and use it in `Button` itself. No visual change.

## Phase 2: Foundational — games, API, theme sources

- [x] [T003] Create `web/src/games/games.ts`: `games` (Elden Ring, theme `elden-ring`), `GameId`, `isGameId`, `gameName` ("Unknown game" for unknown ids), `gameThemeId`. Add `web/src/games/games.test.ts`. (FR-18)
- [x] [T004] Create `web/src/api/stubs/runStub.ts`. It finds the player with `getSession()` from `account.ts`, and fails with a `401` when nobody is signed in. Runs are kept per user under `game-companion.stub.runs`, with an in-memory fallback when storage throws, and listed by `lastOpenedAt ?? createdAt`, newest first. It returns `400` validation errors (`errors.Name`, `errors.GameId`) for a blank name, a name over 60 characters and an unknown game, and a `404` "Run not found" for a missing run or another player's. Everything goes through `stub()`. It also exports `seedStubRuns` and `resetRunStubMemory` for tests. Add `web/src/api/stubs/runStub.test.ts`, covering per-player isolation, ordering, recording an opened run, each validation error, a `404` for another player's run and a `401` when signed out. (FR-24)
- [x] [T005] Create `web/src/api/runs.ts` with the `Run` type and `listRuns`, `createRun`, `getRun` and `recordRunOpened`. Each is marked `// STUB: <need> (specs/backend-needs.md)` and delegates to `runStub.ts`. Update "Stubs with state" in `web/src/api/README.md` to name the run stub and its storage key. In `specs/backend-needs.md`, move the four `004-runs` entries to `stubbed`. (FR-23, SC-6)
- [x] [T006] Add `ThemeSourcesContext` and `run`/`user` theme state to `web/src/theme/ThemeProvider.tsx`; props take precedence over context values. Create `web/src/theme/useThemeSources.ts` with `useRunTheme` and `useUserTheme`, each a layout effect that sets its source and clears it on unmount. Add `playerDefaultThemeId = 'general'` to `web/src/theme/themes.ts`, commented as the stand-in until settings. Extend `web/src/theme/ThemeProvider.test.tsx`: each hook sets and clears its source, the run theme beats the user theme, and props beat hooks. (FR-15, FR-19, Defaults)
- [x] [T007] Create `web/src/runs/runQueries.ts`: `runsQueryKey`, `runQueryKey`, `useRuns`, `useRun` and `useCreateRun`. On success, `useCreateRun` puts the new run into `runQueryKey(run.id)` and invalidates the list. (FR-16, FR-23)
- [x] [T008] Create `web/src/test/runs.ts` with `signInAsDemo()` and `seedRuns(...)`, and make `web/src/test/setup.ts` call `resetRunStubMemory()` after each test.

## Phase 3: User Story — Landing and the signed-in theme (scenarios 1, 2, 7)

- [x] [T009] Call `useUserTheme(session.data ? playerDefaultThemeId : null)` in `web/src/account/RequireSession.tsx`. Create `web/src/runs/LandingPage.tsx`: loading → `FullPageLoading`, error → `/runs`, otherwise the most recent run or `/runs`, always with `replace`. Add placeholder `RunListPage`, `NewRunPage` and `RunPage` components (heading only) so the routes resolve. Add the `/`, `/runs`, `/runs/new` and `/runs/:runId` routes to `web/src/App.tsx`. Delete `web/src/home/`. Update `web/src/account/routing.test.tsx`, `App.test.tsx` and the account page tests wherever they expected the home screen. (FR-1 to FR-4, FR-7)
- [ ] [T010] Create `web/src/runs/LandingPage.test.tsx`. It covers:
  - landing in the most recent run, after signing in;
  - landing on `/runs` with no runs, including right after creating an account;
  - landing on `/runs` when the list fails;
  - a remembered return path winning over the landing;
  - Back not returning to `/`, using a `MemoryRouter` history with an earlier entry.

  (FR-2, FR-3, SC-3)

## Phase 4: User Story — Run list and switching (scenarios 3, 9, 10)

- [ ] [T011] Create `web/src/runs/formatLastOpened.ts` ("Opened today", "Opened yesterday", "Opened N days ago" up to 6 days, then the medium date; "Started …" when never opened). It takes optional `now` and `locale` parameters. Add `web/src/runs/formatLastOpened.test.ts`, pinned to `en`, covering calendar-day boundaries (late last night versus earlier today) and the 6-to-7-day switch. (FR-8)
- [ ] [T012] Build `web/src/runs/RunListPage.tsx` and `web/src/runs/RunListItem.tsx`:
  - `<title>`, `<h1>` "Your runs", and a `<ul>` with `border-list` dividers.
  - Each row is a `Link` labelled by the run's name (`aria-labelledby`), described by the muted line (`aria-describedby`), with a `<time>` element.
  - A loading status in place of the list.
  - On error, an alert with **Try again**.
  - The empty-state message when there are no runs.
  - **New run** as a `Link` styled with `buttonClasses('primary')`, and **Sign out** using `useSignOut`.

  (FR-7 to FR-11, FR-22)
- [ ] [T013] Create `web/src/runs/RunListPage.test.tsx`. It covers:
  - order, most recently opened first;
  - each link found by its run name, with the game and time as its description;
  - the empty state;
  - a list error, then **Try again** succeeding;
  - sign out landing on sign-in;
  - the page in `general` even when the device's last theme is `elden-ring`;
  - the document title.

  (SC-3, SC-5)

## Phase 5: User Story — Create a run (scenarios 4, 5, 6)

- [ ] [T014] Create `web/src/runs/validation.ts` with `validateNewRun` and its messages, plus `web/src/runs/validation.test.ts`. Cover a blank or whitespace-only name, a name of exactly 60 and of 61 characters after trimming, a missing game and an unknown game. (FR-13, FR-14, FR-17)
- [ ] [T015] Build `web/src/runs/NewRunPage.tsx`:
  - `<title>` and `<h1>` "New run".
  - A Name `TextField` with `maxLength={60}`.
  - A Game `<fieldset>`/`<legend>` with one native radio per game, none checked, and its error linked through `aria-describedby` and `aria-invalid`.
  - `FormError`, **Start run** (reading "Starting run…" while pending) and a **Cancel** link to `/runs`.
  - `useRunTheme(gameThemeId(gameId))` while a game is picked.
  - On submit: trim the name, check it with `validateNewRun`, then call `useCreateRun`. On success, navigate to the run with `replace`. Map server errors with `fieldErrorsFrom(error, ['name', 'gameId'])`.
  - Move focus to the first error, using the first radio for the game group.

  (FR-12 to FR-17, FR-22)
- [ ] [T016] Create `web/src/runs/NewRunPage.test.tsx`. It covers:
  - picking Elden Ring sets `data-theme` to `elden-ring`, and cancelling returns to `/runs` in `general` with no run created;
  - success lands in the new run with Back going to `/runs`, and the run is then first in the list;
  - empty submit shows linked errors on Name and Game and focuses Name;
  - a name-only submit focuses the game group;
  - server field errors, via `vi.spyOn` on `createRun`, appear under their fields;
  - a network error shows the network message;
  - the button is disabled while submitting.

  Fields are found by label and the game group by its accessible name. (SC-3, SC-4, SC-5)

## Phase 6: User Story — Run screen (scenarios 1, 7, 8)

- [ ] [T017] Move the run header from `web/src/preview/ThemePreview.tsx` into `web/src/runs/RunHeader.tsx`, taking `title`, `subtitle`, `titleAs`, `actions` and a back `Link` to `/runs` labelled "Your runs". The preview renders it with `titleAs="h3"` and its menu button as `actions`. Its tests still pass. (FR-20)
- [ ] [T018] Create `web/src/runs/useRecordRunOpened.ts`. Once the run has loaded, it records the open once per `runId` + `location.key`, using a ref to skip repeats. On success it invalidates the list, and it shows nothing on error. (FR-5, FR-6)
- [ ] [T019] Build `web/src/runs/RunPage.tsx` and `web/src/runs/RunNotFound.tsx`:
  - `useRun(runId)` and `useRunTheme(run.data?.themeId)`.
  - Loading → `FullPageLoading`; a `404` → `RunNotFound` with a link to `/runs`; other errors → message and **Try again**.
  - Loaded: `RunHeader` with the run name and `gameName(gameId)`, the placeholder note, and `<title>` set to the run name.
  - Call `useRecordRunOpened`.

  (FR-19 to FR-22)
- [ ] [T020] Create `web/src/runs/RunPage.test.tsx`. It covers:
  - an Elden Ring run sets `data-theme` to `elden-ring`;
  - the header shows the name as `h1` and the game, and the back link goes to `/runs` in `general`;
  - the open is recorded exactly once per arrival, both on rerender and under `StrictMode`, and recorded again when returning through the list;
  - a failed record doesn't show an error;
  - an unknown or another player's run shows "Run not found" in `general`;
  - another error, then **Try again** succeeding;
  - an unknown game id shows "Unknown game";
  - an unknown theme id falls back to `general`;
  - the document title.

  (SC-3, SC-5)

## Phase 7: Polish and verification

- [ ] [T021] Verify:
  - `npm run build`, `npm run lint` and `npm test` pass (SC-1).
  - `fetch(` appears only in `web/src/api/client.ts`, and `game-companion.stub.runs` only in `web/src/api/stubs/runStub.ts` and tests (SC-7).
  - `specs/backend-needs.md` shows four `stubbed` `004-runs` entries (SC-6).
  - `git status` shows changes only under `web/` and `specs/` (SC-9).
  - In a browser against the Aspire-hosted app with the real account endpoints, run scenarios 1–10, keyboard only, with focus visible in both themes (SC-2, SC-8). Use headless Chrome if needed.

  Fix anything that fails.
- [ ] [T022] Manual check for the developer: in the browser, switch runs, create a run and watch the switch into Elden Ring. Check that the run list and create screen read well next to the existing mocks in both themes. Report as a step for the developer to confirm.

## Dependencies

- T001, T002 first (independent of each other).
- T003 → T004 → T005. T006 is independent of T003–T005. T007 depends on T005. T008 depends on T004.
- T009 depends on T006, T007, T008. T010 depends on T009.
- T011 is independent. T012 depends on T002, T009, T011. T013 depends on T012.
- T014 depends on T001, T003. T015 depends on T009, T014. T016 depends on T015.
- T017 is independent after T009. T018 depends on T007. T019 depends on T017, T018. T020 depends on T019.
- T021 depends on all prior tasks; T022 last.
