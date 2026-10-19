// The last theme used on this device. index.html reads the same key before first paint.
export const themeStorageKey = 'game-companion.theme'

// localStorage can be missing or throw (private browsing, blocked site data); the theme then lasts for the session only.
export function readLastTheme(): string | null {
  try {
    return localStorage.getItem(themeStorageKey)
  } catch {
    return null
  }
}

export function writeLastTheme(themeId: string): void {
  try {
    localStorage.setItem(themeStorageKey, themeId)
  } catch {
    // Ignored: see above.
  }
}
