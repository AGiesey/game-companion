import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoading } from '../components/FullPageLoading.tsx'
import { playerDefaultThemeId } from '../theme/themes.ts'
import { useUserTheme } from '../theme/useThemeSources.ts'
import { signInPath } from './returnPath.ts'
import { useSession } from './useSession.ts'

// Layout route for screens that need a signed-in player. Signed-out players go to sign-in,
// which brings them back here afterwards. Signed-in screens use the player's default theme;
// before sign-in the device's last theme applies.
export function RequireSession() {
  const session = useSession()
  const location = useLocation()
  useUserTheme(session.data ? playerDefaultThemeId : null)

  if (session.isPending) return <FullPageLoading />
  if (!session.data) return <Navigate to={signInPath(location)} replace />
  return <Outlet />
}
