import { Link } from 'react-router'

// For a run that doesn't exist or isn't the player's; the API doesn't say which. Shown in the default theme,
// since there's no run to take a theme from.
export function RunNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <title>Run not found · Game Companion</title>
      <h1 className="font-display text-3xl font-semibold text-text-strong">Run not found</h1>
      <p className="text-text-muted">This run doesn’t exist, or it isn’t one of yours.</p>
      <Link to="/runs" className="text-accent-bright underline">
        Your runs
      </Link>
    </div>
  )
}
