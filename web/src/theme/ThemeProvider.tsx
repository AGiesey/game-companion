import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { resolveTheme } from './resolveTheme.ts'
import { readLastTheme, writeLastTheme } from './storage.ts'
import { ThemeContext } from './useTheme.ts'
import { ThemeSourcesContext } from './useThemeSources.ts'

interface ThemeProviderProps {
  // Props win over the values screens set with useRunTheme and useUserTheme.
  runThemeId?: string | null
  userThemeId?: string | null
  children: ReactNode
}

export function ThemeProvider({ runThemeId, userThemeId, children }: ThemeProviderProps) {
  const [deviceThemeId, setDeviceThemeId] = useState(readLastTheme)
  const [screenRunThemeId, setRunThemeId] = useState<string | null>(null)
  const [screenUserThemeId, setUserThemeId] = useState<string | null>(null)
  const themeId = resolveTheme({
    runThemeId: runThemeId ?? screenRunThemeId,
    userThemeId: userThemeId ?? screenUserThemeId,
    lastUsedThemeId: deviceThemeId,
  })

  // Layout effect so the attribute changes before the browser paints the new render.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = themeId
    writeLastTheme(themeId)
  }, [themeId])

  // State setters never change, so this object doesn't either, and screens using it don't re-render needlessly.
  const sources = useMemo(() => ({ setRunThemeId, setUserThemeId }), [])

  return (
    <ThemeSourcesContext value={sources}>
      <ThemeContext value={{ themeId, setThemeId: setDeviceThemeId }}>{children}</ThemeContext>
    </ThemeSourcesContext>
  )
}
