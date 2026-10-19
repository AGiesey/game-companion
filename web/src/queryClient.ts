import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { sessionQueryKey } from './account/sessionQueryKey.ts'
import { ApiError } from './api/client.ts'

interface AppMeta extends Record<string, unknown> {
  // Set when a 401 is an expected answer (wrong password on sign-in) rather than an ended session.
  expectsUnauthenticated?: boolean
}

// Types the `meta` option on every query and mutation.
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: AppMeta
    mutationMeta: AppMeta
  }
}

// Forget everything cached for the session and mark nobody signed in. The session query itself is updated,
// not removed: components watching it would stay attached to a removed query and never see the change.
export function endSession(queryClient: QueryClient): void {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionQueryKey[0] })
  queryClient.setQueryData(sessionQueryKey, null)
}

// A 401 means the session has ended. RequireSession then sends the player to sign-in, remembering where they were.
export function handleUnauthenticated(queryClient: QueryClient, error: unknown, meta: AppMeta | undefined): void {
  if (!(error instanceof ApiError) || error.status !== 401 || meta?.expectsUnauthenticated) return
  endSession(queryClient)
}

// Retry once, and only when trying again could help: the server was unreachable or failed.
// A 4xx (unauthenticated, validation, not found) gets the same answer the second time.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && error instanceof ApiError && (error.status === 0 || error.status >= 500)
}

export function createQueryClient({ retry = true }: { retry?: boolean } = {}): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => handleUnauthenticated(queryClient, error, query.meta),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => handleUnauthenticated(queryClient, error, mutation.meta),
    }),
    defaultOptions: {
      queries: { retry: retry ? shouldRetry : false },
    },
  })
  return queryClient
}
