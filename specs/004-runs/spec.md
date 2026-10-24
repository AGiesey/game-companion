# Feature: Runs

**Feature directory:** `specs/004-runs`
**Status:** Draft
**Design source:** `web/design/README.md` (Themes and games, Run header, Theme switching). The run list and the create-run screen are not mocked; they derive from the tokens and the shared components.

## Overview

A player can have several runs, each in a game. This feature adds the run list, where the player switches between runs or starts a new one, and a placeholder run screen. Creating a run asks for a name and a game (Elden Ring is the only game for now). Picking the game switches the screen into that game's look, so the player sees their new run's theme before it exists.

After sign-in, the player goes straight to the run they opened most recently, or to the run list if they have no runs. This replaces the placeholder home screen from the sign-in feature.

The run screen is a placeholder in the run's theme: the run header and a note that the conversation is coming. The conversation and the run panel (character sheet) come in later features.

The run list and create-run screen use the player's default theme. Since settings don't exist yet, that default is always General.

## Users

- **A returning player** who wants to get back into the run they were playing.
- **A player with several runs** (different characters, or a new game plus) who switches between them.
- **A new player** starting their first run.

## User Scenarios

1. **Back to the current run.** A returning player signs in and lands straight in the run they opened most recently, in that run's theme.
2. **No runs yet.** A new player signs in (or creates an account) and lands on the run list. It's empty and invites them to start their first run.
3. **Switch runs.** From a run, the player presses the header's back button and arrives at the run list in General. Their runs are listed with the most recently opened first. They pick another run and arrive in it. Next time they sign in, they land in that run.
4. **Create a run.** From the run list, the player chooses **New run**, enters a name ("Vaela's Run"), picks Elden Ring and the screen changes to the Elden Ring look at once. They submit and arrive in the new run, which is now their most recent.
5. **Change their mind.** On the create-run screen, the player picks Elden Ring (the screen turns Elden Ring), then cancels. They're back on the run list in General, and no run was created.
6. **Missing name.** The player submits without a name, or without picking a game. They see the problem next to the field and nothing is sent.
7. **Bookmarked run.** A player opens a link to one of their runs and goes straight to it. A signed-out player is sent to sign-in first, then returned to the run (the existing return path from the sign-in feature).
8. **Not their run.** A player opens a link to a run that doesn't exist or isn't theirs. They see "Run not found" with a link to their runs, in General.
9. **List fails to load.** The run list can't be loaded (for example the server is unreachable). The player sees a plain-language error and a **Try again** button.
10. **Sign out.** The player signs out from the run list and goes to sign-in.

## Functional Requirements

### Routing

- **FR-1 Routes.** These signed-in routes are added; `/` changes meaning:
  | Path | Screen |
  |------|--------|
  | `/` | Landing: sends the player to their most recent run, or to `/runs` if they have none |
  | `/runs` | Run list |
  | `/runs/new` | Create run |
  | `/runs/:runId` | Run screen |
  All of them require a signed-in player, as `/` already does (sign-in FR-2).
- **FR-2 Landing.** `/` loads the player's runs and replaces itself in the history with `/runs/<most recent run id>`, or `/runs` when the list is empty. Pressing Back from where it lands never returns to `/`. While the list loads it shows the full-page loading state from the sign-in feature; if the list fails to load, it goes to `/runs`, which shows the error (scenario 9).
- **FR-3 Return path wins.** After signing in, a remembered return path (sign-in FR-2) still takes priority over the landing. Without one, sign-in and create-account go to `/` as they do now, and the landing decides. A newly created account has no runs, so it lands on the run list.
- **FR-4 Home placeholder removed.** The placeholder home screen (sign-in FR-12) is removed. Its **Sign out** button moves to the run list.

### Most recent run

- **FR-5 Most recent means last opened.** A run counts as opened when the player arrives on its run screen, including right after creating it. The most recent run is the one opened last. A run that has never been opened (which only the stub's or another device's data could produce) sorts by when it was created.
- **FR-6 Opening records it.** Arriving on a run screen tells the API the run was opened, once per arrival (not on every re-render or refetch). If that call fails, the run screen still works and no error is shown; the run list just won't reflect it.

### Run list

- **FR-7 Look.** The run list uses the player's default theme (General until settings exist), never a run's theme, even right after leaving a run.
- **FR-8 Contents.** A heading ("Your runs"), the list of runs, a **New run** button and a **Sign out** button. Each run shows its name in the display font, its game's name, and when it was last opened as a relative time ("Today", "Yesterday", "3 days ago", or a date after a week). Runs are ordered most recently opened first.
- **FR-9 Opening a run.** Each run is a single link to `/runs/<id>` that covers the whole row, so the list is a list of links, usable by keyboard, with the run's name as the link's accessible name.
- **FR-10 Empty state.** With no runs, the list is replaced by a short invitation ("No runs yet. Start one when you begin a game.") and the **New run** button is the primary action.
- **FR-11 Loading and errors.** While the list loads, a loading state in place of the list (the heading and buttons stay). If it fails, the API layer's plain-language message and a **Try again** button that refetches.

### Create run

- **FR-12 Screen.** `/runs/new` shows a heading ("New run"), a **Name** field, a **Game** choice, a primary **Start run** button and a **Cancel** link back to `/runs`.
- **FR-13 Name.** Required. Leading and trailing spaces are trimmed before checking and sending. At most 60 characters, enforced by the field and checked before sending. Names don't have to be unique.
- **FR-14 Game choice.** A labeled radio group listing every registered game (FR-18), with none picked at first. Choosing one is required. With only Elden Ring registered, it's a group of one, so the screen already works the way it will with more games.
- **FR-15 Game's look.** Picking a game switches the screen to that game's theme immediately, with no reload, using the theme provider's run theme input. Cancelling, going back, or leaving any other way returns to the default theme. A game without a theme of its own leaves the default theme in place.
- **FR-16 Submitting.** Submitting creates the run with its name, game, and theme (the game's theme, or none if the game has none, meaning "follow the player's default"). While submitting, **Start run** is disabled and reads "Starting run…". On success the run list is refreshed in the cache and the player goes to the new run's screen, replacing `/runs/new` in history so Back goes to the run list.
- **FR-17 Errors.** Client checks: name present, within the length limit, and a game picked. Server errors are shown the same way as on the account forms (sign-in FR-15): field errors from a validation ProblemDetails under the matching field, others above the form, network failures as the API layer's message. Focus moves to the first error, as on the account forms (sign-in FR-17).

### Games

- **FR-18 Game registry.** A single front-end list of games drives the game choice and game names: each with a stable id, a display name and its theme id (if it has one). It starts with Elden Ring (`elden-ring`, "Elden Ring", theme `elden-ring`). Unknown game ids are detectable with a type guard, like theme ids, and a run with an unknown game shows its game as "Unknown game" rather than failing.

### Run screen

- **FR-19 Theme.** The run screen uses the run's theme (theme FR-10's run theme input). A run with no theme, or a theme id that no longer exists, follows the player's default.
- **FR-20 Placeholder content.** The run header from the design doc: a back button to `/runs` labeled "Your runs" for assistive technology, the run's name as the page heading in the display font, and the game's name as the muted subtitle (class, level and region come with the character sheet). The menu button is left out until the run panel exists. Below the header's divider, a short centered note: "Your conversation with the companion will appear here."
- **FR-21 Loading and not found.** While the run loads, the full-page loading state. If the API says the run doesn't exist (or isn't the player's, which the API reports the same way), a "Run not found" screen in the default theme with a link to `/runs`. Other failures show the API layer's message and a **Try again** button.
- **FR-22 Page titles.** Each screen sets the document title: "Your runs · Game Companion", "New run · Game Companion", and "<run name> · Game Companion".

### API layer

- **FR-23 Run functions.** `web/src/api/runs.ts` provides one typed function per backend need below, each a stub (`// STUB:`) until the developer builds the endpoint. Run data is read through TanStack Query hooks, and creating a run updates the run list query.
- **FR-24 Realistic stubs.** The run stubs behave like a real run store so the feature can be used end to end:
  - Runs are kept per signed-in player (by the session's id), so two accounts on one browser have separate runs. Every player starts with none.
  - Listing returns the player's runs, most recently opened first (FR-5).
  - Creating rejects a blank name and a name over 60 characters, and an unknown game id, with validation errors in ProblemDetails form, so the server-error path can be exercised.
  - Getting a run that doesn't exist, or belongs to another player, fails with a 404-style `ApiError`.
  - Recording an opened run updates its last-opened time.
  - Stub state lives in browser storage under keys prefixed `game-companion.stub.`, like the account stubs did.

## API Needs

Each is added to `specs/backend-needs.md` with status `open`, and moves to `stubbed` when its stub exists. Routes, request and response shapes are the developer's call; the stubs only fix what the UI needs.

1. **List the player's runs**, most recently opened first: for each, its id, name, game id, theme id (empty means "follow the player's default"), when it was created and when it was last opened (if ever). Only the signed-in player's runs.
2. **Create a run** with a name, a game id and a theme id (may be empty). Returns the new run in the same shape as the list. Fails with field validation errors (name missing or too long, unknown game).
3. **Get one run** by id, in the same shape. Fails as not found when it doesn't exist or isn't the signed-in player's, without revealing which.
4. **Record that the player opened a run**, so the list's order and the landing reflect it. Fails as not found under the same rule. (The developer may fold this into getting a run; the front end only needs it to happen once per arrival.)

The design doc also lists **update a run's theme id**. That belongs to the run theme picker feature, not this one.

## Out of Scope

- The conversation, the run panel and character sheet, the run journal and Lore So Far.
- Renaming, deleting or archiving runs.
- Choosing a run's theme other than the game's, and choosing the player's default theme (settings). Until settings exist, the player's default is General.
- Games other than Elden Ring, and loading the game list from the API.
- Any backend work.

## Defaults Chosen

- **Create run is its own screen** (`/runs/new`), not a dialog, so it has an address, works with Back and has a simple focus story.
- **The player's default theme** is a front-end constant (`general`) passed to the theme provider as the user theme input on signed-in screens, until the settings feature supplies the real one. The sign-in screens keep using the last theme on this device.
- **The game list is in the front end**, like the theme registry. If the backend later owns it, a "list games" need replaces the registry's data, not its consumers.
- **Name limit:** 60 characters, long enough for "Vaela's Run (Moonlight Greatsword, NG+2)" and short enough for the run header at phone width.
- **No game preselected**, even with one game, so the switch into its look happens as the player chooses it.
- **Relative times** use the browser's locale through `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`, not a date library.
- **Copy** is plain and easy to change: "Your runs", "New run", "Start run", "No runs yet. Start one when you begin a game."

## Success Criteria

- **SC-1** `npm run build`, `npm run lint` and `npm test` pass, including the raw-value and contrast guards.
- **SC-2** Every scenario above works end to end in the browser against the run stubs and the real account endpoints.
- **SC-3** Tests cover: the landing (most recent run, empty list, list failure) and that Back doesn't return to `/`; the run list (order, relative times, empty state, error with retry, sign out); creating a run (success lands in the run and makes it most recent, client validation, server field errors, network error, cancel); the theme switching to Elden Ring when the game is picked and back to General on cancel; the run screen (run theme applied, opened recorded once, not found, other errors with retry); and an unknown game id or theme id on a run.
- **SC-4** Form tests find fields by label and the game choice by its group's accessible name; errors are checked through their association with the field, and focus moving to the first error.
- **SC-5** Theme tests check `data-theme` on `<html>`: `general` on the run list and create-run screen before a game is picked, `elden-ring` after picking Elden Ring and on an Elden Ring run.
- **SC-6** `specs/backend-needs.md` lists the four needs, each `stubbed` with its stub function named, and each function in `web/src/api/runs.ts` carries a `// STUB:` comment naming its need.
- **SC-7** No component calls `fetch` or reads stub storage directly; run access goes only through `web/src/api/runs.ts`.
- **SC-8** The run list, create-run screen and run screen are usable by keyboard alone with visible focus, in both themes.
- **SC-9** Nothing outside `web/` and the `specs/` folder changes.
