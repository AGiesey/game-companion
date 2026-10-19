# Feature: Sign In

**Feature directory:** `specs/003-sign-in`
**Status:** Draft
**Design source:** `web/design/README.md` (Sign-in) and `web/design/general-sign-in-title-screen.png`

## Overview

Players need an account so their runs, conversations and run journal are theirs. This feature adds the screens and flow around accounts: signing in, creating an account, signing out, and resetting a forgotten password. It also adds routing, so the app knows which screens need a signed-in player and sends everyone else to sign-in.

The backend for accounts (ASP.NET Core Identity with the Cosmos-backed user store) is the developer's hand-written work. Until it exists, every account call is a stub in `web/src/api/` (constitution II), and the stubs behave like a real account system closely enough to use the app end to end.

## Users

- **A returning player** who wants to get back to their runs quickly.
- **A new player** creating an account.
- **A player who forgot their password.**

## User Scenarios

1. **Sign in.** A returning player opens the app, lands on the sign-in screen in the theme they last used, enters their email and password, chooses whether to stay signed in on this device, presses **Enter** and arrives at the app's home screen.
2. **Wrong password.** The player mistypes their password. They see "Email or password is incorrect.", their email is kept, the password field is cleared and focused, and they can try again.
3. **Create an account.** A new player follows **Begin a new journey**, enters their email and a password (twice), submits, and arrives at the home screen signed in.
4. **Account rules not met.** The backend rejects the new account (email already used, password too weak). The player sees each problem next to the field it belongs to, in the backend's words.
5. **Forgot password.** The player follows **Forgot password?**, enters their email and is told that if an account exists, an email with a reset link is on its way. The message is the same whether or not the account exists.
6. **Reset password.** The player opens the reset link, enters a new password twice, submits, and is told the password was changed, with a way back to sign-in. An expired or invalid link explains that and offers to send a new one.
7. **Stay signed in.** A player who chose "Keep me signed in on this device" closes the browser, comes back later and goes straight to the home screen. A player who didn't is asked to sign in again after the browser session ends.
8. **Protected screens.** A signed-out player who opens a protected address (for example a bookmarked run) is sent to sign-in, then returned to that address after signing in.
9. **Already signed in.** A signed-in player who opens the sign-in or create-account address is sent to the home screen.
10. **Sign out.** The player chooses **Sign out** from the home screen and is returned to sign-in. Pressing Back doesn't show signed-in content.
11. **Session ends.** If the session expires while the app is open, the next request that the API refuses as unauthenticated sends the player to sign-in, and they return to where they were afterwards.

## Functional Requirements

### Routing

- **FR-1 Routes.** The app has these addresses:
  | Path | Screen | Access |
  |------|--------|--------|
  | `/sign-in` | Sign in | Signed out only |
  | `/create-account` | Create account | Signed out only |
  | `/forgot-password` | Forgot password | Anyone |
  | `/reset-password` | Reset password (reads the token and email from the link's query string) | Anyone |
  | `/` | Home | Signed in |
  | `/preview` | Theme preview | Anyone, development builds only |
  Unknown paths show a simple "page not found" screen with a link home.
- **FR-2 Protected routes.** A signed-out player opening a signed-in route is redirected to `/sign-in`, which remembers the requested path (including its query string) and returns there after signing in. Only same-app paths are accepted as return targets, so a crafted link can't send the player to another site.
- **FR-3 Signed-out-only routes.** A signed-in player opening `/sign-in` or `/create-account` is redirected to `/` (or to the remembered return path).
- **FR-4 No flash while checking.** While the app checks whether the player is signed in, it shows a neutral loading state in the active theme, never a flash of the sign-in screen or of protected content.

### Session

- **FR-5 Current session.** The app asks the API who is signed in once at startup and keeps the answer in TanStack Query, so every screen reads the same session. Signing in, creating an account and signing out update it.
- **FR-6 Unauthenticated responses.** When any API call fails with `401`, the session is treated as ended: cached data for the old session is cleared and the player goes to `/sign-in` with the current path remembered (scenario 11).
- **FR-7 Sign out.** Signing out calls the API, clears all cached query data and goes to `/sign-in`. If the call fails, the player is still signed out locally and sent to sign-in.

### Screens

- **FR-8 Sign-in screen.** Matches the General sign-in mock (title-screen variant) and the design doc: emblem, "Your journey continues", "Game Companion", divider, tagline, and a bracketed card with "Sign in", Email, Password, "Keep me signed in on this device" (on by default, as in the mock), **Enter**, "Forgot password?", and below the card "New here? Begin a new journey". It uses the active theme and the shared components and ornaments from the theme foundation.
- **FR-9 Create account screen.** Same layout as sign-in, with the card titled "Begin a new journey", fields Email, Password and Confirm password, a primary **Create account** button, and below the card "Already have an account? Sign in". Not mocked; it reuses the sign-in screen's structure and styles only, inventing nothing new visually.
- **FR-10 Forgot password screen.** Same layout, card titled "Forgot password", one Email field, a primary **Send reset link** button, and a "Back to sign in" link. After submitting, the card shows the confirmation message from scenario 5 instead of the form.
- **FR-11 Reset password screen.** Same layout, card titled "Choose a new password", fields New password and Confirm new password, a primary **Change password** button. On success the card says the password was changed and links to sign-in. If the link is missing its token or email, or the API rejects it as invalid or expired, the card explains that and links to `/forgot-password`.
- **FR-12 Home screen (placeholder).** Until the run list exists, `/` shows a minimal signed-in screen in the active theme: a welcome line with the player's email and a **Sign out** button. The run list feature replaces it.
- **FR-13 Shared layout.** The four account screens share one layout component (emblem, titles, divider, tagline, bracketed card, footer link slot) so they stay consistent.

### Forms and validation

- **FR-14 Client checks.** Before calling the API, forms check only what doesn't depend on the backend's rules: required fields are filled, the email looks like an email, and the two password fields match. Password strength rules belong to the backend and are not duplicated.
- **FR-15 Server errors.** API errors are shown in the player's terms:
  - Field errors from a validation ProblemDetails (an `errors` object keyed by field name) appear under the matching field; any that don't match a field appear above the form.
  - Sign-in failure shows "Email or password is incorrect." without saying which.
  - A locked-out or otherwise refused account shows the ProblemDetails title.
  - Network failures show the API layer's "Couldn't reach the server" message.
- **FR-16 Submitting state.** While a form is submitting, its primary button is disabled and its label changes ("Entering…", "Creating account…", "Sending…", "Changing password…") so the player can't submit twice.
- **FR-17 Accessible forms.** Every field has a visible label and the right `autocomplete` (`email`, `current-password`, `new-password`). Field errors are linked to their field (`aria-describedby`, `aria-invalid`). When a submission fails, focus moves to the first field with an error, or to the form-level error, which is announced. Enter submits from any field.

### API layer

- **FR-18 Validation errors in `ApiError`.** `ApiError` carries the `errors` object from a validation ProblemDetails, as a map from field name to messages.
- **FR-19 Account functions.** `web/src/api/account.ts` provides one typed function per backend need below. All are stubs (`// STUB:`) until the developer builds the endpoints.
- **FR-20 Realistic stubs.** The account stubs behave like a real account system so the whole flow can be used in development:
  - A demo account exists (documented in `web/src/api/README.md`).
  - Signing in checks the email and password against the stub's accounts and fails with a 401-style `ApiError` otherwise.
  - Creating an account rejects an email that's already used and a password shorter than 8 characters with validation errors in ProblemDetails form, and otherwise signs the new account in.
  - The session survives a reload when "Keep me signed in" was chosen, and lasts until the browser session ends otherwise, matching how a persistent and a session cookie behave.
  - Forgot password always succeeds. Reset password accepts a documented demo token and rejects anything else as invalid or expired.
  - Stub state lives in browser storage under keys prefixed `game-companion.stub.`, so it can be cleared on its own.

## API Needs

Each is added to `specs/backend-needs.md` with status `open`, and moves to `stubbed` when its stub exists. Routes, request and response shapes are the developer's call; the stubs only fix what the UI needs.

1. **Sign in** with email, password and "keep me signed in". Succeeds with the signed-in player, or fails as unauthenticated (wrong email or password) or refused (for example locked out).
2. **Current session**: who is signed in (at least an id and email), or nobody.
3. **Sign out** of the current session.
4. **Create account** with email and password. Signs the new player in, or fails with field validation errors (email in use, password rules).
5. **Request a password reset** for an email. Always succeeds from the player's point of view, whether or not the account exists, and sends an email with a reset link to `/reset-password` carrying a token and the email.
6. **Reset password** with email, token and new password. Succeeds, or fails as invalid or expired token, or with password rule errors.
7. **Unauthenticated responses**: any endpoint that needs a signed-in player answers `401` when there isn't one (FR-6).

## Out of Scope

- The backend itself: Identity, the user store, cookies or tokens, sending email.
- Email confirmation, two-factor authentication, external logins (Google and so on), account settings, changing email or password while signed in, deleting an account.
- Choosing a default theme in settings (the settings feature).
- The run list; the home screen is a placeholder.

## Defaults Chosen

- **Router:** React Router, in its plain (declarative) mode, without its framework or data-loading features; TanStack Query stays the data layer.
- **Theme preview** moves to `/preview` and is only reachable in development builds.
- **Copy** follows the mock's voice for the parts it shows ("Your journey continues", "Enter", "Begin a new journey") and plain wording elsewhere. All of it is easy to change.
- **"Keep me signed in"** is checked by default, as in the mock.
- **Demo account:** `vaela@example.com` / `stub-password`. **Demo reset token:** `stub-reset-token`.
- **Stub password rule:** at least 8 characters, only so the validation-error path can be exercised. The real rules are the backend's.

## Success Criteria

- **SC-1** `npm run build`, `npm run lint` and `npm test` pass, including the raw-value and contrast guards.
- **SC-2** Every scenario above works end to end in the browser against the stubs.
- **SC-3** Tests cover: signing in (success, wrong password, network error); creating an account (success, field errors, password mismatch caught before the API); forgot password (same message either way); reset password (success, invalid token, missing token); redirects for protected and signed-out-only routes, including the return path and rejecting an off-site return path; sign out; and a `401` from an unrelated call ending the session.
- **SC-4** Form tests find fields by label and errors by their association with the field (`toHaveAccessibleDescription`), and check focus moves to the first error.
- **SC-5** `specs/backend-needs.md` lists all seven needs, each `stubbed` with its stub function named, and each account function in `web/src/api/account.ts` carries a `// STUB:` comment naming its need.
- **SC-6** No component calls `fetch` or reads stub storage directly; account access goes only through `web/src/api/account.ts`.
- **SC-7** Side by side with the sign-in mock, the sign-in screen matches in both themes (manual check by the developer).
- **SC-8** Nothing outside `web/` and the `specs/` folder changes.
