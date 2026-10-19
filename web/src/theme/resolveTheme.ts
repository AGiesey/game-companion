import { defaultThemeId, isThemeId, type ThemeId } from './themes.ts'

export interface ThemeSources {
  runThemeId?: string | null
  userThemeId?: string | null
  lastUsedThemeId?: string | null
}

// The run's theme, else the user's default, else the last theme used on this device, else General.
// Ids that aren't registered themes are skipped.
export function resolveTheme({ runThemeId, userThemeId, lastUsedThemeId }: ThemeSources): ThemeId {
  return [runThemeId, userThemeId, lastUsedThemeId].find(isThemeId) ?? defaultThemeId
}
