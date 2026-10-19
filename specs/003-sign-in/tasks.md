# Tasks: Sign In

**Spec:** `spec.md` · **Plan:** `plan.md` · **Design:** `web/design/README.md` · All paths are relative to the repo root. Work stays in `web/` and `specs/`.

Each task ends with a local commit naming the feature and task (for example `003-sign-in T004: Add the account stub server`). Run commands from `web/`.

## Phase 1: Setup

- [x] [T001] Install `react-router` (runtime) in `web/package.json`; confirm `npm run build` passes.
- [x] [T002] Update test plumbing: `web/src/test/setup.ts` also clears `sessionStorage` and sets stub delays to 0 before all tests; `web/src/test/render.tsx` `renderWithProviders(ui, { route })` wraps in a `MemoryRouter` with `initialEntries` and returns `queryClient`. Existing tests still pass.

## Phase 2: Foundational — API, session and query client

- [x] [T003] Add `errors` to `ProblemDetails` and `ApiError` in `web/src/api/client.ts`; extend `web/src/api/client.test.ts` with a validation ProblemDetails case. (FR-18)
- [x] [T004] Create `web/src/api/stubs/accountStub.ts` (accounts and session in storage under `game-companion.stub.*`, seeded demo account, remember → `localStorage` / otherwise `sessionStorage`, in-memory fallback when storage throws, ApiErrors as in the plan, demo reset token, all via `stub()`) and `web/src/api/stubs/accountStub.test.ts` covering each operation's success and failure paths. (FR-20)
- [x] [T005] Create `web/src/api/account.ts` with `Session` and the six functions, each `// STUB: <need> (specs/backend-needs.md)` and delegating to the stub. Update `web/src/api/README.md` with the demo account, demo token and stub storage keys. In `specs/backend-needs.md`, move the six account needs to `stubbed` with their function names. (FR-19, SC-5)
- [x] [T006] Update `web/src/queryClient.ts`: `createQueryClient({ retry? })` with `QueryCache`/`MutationCache` `onError` calling an exported `handleUnauthenticated(queryClient, error, meta)` (401 without `expectsUnauthenticated` → remove all non-session queries, set session to `null`), and retry only on status 0 or ≥ 500, at most once. Use it from `web/src/test/render.tsx` with `retry: false`. Create `web/src/queryClient.test.ts` covering 401 handling, the meta opt-out, and the retry rule. Move the `401` entry in `specs/backend-needs.md` to `stubbed` naming `queryClient.ts → handleUnauthenticated`. (FR-6, SC-5)
- [x] [T007] Create `web/src/account/useSession.ts` (`sessionQueryKey`, `useSession` with `staleTime: Infinity`, `useSignOut` that clears the cache and sets the session to `null` on settle) and `web/src/account/returnPath.ts` (`signInPath`, `safeReturnPath`) with `web/src/account/returnPath.test.ts` covering same-app paths, query strings, `//host`, `/\host`, absolute URLs, `javascript:`, and `/sign-in` / `/create-account` rejection. (FR-2, FR-5, FR-7)

## Phase 3: User Story — Routing and protection (scenarios 8, 9)

- [ ] [T008] Create `web/src/components/FullPageLoading.tsx` (`role="status"`), `web/src/account/RequireSession.tsx`, `web/src/account/RequireSignedOut.tsx`, `web/src/NotFoundPage.tsx` and a placeholder `web/src/home/HomePage.tsx` (welcome line with email). Rewrite `web/src/App.tsx` as the route table from the plan (preview under `import.meta.env.DEV`); add `<BrowserRouter>` in `web/src/main.tsx`. Move the ping tests to `web/src/preview/ApiStatus.test.tsx`; rewrite `web/src/App.test.tsx` for `/preview` and not-found. (FR-1, FR-4)
- [ ] [T009] Create `web/src/account/routing.test.tsx`: signed-out on `/` → sign-in with no `returnTo`; signed-out on `/somewhere?x=1` → sign-in with encoded `returnTo`; signed-in on `/sign-in` → home, and → `returnTo` when safe, → home when unsafe; loading state shown while the session is pending and no sign-in content flashes. (FR-2, FR-3, FR-4, SC-3)

## Phase 4: User Story — Sign in (scenarios 1, 2, 7)

- [ ] [T010] Create `web/src/components/TextField.tsx` and `web/src/components/FormError.tsx`; create `web/src/account/validation.ts` (+ `validation.test.ts`) and `web/src/account/formErrors.ts` (`fieldErrorsFrom`, + `formErrors.test.ts`, including case-insensitive keys and unmatched keys). (FR-14, FR-15, FR-17)
- [ ] [T011] Create `web/src/account/AccountLayout.tsx` from the sign-in section of `ThemePreview`, and make `web/src/preview/ThemePreview.tsx` render its sign-in section through it. (FR-8, FR-13)
- [ ] [T012] Create `web/src/account/SignInPage.tsx`: fields, remember checkbox (checked), Enter with "Entering…", forgot and create links, client validation, `signIn` mutation with `meta.expectsUnauthenticated`, success sets the session, 401 → "Email or password is incorrect." with the password cleared and focused, other errors per FR-15, focus to first error. (FR-8, FR-14–FR-17)
- [ ] [T013] Create `web/src/account/SignInPage.test.tsx`: success lands on home (and on `returnTo`); wrong password shows the message, keeps the email, clears and focuses the password; empty fields show linked errors (`toHaveAccessibleDescription`) and focus the first; network error shows the network message; button disabled while submitting. (SC-3, SC-4)

## Phase 5: User Story — Create account (scenarios 3, 4)

- [ ] [T014] Create `web/src/account/CreateAccountPage.tsx` (Email, Password, Confirm password, "Create account" / "Creating account…", "Already have an account? Sign in") and `web/src/account/CreateAccountPage.test.tsx`: success signs in and lands on home; mismatched passwords caught without calling the API; email-in-use and short password errors appear under their fields; focus to first error. (FR-9, SC-3, SC-4)

## Phase 6: User Story — Sign out and session end (scenarios 10, 11)

- [ ] [T015] Add **Sign out** to `web/src/home/HomePage.tsx` using `useSignOut`; create `web/src/home/HomePage.test.tsx`: shows the email; signing out lands on sign-in and the session is `null`; signing out still lands on sign-in when the API call fails. Add to `web/src/account/routing.test.tsx`: a `401` from an unrelated query while on home sends the player to sign-in with `returnTo`. (FR-6, FR-7, FR-12, SC-3)

## Phase 7: User Story — Forgot and reset password (scenarios 5, 6)

- [ ] [T016] Create `web/src/account/ForgotPasswordPage.tsx` and its test: submitting shows the same confirmation for a known and an unknown email; validation for empty or malformed email; "Back to sign in" link. (FR-10, SC-3)
- [ ] [T017] Create `web/src/account/ResetPasswordPage.tsx` and its test: reads `token` and `email` from the query string; success shows the changed message with a sign-in link; invalid token and missing token or email show the explanation with a link to `/forgot-password`; mismatched passwords caught client-side. (FR-11, SC-3)

## Phase 8: Polish and verification

- [ ] [T018] Verify: `npm run build`, `npm run lint`, `npm test` pass (SC-1); `fetch(` only in `web/src/api/client.ts` and `game-companion.stub.` only under `web/src/api/stubs/` (SC-6); `specs/backend-needs.md` has seven `stubbed` entries with functions (SC-5); the production build contains no `ThemePreview` code; `git status` shows changes only under `web/` and `specs/` (SC-8). In a browser (headless Chrome if needed) against the dev or preview server: run scenarios 1–11 (SC-2). Fix anything that fails.
- [ ] [T019] Manual check for the developer (SC-7): compare `/sign-in` with `web/design/general-sign-in-title-screen.png` in both themes, and try the flows with the demo account. Report as a step for the developer to confirm.

## Dependencies

- T001 → T002 → everything else.
- T003 → T004 → T005. T006 depends on T003. T007 depends on T005, T006.
- T008 depends on T007. T009 depends on T008.
- T010, T011 depend on T002. T012 depends on T008, T010, T011. T013 depends on T012.
- T014 depends on T012. T015 depends on T008. T016, T017 depend on T011, T010.
- T018 depends on all prior tasks; T019 last.
