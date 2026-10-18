# Feature: Front-End Foundation

**Feature directory:** `specs/001-frontend-foundation`
**Status:** Draft

## Overview

Set up the tooling and patterns every later front-end feature builds on, so feature work can start straight away and follow the constitution from day one. After this feature, `web/` has Tailwind for styling, Vitest with React Testing Library for tests, TanStack Query for server data, and the `web/src/api/` pattern for API access, including helpers for stubbing API needs until the developer builds them.

The existing ping check in `App.tsx`, which calls `fetch` directly, is moved onto the new pattern as the first real example.

No visual design work is in scope. Theme tokens, the General and Elden Ring themes and theme switching belong to the theme foundation feature that follows.

## Users

The only user of this feature is the developer (and Spec Kit) building later features. "User scenarios" below are developer workflows.

## User Scenarios

1. **Style a component with Tailwind.** The developer adds Tailwind utility classes to a component and sees them applied in `npm run dev` and in the production build, with no extra configuration.
2. **Write and run a component test.** The developer writes a test that renders a component and queries it by role, label or text, runs `npm test`, and sees it pass or fail with a readable message. A watch mode is available for working iteratively.
3. **Add data from an endpoint that exists.** The developer adds a typed function to `web/src/api/` that calls a real endpoint, uses it in a component through a TanStack Query hook, and gets loading, success and error states without writing that plumbing by hand.
4. **Add data from an endpoint that doesn't exist yet.** The developer (or Spec Kit) writes a stub function in `web/src/api/` that returns typed sample data after a short delay, marked `// STUB: <need>`, and the UI works against it exactly as it would against the real endpoint.
5. **Replace a stub with the real endpoint.** Once the endpoint is built, the developer changes only the stub function's body to call the real endpoint. No component or hook changes.
6. **Stream a response before SSE exists.** For a streamed need (such as the companion reply), a stub yields text chunks with small delays through an async generator, so streaming UI can be built and tested before the real stream is wired up.
7. **See a readable API error.** When an endpoint returns a ProblemDetails error, the UI receives a typed error carrying the problem's title, detail and status, which it can show in plain language.

## Functional Requirements

### Tooling

- **FR-1 Tailwind.** Tailwind CSS v4 is installed and wired into the Vite build through its official Vite plugin. A single global stylesheet is the entry point and imports Tailwind and `web/src/styles/fonts.css`. Utility classes used in components appear in both dev and production output.
- **FR-2 Tests.** Vitest, React Testing Library, `@testing-library/user-event`, `@testing-library/jest-dom` and a browser-like DOM environment (jsdom) are installed. `npm test` runs all tests once and exits non-zero on failure; `npm run test:watch` runs in watch mode. jest-dom matchers (for example `toBeInTheDocument`) are available in every test without importing them, with TypeScript types.
- **FR-3 TypeScript strict mode.** `strict` is enabled for the app and test code, as the constitution requires. The build (`tsc -b && vite build`) and lint (`npm run lint`) pass with no errors.
- **FR-4 TanStack Query.** TanStack Query v5 is installed. The app is wrapped in a `QueryClientProvider` with one shared client, created once at startup. Tests can render components inside a fresh client per test so cached data never leaks between tests.

### API access pattern (`web/src/api/`)

- **FR-5 One function per need.** API access lives in typed functions in `web/src/api/`, each returning a `Promise` of a typed result (or an async iterable for streams). Components never call `fetch` directly.
- **FR-6 Real-call helper.** A shared helper performs real requests: it prefixes the API base path (`/api`), sends and parses JSON, and passes through an `AbortSignal` so TanStack Query can cancel requests.
- **FR-7 ProblemDetails errors.** When a response is not successful, the helper throws a typed `ApiError` carrying the HTTP status and, when the body is ProblemDetails (`application/problem+json`), its `title`, `detail` and `type`. A non-ProblemDetails failure still produces an `ApiError` with the status and a generic message. Network failures also surface as an error the UI can display.
- **FR-8 Stub helpers.** Shared helpers make stubs consistent:
  - A value stub resolves with the given typed data after a short delay (default a few hundred milliseconds, overridable), and respects an `AbortSignal`.
  - A stream stub yields the given chunks one at a time with a short delay between them, as an async generator, and stops when aborted.
  - Tests can set the delay to zero so they run fast.
- **FR-9 Stub convention.** Every stub function is marked with a `// STUB: <need>` comment naming its entry in `specs/backend-needs.md`. The convention is documented in a short `web/src/api/README.md`, including how to replace a stub with a real call.
- **FR-10 Ping on the new pattern.** The existing `/api/ping` check moves to a `getPing()` function in `web/src/api/` using the real-call helper (the endpoint already exists, so it is not a stub). `App.tsx` reads it through `useQuery` and shows the same three states as today: loading, the ping message and server time, or an error shown with `role="alert"`.

### Tests

- **FR-11 Foundation tests.** Tests cover:
  - The real-call helper: success parses JSON; a ProblemDetails response throws `ApiError` with title, detail and status; a non-JSON error still throws `ApiError`. `fetch` is replaced with a test double; no network is used.
  - The value stub returns its data, and the stream stub yields every chunk in order.
  - `App` shows the loading state, then the ping result, and shows the error state when `getPing` fails, using a fresh query client per test.

## API Needs

None. This feature only uses `/api/ping`, which already exists. No entries are added to `specs/backend-needs.md`.

## Out of Scope

- Theme tokens, the General and Elden Ring themes, theme switching, and applying the fonts to text (theme foundation feature).
- Routing, authentication and any product screens.
- Real Server-Sent Events handling. Only the stream stub is in scope; the real SSE client comes with the conversation feature.
- Changes outside `web/`.

## Defaults Chosen

- **Tailwind v4** with `@tailwindcss/vite`, configured in CSS (`@theme`), with no `tailwind.config.js`.
- **jsdom** as the test DOM environment.
- **TanStack Query defaults** are kept except retries: queries retry once instead of three times, so stub and API errors show up quickly during development. React Query Devtools are not included.
- **Stub delay** defaults to 400 ms for values and 40 ms between stream chunks.
- **Global stylesheet** at `web/src/styles/index.css`, imported once from `main.tsx` in place of the direct `fonts.css` import.

## Success Criteria

- **SC-1** `npm run build`, `npm run lint` and `npm test` all succeed from `web/` on a clean install.
- **SC-2** A Tailwind utility class on an element in `App.tsx` produces the matching CSS in the built stylesheet.
- **SC-3** All FR-11 tests pass, and deliberately breaking one (for example changing the expected ping message) makes `npm test` fail.
- **SC-4** No file under `web/src/` outside `web/src/api/` calls `fetch`.
- **SC-5** With the Aspire app running, the page shows the ping message from the API; with the API stopped, it shows the error state.
- **SC-6** Nothing outside `web/` (and this feature's spec folder) is changed.
