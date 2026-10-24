import { useSignOut } from '../account/useSession.ts'
import { Button } from '../components/Button.tsx'

export function RunListPage() {
  const signOut = useSignOut()

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-semibold text-text-strong">Your runs</h1>
      <Button disabled={signOut.isPending} onClick={() => signOut.mutate()}>
        {signOut.isPending ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  )
}
