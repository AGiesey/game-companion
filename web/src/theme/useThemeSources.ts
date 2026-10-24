import { createContext, useContext, useLayoutEffect } from 'react'

// Lets screens inside the router supply the run and user themes, which ThemeProvider (above the router) resolves.
export interface ThemeSourcesContextValue {
  setRunThemeId: (themeId: string | null) => void
  setUserThemeId: (themeId: string | null) => void
}

export const ThemeSourcesContext = createContext<ThemeSourcesContextValue | null>(null)

function useThemeSources(): ThemeSourcesContextValue {
  const context = useContext(ThemeSourcesContext)
  if (!context) throw new Error('useRunTheme and useUserTheme must be used inside a ThemeProvider.')
  return context
}

// While the calling component is mounted, the run's theme is this one (null or undefined: no run theme).
// A layout effect, so the theme changes before the browser paints the screen that asked for it.
export function useRunTheme(themeId: string | null | undefined): void {
  const { setRunThemeId } = useThemeSources()
  useLayoutEffect(() => {
    setRunThemeId(themeId ?? null)
    return () => setRunThemeId(null)
  }, [setRunThemeId, themeId])
}

// While the calling component is mounted, the player's default theme is this one.
export function useUserTheme(themeId: string | null | undefined): void {
  const { setUserThemeId } = useThemeSources()
  useLayoutEffect(() => {
    setUserThemeId(themeId ?? null)
    return () => setUserThemeId(null)
  }, [setUserThemeId, themeId])
}
