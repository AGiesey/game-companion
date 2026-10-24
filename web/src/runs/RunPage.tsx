import { useParams } from 'react-router'
import { ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { FormError } from '../components/FormError.tsx'
import { FullPageLoading } from '../components/FullPageLoading.tsx'
import { gameName } from '../games/games.ts'
import { useRunTheme } from '../theme/useThemeSources.ts'
import { RunHeader } from './RunHeader.tsx'
import { RunNotFound } from './RunNotFound.tsx'
import { useRun } from './runQueries.ts'
import { useRecordRunOpened } from './useRecordRunOpened.ts'

// A placeholder for now: the run's header in the run's theme. The conversation and run panel come later.
export function RunPage() {
  // The route only matches with a run id.
  const { runId = '' } = useParams()
  const run = useRun(runId)
  // A run without a theme, or with one that no longer exists, follows the player's default.
  useRunTheme(run.data?.themeId)
  useRecordRunOpened(runId, run.isSuccess)

  if (run.isPending) return <FullPageLoading />
  if (run.isError) {
    if (run.error instanceof ApiError && run.error.status === 404) return <RunNotFound />
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 px-4">
        <FormError message={run.error.message} />
        <Button disabled={run.isFetching} onClick={() => void run.refetch()}>
          {run.isFetching ? 'Trying again…' : 'Try again'}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col px-4">
      <title>{`${run.data.name} · Game Companion`}</title>
      <RunHeader title={run.data.name} subtitle={gameName(run.data.gameId)} />
      <p className="my-auto py-12 text-center text-text-muted">Your conversation with the companion will appear here.</p>
    </div>
  )
}
