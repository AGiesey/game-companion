# Plan: Sign In

**Spec:** `specs/003-sign-in/spec.md`
**Design source:** `web/design/README.md`, `web/design/general-sign-in-title-screen.png`
**Constitution:** 1.0.0. Front end only (I). Every account call is a stub behind `web/src/api/account.ts` (II). The seven needs are tracked in `specs/backend-needs.md` (III). Screens reuse the existing sign-in design and theme utilities (IV). Accessible forms (V). Vitest and Testing Library (VI).

## Technical Context

Builds on 001 (API layer, TanStack Query, Vitest) and 002 (themes, `Button`, ornaments, `ThemePreview`).

**New dependency:** `react-router` 8.4.x (runtime). Peer: React ≥ 19.2.7 (installed: 19.2). Used in declarative mode only: `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`, `Link`, `useLocation`, `useNavigate`, `useSearchParams`. No framework mode, loaders or actions; TanStack Query remains the data layer.

## Design Decisions

### Session as a query

- `sessionQueryKey = ['session']`.
- `useSession()` wraps `useQuery({ queryKey: sessionQueryKey, queryFn: getSession, staleTime: Infinity })`. It returns the query, whose `data` is `Session | null`.
- `getSession()` returns `null` when nobody is signed in. Against the real backend, it will map a `401` from the session endpoint to `null` too, so "nobody signed in" is never an error.
- Signing in or creating an account calls `queryClient.setQueryData(sessionQueryKey, session)`. Nothing navigates directly: the route guards react to the session changing.

### Route guards

```
<Routes>
  <Route element={<RequireSignedOut />}>        // redirects signed-in players
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/create-account" element={<CreateAccountPage />} />
  </Route>
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route element={<RequireSession />}>          // redirects signed-out players
    <Route path="/" element={<HomePage />} />
  </Route>
  {import.meta.env.DEV && <Route path="/preview" element={<ThemePreview />} />}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

- **`RequireSession`** (layout route): while the session is pending it renders `<FullPageLoading />` (FR-4). With no session it renders `<Navigate to={signInPath(location)} replace />`. Otherwise it renders `<Outlet />`.
- **`RequireSignedOut`**: pending → `<FullPageLoading />`; signed in → `<Navigate to={safeReturnPath(searchParams.get('returnTo')) ?? '/'} replace />`; otherwise `<Outlet />`. This is the single place where a successful sign-in leads somewhere: setting the session re-renders the guard, which redirects.
- `import.meta.env.DEV` is replaced with `false` in production builds, so the preview route and its imports are removed by tree-shaking (FR-1).
- `<BrowserRouter>` wraps the app in `main.tsx`. `App.tsx` renders the routes, so tests can wrap `App` in a `MemoryRouter`.

### Return paths (FR-2)

`src/account/returnPath.ts`:
- `signInPath(location)` builds `/sign-in?returnTo=<encoded pathname + search>`, leaving out `returnTo` when the path is `/`.
- `safeReturnPath(value: string | null): string | null` accepts only same-app paths. The value must start with a single `/` (not `//` or `/\`), and resolving it against the current origin with `new URL()` must keep the origin. It also rejects returning to `/sign-in` or `/create-account`. Anything else gives `null`, which means home.

### 401 ends the session (FR-6)

`createQueryClient()` in `src/queryClient.ts` adds a `QueryCache` and a `MutationCache`, each with an `onError` that calls `handleUnauthenticated(queryClient, error)`:
- If the error is an `ApiError` with status `401`, and the query or mutation doesn't set `meta: { expectsUnauthenticated: true }`, it removes every query except the session and sets the session to `null`. `RequireSession` then redirects to sign-in with the current path.
- The sign-in mutation sets `expectsUnauthenticated`, because a `401` there means wrong credentials, not an ended session.

**Retries:** queries retry once only for network errors and `5xx`, never for `4xx`. A retry won't fix a `401` or a validation error. This replaces the flat `retry: 1`.

`renderWithProviders` in tests uses `createQueryClient({ retry: false })` so tests get the same `401` handling.

### Sign out (FR-7)

`useSignOut()` runs a mutation whose `onSettled` (success or failure) calls `queryClient.clear()` and then `setQueryData(sessionQueryKey, null)`. Clearing first means no data from the old session survives. `RequireSession` then sends the player to `/sign-in`. Back to `/` hits the guard again and redirects, so no signed-in content shows.

### API layer

**`client.ts`**
- `ProblemDetails` gains `errors?: Record<string, string[]>`, and `ApiError` gains `readonly errors?: Record<string, string[]>` (FR-18).
- New helper `fieldErrorsFrom(error, fields)` in `src/account/formErrors.ts` maps `errors` keys onto form field names case-insensitively, because ASP.NET may send `Email` or `email` depending on configuration. Keys that match no field are collected as form-level messages.

**`account.ts`**: one function per need, each `// STUB: <need> (specs/backend-needs.md)`, delegating to the stub backend:

| Function | Need |
|----------|------|
| `getSession({ signal })` → `Session \| null` | Current session |
| `signIn({ email, password, remember })` → `Session` | Sign in |
| `signOut()` → `void` | Sign out |
| `createAccount({ email, password })` → `Session` | Create account |
| `requestPasswordReset({ email })` → `void` | Request a password reset |
| `resetPassword({ email, token, newPassword })` → `void` | Reset password |

`Session` is `{ userId: string; email: string }`.

**`stubs/accountStub.ts`**: an in-browser fake account server, used only by `account.ts` (SC-6).
- **Accounts** are kept in `localStorage` under `game-companion.stub.accounts`, seeded with the demo account `vaela@example.com` / `stub-password`.
- **The session** is kept under `game-companion.stub.session`: in `localStorage` when `remember` is true (like a persistent cookie), otherwise in `sessionStorage` (like a session cookie). Sign out removes it from both.
- **Failures** throw the same `ApiError`s a real backend would:
  - wrong credentials: `401`
  - email in use: `400` validation with `errors.Email`
  - password under 8 characters: `400` validation with `errors.Password`
  - bad reset token: `400` with title "Invalid or expired reset link"
- **Every operation** goes through `stub()` for realistic delay and cancellation.
- **Storage access** is wrapped in `try/catch`. If storage is blocked, the stub keeps its state in memory for the page's lifetime.
- **Reset tokens:** the demo token `stub-reset-token` is accepted for any existing account. Email matching ignores case.

### Forms

There's no form library. Each form keeps its values and errors in `useState` and submits through a TanStack `useMutation`.

- **Client validation:** pure functions in `src/account/validation.ts`, unit tested: `validateSignIn`, `validateCreateAccount`, `validateForgotPassword`, `validateResetPassword`. They return `FieldErrors` (a partial map from field to message) and check only required fields, email shape (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) and matching passwords (FR-14).
- **Server errors:** `onError` maps the error with `fieldErrorsFrom` (FR-15):
  - Sign-in `401`: "Email or password is incorrect." as a form-level error.
  - Other `ApiError`s with a title: the title.
  - Status 0: the network message.
- **Focus (FR-17):** after a failed submit, a `useEffect` keyed on an error "attempt" counter focuses the first field with an error in field order, or else the form-level error element. That element has `tabIndex={-1}` and `role="alert"`.
- **Submitting (FR-16):** `mutation.isPending` disables the primary button and switches its label.

### Components

```
src/components/
  TextField.tsx          label + input + error; aria-invalid, aria-describedby; forwards ref (React 19: ref as a prop)
  FormError.tsx          form-level error, role="alert", focusable
  FullPageLoading.tsx    centered "Loading…" status (role="status") on bg
src/account/
  AccountLayout.tsx      emblem, optional eyebrow, title, DiamondRule, tagline, bracketed card (title + children), footer slot
  SignInPage.tsx         + SignInPage.test.tsx
  CreateAccountPage.tsx  + CreateAccountPage.test.tsx
  ForgotPasswordPage.tsx + ForgotPasswordPage.test.tsx
  ResetPasswordPage.tsx  + ResetPasswordPage.test.tsx
  RequireSession.tsx, RequireSignedOut.tsx, routing.test.tsx
  useSession.ts          useSession, useSignOut, sessionQueryKey
  returnPath.ts          + returnPath.test.ts
  validation.ts          + validation.test.ts
  formErrors.ts          + formErrors.test.ts
src/home/HomePage.tsx    welcome line + Sign out (+ test)
src/NotFoundPage.tsx
```

- `AccountLayout` takes its structure from the sign-in section of `ThemePreview` (FR-13). `ThemePreview`'s sign-in section then renders `<AccountLayout>` with static content, so there's one copy of that markup.
- `TextField` uses `useId` for the input and error ids. Inputs inside the card use `bg-bg`, per the design doc.
- Copy per screen comes from spec FR-8 to FR-12. Only sign-in has the eyebrow ("Your journey continues").

### Wiring

- `main.tsx`: `QueryClientProvider` → `ThemeProvider` → `BrowserRouter` → `App`.
- `src/test/render.tsx`: `renderWithProviders(ui, { route = '/' })` wraps in a `MemoryRouter` with `initialEntries={[route]}` and returns `{ ...result, queryClient }` so tests can inspect the session.
- `src/test/setup.ts`: also clears `sessionStorage`, and calls `setStubDelays({ valueMs: 0, chunkMs: 0 })` before all tests so stub-backed pages resolve immediately.
- `App.test.tsx` becomes route-level tests: `/preview` renders the preview with the ping line, and unknown paths render not-found. The ping tests move to `src/preview/ApiStatus.test.tsx`.

### backend-needs.md

When the stubs land, each of the seven entries moves to `stubbed` with its function named (`account.ts → signIn`, and so on). The `401` entry points to `queryClient.ts → handleUnauthenticated` (SC-5).

## File Changes

| Path | Change |
|------|--------|
| `web/package.json`, lock | Add `react-router` |
| `web/src/api/client.ts` (+ test) | `errors` on `ApiError` |
| `web/src/api/account.ts`, `web/src/api/stubs/accountStub.ts` (+ tests) | New |
| `web/src/api/README.md` | Demo account and token; stub storage keys |
| `web/src/queryClient.ts` (+ test) | 401 handling, smarter retry, options |
| `web/src/account/*`, `web/src/home/*`, `web/src/NotFoundPage.tsx` | New |
| `web/src/components/TextField.tsx`, `FormError.tsx`, `FullPageLoading.tsx` | New |
| `web/src/preview/ThemePreview.tsx` | Sign-in section uses `AccountLayout` |
| `web/src/preview/ApiStatus.test.tsx` | Ping tests moved from `App.test.tsx` |
| `web/src/App.tsx`, `App.test.tsx`, `main.tsx` | Routes, router |
| `web/src/test/render.tsx`, `setup.ts` | Router, client, storage, stub delays |
| `specs/backend-needs.md` | Seven entries → `stubbed` |

## Verification

1. `npm run build`, `npm run lint`, `npm test` pass (SC-1, SC-3, SC-4).
2. `grep` finds `fetch(` only in `client.ts`, and `game-companion.stub.` only under `src/api/stubs/` (SC-6).
3. `specs/backend-needs.md` shows seven `stubbed` entries with function names (SC-5).
4. Browser run-through of every scenario against the stubs with `npm run dev` (SC-2), with headless Chrome where an interactive browser isn't available. The developer compares the sign-in screen with the mock (SC-7).
5. `git status` shows changes only under `web/` and `specs/` (SC-8).

## Risks

- **Dev server deep links:** Vite's dev and preview servers already serve `index.html` for unknown paths, so `/reset-password?...` works. Production hosting by the API will need an SPA fallback (`MapFallbackToFile("index.html")`). That's backend work, noted for the developer, and isn't added to backend-needs because it isn't an API need.
- **Cookie or token auth:** the stubs don't assume either. If the developer chooses cookies, `fetch` needs `credentials: 'same-origin'`, which is the default for same-origin requests, so no change is expected.
- **React Router 8** is a recent major. If its declarative API differs from v7 in a way that matters, the guards are the only place affected.
