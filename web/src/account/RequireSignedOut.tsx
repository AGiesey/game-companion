import { Navigate, Outlet, useSearchParams } from 'react-router'
import { FullPageLoading } from '../components/FullPageLoading.tsx'
import { safeReturnPath } from './returnPath.ts'
import { useSession } from './useSession.ts'

// Layout route for sign-in and create account. Once a session exists (already signed in, or just signed in
// on the page below), this sends the player on: to the remembered path if it's safe, otherwise home.
export function RequireSignedOut() {
  const session = useSession()
  const [searchParams] = useSearchParams()

  if (session.isPending) return <FullPageLoading />
  if (session.data) return <Navigate to={safeReturnPath(searchParams.get('returnTo')) ?? '/'} replace />
  return <Outlet />
}
