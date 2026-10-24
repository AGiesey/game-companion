import { Navigate } from 'react-router'
import { FullPageLoading } from '../components/FullPageLoading.tsx'
import { useRuns } from './runQueries.ts'

// "/" isn't a screen: it sends the player to their most recent run, or to the run list when they have none.
// Every redirect replaces "/" in the history, so Back never comes here. If the list fails to load, the run
// list shows the error and a way to try again.
export function LandingPage() {
  const runs = useRuns()

  if (runs.isPending) return <FullPageLoading />
  if (runs.isError) return <Navigate to="/runs" replace />
  const mostRecent = runs.data[0]
  return <Navigate to={mostRecent ? `/runs/${mostRecent.id}` : '/runs'} replace />
}
