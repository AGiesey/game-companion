# Game Companion Front End Constitution

Game Companion is a personal AI gameplay companion: a friend who's played the game, hanging out while you play. This constitution governs Spec Kit work, which covers the React front end only. `CLAUDE.md` holds the wider project instructions; where they overlap, both apply.

## Core Principles

### I. Front End Only (NON-NEGOTIABLE)

Spec Kit work is limited to `web/`. Specs, plans, tasks, implementation and converge MUST NOT create, modify or plan work for anything outside `web/`: no `GameCompanion.*` projects, no AppHost, no .NET code of any kind. The backend is written by hand by the developer.

### II. The API Is a Contract the Front End Consumes

Specs describe what a feature needs from the API in plain terms ("list a run's journal entries, newest first, paged"), never endpoint designs, routes or DTO shapes; those are the developer's call.

- Every spec has an **API needs** section. If the feature needs nothing new, it says so.
- All API access goes through typed functions in `web/src/api/`, one per need (for example `getRunJournal(runId): Promise<JournalEntry[]>`). Components never call `fetch` directly; they use TanStack Query hooks that call these functions.
- Until the developer builds the endpoint, the function is a **stub**: it returns realistic, typed sample data after a short delay (streaming needs use an async generator that yields chunks), is marked `// STUB: <need>` and references its entry in `specs/backend-needs.md`. Stubs never guess routes or DTO shapes.
- Replacing a stub with a real call changes only that function's body (and its types, if the real shape differs); components and hooks stay as they are.
- A feature is front-end complete when it works against its stubs. Converge treats an open API need as the developer's work, never as unbuilt front-end work to append.

### III. Surface Backend Work to the Developer

The developer must always know when the front end is waiting on backend work.

- `specs/backend-needs.md` is the single running list of open API needs across features: one entry per need with the feature, what's needed, why, the stub function in `web/src/api/`, and a status (`open`, `stubbed`, `done`).
- `/speckit-specify`, `/speckit-plan` and `/speckit-converge` add or update entries whenever API needs change, and `/speckit-implement` moves an entry to `stubbed` when its stub exists. Only the developer marks an entry `done`, after replacing the stub with a real call.
- Any command that adds or changes an entry ends its reply with a one-line summary, for example: "Backend work needed: 2 new items in `specs/backend-needs.md`."

### IV. The Look Comes from the Developer's Design

Visual design comes from the developer's mocks in `web/design/` and fonts in `web/src/assets/fonts/`. Spec Kit MUST NOT invent a palette, typography or visual style. Until the design is imported, any work that depends on it is blocked on it. The first visual feature is a theme foundation: Tailwind theme tokens (colors, type, spacing) and fonts derived from the mocks, plus the base layout.

### V. Accessible by Default, Not by Audit

Every feature uses semantic HTML, is fully usable by keyboard, has visible focus, labels every control, keeps text readable against its background and respects `prefers-reduced-motion`. No formal WCAG audit is required.

### VI. Tested with Vitest and React Testing Library

Behavior is tested with Vitest and React Testing Library, querying the way a user would (by role, label and text) rather than by implementation details. Each feature's tasks include tests for its user scenarios.

## Stack and Conventions

- React with TypeScript in strict mode, built with Vite, served as static files by the API.
- Styling with Tailwind. Theme values live in the Tailwind theme, not scattered literals.
- Server data through TanStack Query, calling the functions in `web/src/api/`. The one exception is the streamed companion reply: a custom hook (for example `useCompanionReply`) consumes the async stream and accumulates the text, then invalidates the affected queries (such as the run journal and Lore So Far) when the reply completes.
- Streaming companion replies arrive as Server-Sent Events; API errors arrive as ProblemDetails and are shown to the user in plain language.
- Spoilers: the backend's spoiler check decides what's safe to show. The UI never fetches, caches or reveals game knowledge the API hasn't returned for display.
- Use the project's terms consistently in UI copy, code and specs: **run** (not playthrough), **conversation**, **companion**, **game knowledge**, **run journal**, **Lore So Far**.
- Linting with oxlint; the build (`tsc -b && vite build`) must pass with no errors.

## Development Workflow

- Per feature: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` → `/speckit-converge`, repeating implement and converge until the code matches the spec (blocked API needs excepted).
- During implement and converge, commit locally after each completed task with a message naming the feature and task. Never push; the developer pushes.
- The developer may build some React by hand; Spec Kit follows their lead and does not overwrite hand-written work without asking.

## Governance

This constitution governs all Spec Kit artifacts and commands in this repository. Amendments are made with `/speckit-constitution`, bump the version (major for removed or redefined principles, minor for added ones, patch for wording) and are committed on their own.

**Version**: 1.0.0 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-18
