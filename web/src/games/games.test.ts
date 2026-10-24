import { describe, expect, it } from 'vitest'
import { isThemeId } from '../theme/themes.ts'
import { gameName, games, gameThemeId, isGameId } from './games.ts'

describe('games', () => {
  it('knows Elden Ring, with its own theme', () => {
    expect(isGameId('elden-ring')).toBe(true)
    expect(gameName('elden-ring')).toBe('Elden Ring')
    expect(gameThemeId('elden-ring')).toBe('elden-ring')
  })

  it('treats unregistered ids as unknown', () => {
    expect(isGameId('removed-game')).toBe(false)
    expect(isGameId(undefined)).toBe(false)
    expect(gameName('removed-game')).toBe('Unknown game')
    expect(gameThemeId('removed-game')).toBeNull()
  })

  it('gives every game a registered theme or none', () => {
    for (const game of games) {
      expect(game.themeId === null || isThemeId(game.themeId), game.id).toBe(true)
    }
  })
})
