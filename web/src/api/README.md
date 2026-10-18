# API layer

Everything the front end gets from the API goes through this folder (constitution principle II).

## Rules

- **One typed function per API need**, for example `getRunJournal(runId, { signal })` returning `Promise<JournalEntry[]>`. Group related functions in a file per area (`runs.ts`, `journal.ts`).
- **Components never call `fetch`.** `client.ts` is the only file that does.
- **Components read data through TanStack Query**:
  ```tsx
  const journal = useQuery({
    queryKey: ['runs', runId, 'journal'],
    queryFn: ({ signal }) => getRunJournal(runId, { signal }),
  })
  ```
  The one exception is a streamed companion reply, which a custom hook consumes directly and which invalidates the affected queries when it completes.
- **Pass `signal` through** so TanStack Query can cancel requests it no longer needs.

## Real calls

Use `apiGet` and `apiSend` from `client.ts`. Paths are relative to `/api`.

```ts
export function getPing({ signal }: RequestOptions = {}): Promise<PingResponse> {
  return apiGet<PingResponse>('/ping', { signal })
}
```

Failures throw `ApiError`:
- `status`: the HTTP status, or `0` when the server couldn't be reached.
- `title`, `detail`, `type`: from the ProblemDetails body, when the API sent one.
- `message`: something safe to show the user (the ProblemDetails title, or a generic message).

## Stubs

When a feature needs data the API doesn't provide yet, write the function anyway and make its body a stub:

```ts
// STUB: Run journal entries, newest first (specs/backend-needs.md)
export function getRunJournal(runId: string, { signal }: RequestOptions = {}): Promise<JournalEntry[]> {
  return stub(
    [{ id: 'j1', text: 'Defeated Rennala, Queen of the Full Moon.', createdAt: '2026-10-18T19:00:00Z' }],
    { signal },
  )
}
```

- Mark it `// STUB: <need>`, naming its entry in `specs/backend-needs.md`, and set that entry's status to `stubbed`.
- Return realistic sample data of the right type. Stubs never guess routes or DTO shapes; they only fix the shape the UI needs.
- For streams, use `stubStream(chunks, { signal })`, an async generator that yields each chunk after a short delay.
- Stubs wait 400 ms (40 ms per stream chunk) so loading states are visible. Tests call `setStubDelays({ valueMs: 0, chunkMs: 0 })`.

## Replacing a stub

When the endpoint exists:

1. Replace the stub's body with `apiGet` or `apiSend` and remove the `// STUB` comment.
2. If the real response shape differs from the stub's type, update the type. TypeScript then shows every component that needs adjusting.
3. Mark the need `done` in `specs/backend-needs.md`.

Components and hooks don't change.
