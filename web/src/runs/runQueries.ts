import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRun, getRun, listRuns } from '../api/runs.ts'

// Both keys start with 'runs', so ending the session (endSession) forgets every run.
export const runsQueryKey = ['runs'] as const
export const runQueryKey = (runId: string) => ['runs', runId] as const

// The player's runs, most recently opened first.
export function useRuns() {
  return useQuery({
    queryKey: runsQueryKey,
    queryFn: ({ signal }) => listRuns({ signal }),
  })
}

export function useRun(runId: string) {
  return useQuery({
    queryKey: runQueryKey(runId),
    queryFn: ({ signal }) => getRun(runId, { signal }),
  })
}

// On success the new run is cached, so its screen shows without loading, and the list is fetched again.
// The refetch isn't awaited: the player shouldn't wait for the list before arriving in the new run.
export function useCreateRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRun,
    onSuccess: (run) => {
      queryClient.setQueryData(runQueryKey(run.id), run)
      void queryClient.invalidateQueries({ queryKey: runsQueryKey, exact: true })
    },
  })
}
