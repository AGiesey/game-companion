import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { recordRunOpened } from '../api/runs.ts'
import { runsQueryKey } from './runQueries.ts'

// Tells the API the player opened this run, once per arrival on its screen (spec FR-5, FR-6), and only once the
// run has loaded, so a run that isn't found isn't recorded. An arrival is a history entry: re-renders, refetches
// and StrictMode's second development-only effect run keep the same location.key and are skipped; coming back
// to the run later is a new entry and records again. Failures are silent: the run screen works without it.
export function useRecordRunOpened(runId: string, loaded: boolean): void {
  const queryClient = useQueryClient()
  const { key } = useLocation()
  const recorded = useRef<string | null>(null)
  const { mutate } = useMutation({
    mutationFn: recordRunOpened,
    // The list's order, and so the landing, depend on when runs were opened.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: runsQueryKey, exact: true }),
  })

  useEffect(() => {
    const arrival = `${runId}:${key}`
    if (!loaded || recorded.current === arrival) return
    recorded.current = arrival
    mutate(runId)
  }, [runId, loaded, key, mutate])
}
