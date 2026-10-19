import { afterEach, describe, expect, it, vi } from 'vitest'
import { readLastTheme, themeStorageKey, writeLastTheme } from './storage.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('theme storage', () => {
  it('reads back what it writes', () => {
    writeLastTheme('elden-ring')

    expect(localStorage.getItem(themeStorageKey)).toBe('elden-ring')
    expect(readLastTheme()).toBe('elden-ring')
  })

  it('returns null when nothing is stored', () => {
    expect(readLastTheme()).toBeNull()
  })

  it('ignores storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(() => writeLastTheme('elden-ring')).not.toThrow()
    expect(readLastTheme()).toBeNull()
  })
})
