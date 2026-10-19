import { useSession } from '../account/useSession.ts'

// Placeholder signed-in screen until the run list feature replaces it.
export function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="font-display text-3xl font-semibold text-text-strong">Welcome back</h1>
      <p className="text-text-muted">Signed in as {session?.email}</p>
    </div>
  )
}
