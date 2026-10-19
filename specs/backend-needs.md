# Backend Needs

API work the front end is waiting on, across all features. Spec Kit adds and updates entries (constitution principle III); only the developer marks an entry `done`.

Status: `open` (needed, no stub yet) → `stubbed` (front end works against a stub in `web/src/api/`) → `done` (stub replaced with a real call).

| Need | Feature | Why | Stub | Status |
|------|---------|-----|------|--------|
| Sign in with email, password and "keep me signed in"; returns the player, or fails as unauthenticated or refused (locked out) | 003-sign-in | Players sign in to reach their runs | | open |
| Current session: who is signed in (id, email), or nobody | 003-sign-in | Every screen needs to know who's signed in; drives route protection | | open |
| Sign out of the current session | 003-sign-in | Players sign out from the home screen | | open |
| Create account with email and password; signs the player in, or returns field validation errors (email in use, password rules) | 003-sign-in | New players need an account | | open |
| Request a password reset for an email; same response whether or not the account exists; emails a link to `/reset-password?token=…&email=…` | 003-sign-in | Players who forgot their password | | open |
| Reset password with email, token and new password; fails as invalid/expired token or with password rule errors | 003-sign-in | Completes the forgot-password flow | | open |
| Endpoints that need a signed-in player answer `401` when there isn't one | 003-sign-in | The front end ends the session and returns to sign-in on `401` | | open |
