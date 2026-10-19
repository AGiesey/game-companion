import { useLayoutEffect, useState, type ReactNode } from 'react'
import { resolveTheme } from './resolveTheme.ts'
import { readLastTheme, writeLastTheme } from './storage.ts'
import { ThemeContext } from './useTheme.ts'

interface ThemeProviderProps {
  runThemeId?: string | null
  userThemeId?: string | null
  children: ReactNode
}

export function ThemeProvider({ runThemeId, userThemeId, children }: ThemeProviderProps) {
  const [deviceThemeId, setDeviceThemeId] = useState(readLastTheme)
  const themeId = resolveTheme({ runThemeId, userThemeId, lastUsedThemeId: deviceThemeId })

  // Layout effect so the attribute changes before the browser paints the new render.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = themeId
    writeLastTheme(themeId)
  }, [themeId])

  return <ThemeContext value={{ themeId, setThemeId: setDeviceThemeId }}>{children}</ThemeContext>
}
