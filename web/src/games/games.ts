import type { ThemeId } from '../theme/themes.ts'

// A game is the content of a run (its stats, terminology and game knowledge); a theme is only the look.
// themeId is the game's own theme, which new runs in the game start with, or null if it has none.
interface Game {
  id: string
  name: string
  themeId: ThemeId | null
}

// Every game the app knows about. Adding a game here makes it available when creating a run.
export const games = [
  { id: 'elden-ring', name: 'Elden Ring', themeId: 'elden-ring' },
] as const satisfies readonly Game[]

export type GameId = (typeof games)[number]['id']

export function isGameId(value: unknown): value is GameId {
  return games.some((game) => game.id === value)
}

// Runs come from the API, which may know games this build doesn't, so these take any string.
export function gameName(gameId: string): string {
  return games.find((game) => game.id === gameId)?.name ?? 'Unknown game'
}

export function gameThemeId(gameId: string): ThemeId | null {
  return games.find((game) => game.id === gameId)?.themeId ?? null
}
