import { useSession, useSignOut } from '../account/useSession.ts'
import { Button } from '../components/Button.tsx'

// Placeholder signed-in screen until the run list feature replaces it.
export function HomePage() {
  const { data: session } = useSession()
  const signOut = useSignOut()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="font-display text-3xl font-semibold text-text-strong">Welcome back</h1>
      <p className="text-text-muted">Signed in as {session?.email}</p>
      <Button disabled={signOut.isPending} onClick={() => signOut.mutate()}>
        {signOut.isPending ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  )
}
