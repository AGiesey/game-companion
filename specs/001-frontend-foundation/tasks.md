# Tasks: Front-End Foundation

**Spec:** `spec.md` · **Plan:** `plan.md` · All paths are relative to the repo root. All work stays in `web/`.

Each task ends with a local commit naming the feature and task (for example `001-frontend-foundation T003: Add Tailwind`). Run commands from `web/`.

## Phase 1: Setup

- [x] [T001] Install runtime dependency `@tanstack/react-query` and dev dependencies `tailwindcss`, `@tailwindcss/vite`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom` in `web/package.json` (and `web/package-lock.json`). Confirm `npm run build` still passes.
- [x] [T002] Enable `"strict": true` in `web/tsconfig.app.json` and `web/tsconfig.node.json`; fix any type errors it surfaces. `npm run build` passes. (FR-3)

## Phase 2: Foundational

- [x] [T003] Add Tailwind: register `tailwindcss()` from `@tailwindcss/vite` in `web/vite.config.ts`; create `web/src/styles/index.css` importing `tailwindcss` and `./fonts.css`; change `web/src/main.tsx` to import `./styles/index.css` instead of `./styles/fonts.css`. (FR-1)
- [x] [T004] Configure Vitest: switch `web/vite.config.ts` to `defineConfig` from `vitest/config` with a `test` block (`environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, `include: ['src/**/*.test.{ts,tsx}']`); create `web/src/test/setup.ts` (jest-dom matchers via `@testing-library/jest-dom/vitest`, `afterEach(cleanup)`); add `"test": "vitest run"` and `"test:watch": "vitest"` to `web/package.json`. Add a throwaway smoke test, confirm `npm test` passes and `npm run build` type-checks it, then delete it. (FR-2)
- [x] [T005] Add TanStack Query: create `web/src/queryClient.ts` exporting `createQueryClient()` (queries `retry: 1`); wrap `<App />` in `<QueryClientProvider>` in `web/src/main.tsx` with a client created once. Create `web/src/test/render.tsx` exporting `renderWithQuery(ui)` that renders inside a fresh client with `retry: false`. (FR-4)

## Phase 3: User Story — Calling real endpoints with readable errors (scenarios 3, 7)

- [x] [T006] Create `web/src/api/client.ts`: `ApiError` (explicit `status`, `title?`, `detail?`, `type?` fields) and `apiGet<T>` / `apiSend<T>` over a shared `request<T>()` that prefixes `/api`, sends/parses JSON, passes `signal`, returns `undefined` for 204, maps ProblemDetails and non-ProblemDetails failures to `ApiError`, maps network `TypeError` to `ApiError` with status 0, and rethrows `AbortError` unchanged. (FR-5, FR-6, FR-7)
- [x] [T007] Create `web/src/api/client.test.ts` with `fetch` stubbed via `vi.stubGlobal`: JSON success; ProblemDetails error → `ApiError` with title, detail, status; plain-text error → `ApiError` with status and generic message; network failure → `ApiError` status 0. (FR-11)

## Phase 4: User Story — Stubbing endpoints that don't exist yet (scenarios 4, 6)

- [x] [T008] Create `web/src/api/stub.ts`: `stub<T>(data, { signal?, delayMs? })` (rejects with the abort reason when aborted), `stubStream(chunks, { signal?, delayMs? })` async generator (stops when aborted), default delays 400 ms / 40 ms, and `setStubDelays({ valueMs, chunkMs })`. (FR-8)
- [x] [T009] Create `web/src/api/stub.test.ts` with delays set to 0: `stub` resolves with its data; `stubStream` yields all chunks in order; aborting `stub` rejects with an `AbortError`. (FR-11)
- [x] [T010] Create `web/src/api/README.md` documenting the API layer: one typed function per need, components use TanStack Query (or a custom hook for streams), the `// STUB: <need>` convention linked to `specs/backend-needs.md`, and how to replace a stub body with `apiGet`/`apiSend` without touching components. (FR-9, scenario 5)

## Phase 5: User Story — Ping on the new pattern (scenario 3)

- [x] [T011] Create `web/src/api/ping.ts` with `PingResponse` and `getPing({ signal })` calling `apiGet<PingResponse>('/ping', { signal })`; rewrite `web/src/App.tsx` to read it with `useQuery({ queryKey: ['ping'], ... })`, keeping the three states (loading text, message and server time, `role="alert"` error), and add one Tailwind utility class to `<main>`. (FR-10)
- [x] [T012] Create `web/src/App.test.tsx` using `renderWithQuery` and `vi.mock('./api/ping')`: shows the loading text, then the ping message; shows the error alert when `getPing` rejects. (FR-11)

## Phase 6: Polish and verification

- [x] [T013] Verify success criteria: `npm run build`, `npm run lint` and `npm test` pass (SC-1); the built CSS in `web/dist/assets/` contains the rule for the Tailwind class used in `App.tsx` (SC-2); temporarily break the expected ping message to confirm `npm test` fails, then restore (SC-3); `fetch(` appears under `web/src` only in `web/src/api/client.ts` (SC-4); `git status` shows changes only under `web/` and `specs/001-frontend-foundation/` (SC-6). Fix anything that fails.
- [ ] [T014] Manual check for the developer (SC-5): with `aspire run`, the page shows the API's ping message; with the API stopped, the error alert appears. Not automated; report as a step for the developer to confirm.

## Dependencies

- T001 → everything else.
- T002 can run any time after T001; do it early so later code is written strict.
- T003, T004, T005 depend on T001. T004 must precede every test task (T007, T009, T012). T005 must precede T011 and T012.
- T006 → T007, T011. T008 → T009, T010.
- T011 → T012 → T013 → T014.
