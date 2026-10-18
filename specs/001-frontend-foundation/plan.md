# Plan: Front-End Foundation

**Spec:** `specs/001-frontend-foundation/spec.md`
**Constitution:** 1.0.0. All work stays in `web/` (principle I). No API needs (principle II).

## Technical Context

**Current state of `web/`:** React 19.2, TypeScript 6.0, Vite 8.3, oxlint. `vite.config.ts` already proxies `/api` to the API using the URL Aspire injects (`API_HTTPS` / `API_HTTP`). `App.tsx` calls `fetch('/api/ping')` in a `useEffect`. `main.tsx` imports `styles/fonts.css`. `tsconfig.app.json` has no `strict`.

**Dependencies to add** (latest versions as of planning; install with `npm install`, which records caret ranges):

| Package | Version | Kind | Purpose |
|---------|---------|------|---------|
| `tailwindcss` | 4.3.x | dev | Tailwind v4 engine |
| `@tailwindcss/vite` | 4.3.x | dev | Vite plugin (peer: Vite 5–8) |
| `@tanstack/react-query` | 5.104.x | runtime | Server data |
| `vitest` | 5.0.x | dev | Test runner (peer: Vite 6–8) |
| `jsdom` | 30.1.x | dev | Test DOM environment |
| `@testing-library/react` | 16.3.x | dev | Rendering and queries |
| `@testing-library/dom` | 10.4.x | dev | Peer of the React library |
| `@testing-library/user-event` | 14.6.x | dev | Realistic interactions |
| `@testing-library/jest-dom` | 7.0.x | dev | DOM matchers |

All are compatible with the installed Vite 8.3 and React 19.

## Design Decisions

### Tailwind v4, CSS-first

- Add `tailwindcss()` from `@tailwindcss/vite` to the Vite plugins, next to `react()`.
- New `src/styles/index.css` is the single global stylesheet:
  ```css
  @import 'tailwindcss';
  @import './fonts.css';
  ```
- `main.tsx` imports `./styles/index.css` instead of `./styles/fonts.css`.
- No `tailwind.config.js` and no `@theme` block yet. Tailwind v4 finds class names in source files automatically. Theme tokens arrive with the theme foundation feature.

### Vitest configured inside `vite.config.ts`

- Switch the `defineConfig` import to `vitest/config`, which accepts both Vite options and a `test` block, so the app and tests share one plugin setup.
- `test` options: `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, `include: ['src/**/*.test.{ts,tsx}']`.
- No globals (`globals: false`): tests import `describe`, `it`, `expect` and `vi` from `vitest`, which keeps imports explicit and avoids global types.
- Because globals are off, React Testing Library can't register its automatic cleanup, so the setup file does it:
  ```ts
  import '@testing-library/jest-dom/vitest'
  import { cleanup } from '@testing-library/react'
  import { afterEach } from 'vitest'
  afterEach(() => cleanup())
  ```
  The `@testing-library/jest-dom/vitest` entry point adds the matchers to Vitest's `expect` and supplies their TypeScript types.
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
- Test files sit next to the code they test (`client.test.ts` beside `client.ts`) and are covered by `tsconfig.app.json`, so `tsc -b` type-checks them.

### TypeScript strict

- Add `"strict": true` to `tsconfig.app.json` and `tsconfig.node.json`. Fix anything it surfaces (the current code is small and expected to pass).

### TanStack Query

- `src/queryClient.ts` exports `createQueryClient()`, returning a client with `defaultOptions.queries.retry: 1`.
- `main.tsx` calls it once at module level and wraps `<App />` in `<QueryClientProvider>`.
- `src/test/render.tsx` exports `renderWithQuery(ui)`: it creates a fresh client with `retry: false` (so error tests don't wait for a retry) and renders inside its provider. It returns the React Testing Library result.

### API layer (`src/api/`)

```
src/api/
  README.md        conventions: one function per need, stubs, swapping a stub for a real call
  client.ts        apiGet / apiSend, ApiError
  client.test.ts
  stub.ts          stub(), stubStream(), setStubDelays()
  stub.test.ts
  ping.ts          getPing(), PingResponse
```

**`client.ts`**
- `ApiError extends Error` with `status: number`, `title?: string`, `detail?: string`, `type?: string`. Declared with explicit fields, not TypeScript constructor parameter properties, which `erasableSyntaxOnly` (already on) forbids.
- `apiGet<T>(path, { signal })` and `apiSend<T>(method, path, body, { signal })` both go through one private `request<T>()`:
  - URL is `/api` + `path`.
  - Sends `Accept: application/json`; for bodies, `Content-Type: application/json` and `JSON.stringify(body)`.
  - On success, returns `await response.json() as T` (or `undefined` for `204 No Content`).
  - On failure, if `Content-Type` includes `application/problem+json`, parses it and throws `ApiError` with its `title`, `detail` and `type`. Otherwise it throws `ApiError` with the status and `"Request failed (<status>)"`.
  - Network errors from `fetch` (a `TypeError`) are rethrown as `ApiError` with `status: 0` and a "couldn't reach the server" message, so the UI handles one error type. An abort (`AbortError`) is rethrown unchanged so TanStack Query treats it as cancellation, not failure.
- Responses are cast to `T`, not validated at runtime. Runtime validation (for example with Zod) is a possible later addition and is out of scope here.

**`stub.ts`**
- `stub<T>(data: T, options?: { signal?: AbortSignal; delayMs?: number }): Promise<T>` waits, then resolves with the data. If the signal aborts first, it rejects with the signal's reason (a `DOMException` named `AbortError`), matching `fetch`.
- `stubStream(chunks: string[], options?: { signal?; delayMs? }): AsyncGenerator<string>` yields each chunk after a delay and returns early if aborted. Typed on `string` chunks for now (the companion reply); widened to a generic only when a feature needs it.
- Module-level defaults (400 ms for values, 40 ms per chunk) with `setStubDelays({ valueMs, chunkMs })` so tests set both to 0. Per-call `delayMs` overrides the defaults.

**`ping.ts`**
- `PingResponse { message: string; serverTime: string }` moves here from `App.tsx`.
- `getPing({ signal })` returns `apiGet<PingResponse>('/ping', { signal })`. This is a real call, not a stub, because the endpoint exists.

### App

- `App.tsx` uses `useQuery({ queryKey: ['ping'], queryFn: ({ signal }) => getPing({ signal }) })`.
- It renders the same three states as today: "Pinging API…" while pending; the message and server time on success; the error message in a `role="alert"` paragraph on failure.
- Add one Tailwind utility (for example padding on `<main>`) to prove the pipeline end to end (SC-2). The real styling comes with the theme foundation.

### Tests

| File | Covers |
|------|--------|
| `src/api/client.test.ts` | JSON success; ProblemDetails → `ApiError` with title, detail, status; plain-text error → `ApiError` with status; network failure → `ApiError` status 0. `fetch` is replaced with `vi.stubGlobal('fetch', vi.fn())` and restored after each test. |
| `src/api/stub.test.ts` | `stub` resolves with its data; `stubStream` yields all chunks in order; an aborted `stub` rejects with `AbortError`. Delays set to 0. |
| `src/App.test.tsx` | Loading text, then the ping message (via `findByText`); error alert when `getPing` rejects. `getPing` is mocked with `vi.mock('./api/ping')`, so the test exercises the component, not `fetch`. |

## File Changes

| Path | Change |
|------|--------|
| `web/package.json`, `web/package-lock.json` | New dependencies, `test` and `test:watch` scripts |
| `web/vite.config.ts` | Tailwind plugin, `vitest/config`, `test` block |
| `web/tsconfig.app.json`, `web/tsconfig.node.json` | `strict: true` |
| `web/src/styles/index.css` | New global stylesheet |
| `web/src/main.tsx` | Import `index.css`; add `QueryClientProvider` |
| `web/src/queryClient.ts` | New |
| `web/src/api/*` | New (see above) |
| `web/src/App.tsx` | Moves to `useQuery` and `getPing` |
| `web/src/App.test.tsx` | New |
| `web/src/test/setup.ts`, `web/src/test/render.tsx` | New |

Nothing outside `web/` changes.

## Verification

1. From `web/`: `npm run build`, `npm run lint` and `npm test` all pass (SC-1, SC-3).
2. The built CSS in `dist/assets/` contains the rule for the Tailwind utility used in `App.tsx` (SC-2).
3. Searching `web/src` for `fetch(` finds it only in `src/api/client.ts` (SC-4).
4. With `aspire run`, the page shows the ping; with the API stopped, the error alert appears (SC-5). This step is manual.
5. `git status` shows changes only under `web/` and `specs/001-frontend-foundation/` (SC-6).

## Risks

- **jest-dom 7 is a new major.** If its Vitest entry point or type setup differs from what's described above, follow its README; only `src/test/setup.ts` is affected.
- **Strict mode** may surface type errors in existing code. Expected to be none or trivial.
