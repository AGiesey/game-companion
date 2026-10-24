import { Link } from 'react-router'
import { useSignOut } from '../account/useSession.ts'
import { Button } from '../components/Button.tsx'
import { buttonClasses } from '../components/buttonClasses.ts'
import { FormError } from '../components/FormError.tsx'
import { RunListItem } from './RunListItem.tsx'
import { useRuns } from './runQueries.ts'

// Where the player switches runs or starts one. Always in the player's default theme (RequireSession), never a run's.
export function RunListPage() {
  const runs = useRuns()
  const signOut = useSignOut()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 px-4 py-8">
      <title>Your runs · Game Companion</title>
      <h1 className="font-display text-3xl font-semibold text-text-strong">Your runs</h1>

      {runs.isPending && (
        <p role="status" className="text-text-muted">
          Loading your runs…
        </p>
      )}

      {runs.isError && (
        <div className="flex flex-col gap-3">
          <FormError message={runs.error.message} />
          <Button disabled={runs.isFetching} onClick={() => void runs.refetch()}>
            {runs.isFetching ? 'Trying again…' : 'Try again'}
          </Button>
        </div>
      )}

      {runs.isSuccess &&
        (runs.data.length > 0 ? (
          <ul className="divide-y divide-border-list">
            {runs.data.map((run) => (
              <RunListItem key={run.id} run={run} />
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">No runs yet. Start one when you begin a game.</p>
        ))}

      <div className="flex flex-col gap-3">
        <Link to="/runs/new" className={`text-center ${buttonClasses('primary')}`}>
          New run
        </Link>
        <Button disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </div>
  )
}
