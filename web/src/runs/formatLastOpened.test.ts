import { describe, expect, it } from 'vitest'
import { formatLastOpened } from './formatLastOpened.ts'

// Local times, so the tests mean the same thing in any time zone.
const now = new Date(2026, 9, 24, 9, 0)
const at = (month: number, date: number, hours = 12, minutes = 0) =>
  new Date(2026, month, date, hours, minutes).toISOString()
const format = (lastOpenedAt: string | null, createdAt = at(8, 1)) =>
  formatLastOpened({ createdAt, lastOpenedAt }, { now, locale: 'en' })

describe('formatLastOpened', () => {
  it('says today for earlier today, even just after midnight', () => {
    expect(format(at(9, 24, 0, 5))).toBe('Opened today')
  })

  it('says yesterday for late last night', () => {
    expect(format(at(9, 23, 23, 50))).toBe('Opened yesterday')
  })

  it('counts days up to six', () => {
    expect(format(at(9, 21))).toBe('Opened 3 days ago')
    expect(format(at(9, 18))).toBe('Opened 6 days ago')
  })

  it('switches to a date from a week on', () => {
    expect(format(at(9, 17))).toBe('Opened Oct 17, 2026')
  })

  it('says when a run that was never opened was started', () => {
    expect(format(null, at(9, 24, 8, 0))).toBe('Started today')
    expect(format(null, at(8, 1))).toBe('Started Sep 1, 2026')
  })

  it('treats a time ahead of the clock as today', () => {
    expect(format(at(9, 25))).toBe('Opened today')
  })
})
