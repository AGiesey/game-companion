import type { Run } from '../api/runs.ts'

interface FormatOptions {
  now?: Date
  // Defaults to the browser's locale. Tests pin one so the wording is predictable.
  locale?: string
}

const day = 24 * 60 * 60 * 1000

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// "Opened today", "Opened yesterday", "Opened 3 days ago", then a date from a week on. A run never opened says
// when it was started instead. Days are calendar days in local time, so last night at 23:50 is "yesterday".
export function formatLastOpened(
  run: Pick<Run, 'createdAt' | 'lastOpenedAt'>,
  { now = new Date(), locale }: FormatOptions = {},
): string {
  const verb = run.lastOpenedAt ? 'Opened' : 'Started'
  const date = new Date(run.lastOpenedAt ?? run.createdAt)
  // Rounded because a day with a daylight saving change isn't 24 hours; never negative if the clock is off.
  const daysAgo = Math.max(0, Math.round((startOfDay(now) - startOfDay(date)) / day))

  const when =
    daysAgo < 7
      ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-daysAgo, 'day')
      : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
  return `${verb} ${when}`
}
