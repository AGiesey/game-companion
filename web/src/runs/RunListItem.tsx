import { useId } from 'react'
import { Link } from 'react-router'
import type { Run } from '../api/runs.ts'
import { gameName } from '../games/games.ts'
import { formatLastOpened } from './formatLastOpened.ts'

// One run in the list: the whole row is a link into the run. Its accessible name is the run's name alone;
// the game and when it was last opened are its description.
export function RunListItem({ run }: { run: Run }) {
  const nameId = useId()
  const detailId = useId()

  return (
    <li>
      <Link
        to={`/runs/${run.id}`}
        aria-labelledby={nameId}
        aria-describedby={detailId}
        className="flex flex-col gap-1 py-4"
      >
        <span id={nameId} className="font-display text-xl font-semibold text-text-strong">
          {run.name}
        </span>
        <span id={detailId} className="text-text-muted">
          {gameName(run.gameId)} ·{' '}
          <time dateTime={run.lastOpenedAt ?? run.createdAt}>{formatLastOpened(run)}</time>
        </span>
      </Link>
    </li>
  )
}
