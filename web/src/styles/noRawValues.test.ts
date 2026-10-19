import { describe, expect, it } from 'vitest'

// Components style themselves with theme utilities only (spec FR-6): no raw colors or font names.
const sources = import.meta.glob<string>('../**/*.tsx', { query: '?raw', import: 'default', eager: true })

const forbidden: [string, RegExp][] = [
  ['hex color', /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i],
  ['rgb() color', /\brgba?\(/i],
  ['hsl() color', /\bhsla?\(/i],
  ['font name', /\b(?:Spectral|Cinzel|IBM Plex)\b/],
]

describe('component sources', () => {
  it('finds component files to check', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0)
  })

  it.each(Object.entries(sources))('%s uses theme utilities only', (_path, source) => {
    const found = forbidden.filter(([, pattern]) => pattern.test(source)).map(([name]) => name)
    expect(found).toEqual([])
  })
})
