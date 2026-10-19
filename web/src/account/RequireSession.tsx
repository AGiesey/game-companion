import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoading } from '../components/FullPageLoading.tsx'
import { signInPath } from './returnPath.ts'
import { useSession } from './useSession.ts'

// Layout route for screens that need a signed-in player. Signed-out players go to sign-in,
// which brings them back here afterwards.
export function RequireSession() {
  const session = useSession()
  const location = useLocation()

  if (session.isPending) return <FullPageLoading />
  if (!session.data) return <Navigate to={signInPath(location)} replace />
  return <Outlet />
}
