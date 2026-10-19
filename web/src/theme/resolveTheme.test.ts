import { describe, expect, it } from 'vitest'
import { resolveTheme } from './resolveTheme.ts'

describe('resolveTheme', () => {
  it('uses the run theme first', () => {
    expect(resolveTheme({ runThemeId: 'elden-ring', userThemeId: 'general', lastUsedThemeId: 'general' })).toBe('elden-ring')
  })

  it('uses the user theme when the run has none', () => {
    expect(resolveTheme({ runThemeId: null, userThemeId: 'elden-ring', lastUsedThemeId: 'general' })).toBe('elden-ring')
  })

  it('uses the last theme on this device when neither run nor user has one', () => {
    expect(resolveTheme({ lastUsedThemeId: 'elden-ring' })).toBe('elden-ring')
  })

  it('falls back to General when nothing is set', () => {
    expect(resolveTheme({})).toBe('general')
  })

  it('skips an unknown run theme', () => {
    expect(resolveTheme({ runThemeId: 'removed-theme', userThemeId: 'elden-ring' })).toBe('elden-ring')
  })

  it('skips an unknown user theme', () => {
    expect(resolveTheme({ userThemeId: 'removed-theme', lastUsedThemeId: 'elden-ring' })).toBe('elden-ring')
  })

  it('skips an unknown last-used theme', () => {
    expect(resolveTheme({ lastUsedThemeId: 'removed-theme' })).toBe('general')
  })
})
