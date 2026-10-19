import { createContext, useContext } from 'react'
import type { ThemeId } from './themes.ts'

export interface ThemeContextValue {
  themeId: ThemeId
  // Sets the theme for this device. A run or user theme passed to the provider still takes precedence.
  setThemeId: (themeId: ThemeId) => void
}

// Kept apart from ThemeProvider.tsx so that file only exports a component (needed for fast refresh).
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider.')
  return context
}
