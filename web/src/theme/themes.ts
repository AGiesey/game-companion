// Every theme the app knows about. Adding a theme here (plus its CSS file) is all it takes.
export const themes = [
  { id: 'general', name: 'General' },
  { id: 'elden-ring', name: 'Elden Ring' },
] as const

export type ThemeId = (typeof themes)[number]['id']

export const defaultThemeId: ThemeId = 'general'

export function isThemeId(value: unknown): value is ThemeId {
  return themes.some((theme) => theme.id === value)
}
