# Backend Needs

API work the front end is waiting on, across all features. Spec Kit adds and updates entries (constitution principle III); only the developer marks an entry `done`.

Status: `open` (needed, no stub yet) → `stubbed` (front end works against a stub in `web/src/api/`) → `done` (stub replaced with a real call).

| Need | Feature | Why | Stub | Status |
|------|---------|-----|------|--------|
| Sign in with email, password and "keep me signed in"; returns the player, or fails as unauthenticated or refused (locked out) | 003-sign-in | Players sign in to reach their runs | `account.ts` → `signIn` | done |
| Current session: who is signed in (id, email), or nobody | 003-sign-in | Every screen needs to know who's signed in; drives route protection | `account.ts` → `getSession` | done |
| Sign out of the current session | 003-sign-in | Players sign out from the home screen | `account.ts` → `signOut` | done |
| Create account with email and password; signs the player in, or returns field validation errors (email in use, password rules) | 003-sign-in | New players need an account | `account.ts` → `createAccount` | done |
| Request a password reset for an email; same response whether or not the account exists; emails a link to `/reset-password?token=…&email=…` | 003-sign-in | Players who forgot their password | `account.ts` → `requestPasswordReset` | done |
| Reset password with email, token and new password; fails as invalid/expired token or with password rule errors | 003-sign-in | Completes the forgot-password flow | `account.ts` → `resetPassword` | done |
| Endpoints that need a signed-in player answer `401` when there isn't one | 003-sign-in | The front end ends the session and returns to sign-in on `401` | `queryClient.ts` → `handleUnauthenticated` | done |
| List the player's runs, most recently opened first: id, name, game id, theme id (empty = follow default), created and last opened times | 004-runs | The run list, and the landing after sign-in picks the most recent run | `runs.ts` → `listRuns` | open |
| Create a run with name, game id and theme id (may be empty); returns the run, or field validation errors (name missing or too long, unknown game) | 004-runs | Players start a new run | `runs.ts` → `createRun` | open |
| Get one run by id; not found when it doesn't exist or isn't the player's, without saying which | 004-runs | The run screen and bookmarked run links | `runs.ts` → `getRun` | open |
| Record that the player opened a run (may be folded into getting a run); not found under the same rule | 004-runs | "Most recent run" means last opened | `runs.ts` → `recordRunOpened` | open |
