import { describe, expect, it } from 'vitest'
import { validateNewRun } from './validation.ts'

describe('validateNewRun', () => {
  it('accepts a name and a registered game', () => {
    expect(validateNewRun({ name: "Vaela's Run", gameId: 'elden-ring' })).toEqual({})
  })

  it('needs a name, and spaces alone are not one', () => {
    expect(validateNewRun({ name: '', gameId: 'elden-ring' })).toEqual({ name: 'Give your run a name.' })
    expect(validateNewRun({ name: '   ', gameId: 'elden-ring' })).toEqual({ name: 'Give your run a name.' })
  })

  it('allows 60 characters after trimming, not 61', () => {
    expect(validateNewRun({ name: `  ${'x'.repeat(60)}  `, gameId: 'elden-ring' })).toEqual({})
    expect(validateNewRun({ name: 'x'.repeat(61), gameId: 'elden-ring' })).toEqual({
      name: 'Keep the name to 60 characters or fewer.',
    })
  })

  it('needs a registered game', () => {
    expect(validateNewRun({ name: 'A run', gameId: null })).toEqual({ gameId: 'Choose a game.' })
    expect(validateNewRun({ name: 'A run', gameId: 'removed-game' })).toEqual({ gameId: 'Choose a game.' })
  })

  it('reports both problems at once', () => {
    expect(Object.keys(validateNewRun({ name: '', gameId: null }))).toEqual(['name', 'gameId'])
  })
})
