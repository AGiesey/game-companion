// The player's runs. Every function is a stub until the run endpoints exist (specs/backend-needs.md).
import type { RequestOptions } from './client.ts'
import * as runStub from './stubs/runStub.ts'

export interface Run {
  id: string
  name: string
  // A string rather than GameId: the API may return a game this build doesn't know.
  gameId: string
  // null means "follow the player's default theme".
  themeId: string | null
  // ISO 8601 times.
  createdAt: string
  lastOpenedAt: string | null
}

export interface NewRun {
  name: string
  gameId: string
  themeId: string | null
}

// STUB: List the player's runs, most recently opened first (specs/backend-needs.md)
export function listRuns({ signal }: RequestOptions = {}): Promise<Run[]> {
  return runStub.listRuns({ signal })
}

// STUB: Create a run (specs/backend-needs.md)
// Fails with ApiError 400 carrying field errors (Name, GameId).
export function createRun(newRun: NewRun): Promise<Run> {
  return runStub.createRun(newRun)
}

// STUB: Get one run (specs/backend-needs.md)
// Fails with ApiError 404 when the run doesn't exist or isn't the player's.
export function getRun(runId: string, { signal }: RequestOptions = {}): Promise<Run> {
  return runStub.getRun(runId, { signal })
}

// STUB: Record that the player opened a run (specs/backend-needs.md)
export function recordRunOpened(runId: string): Promise<void> {
  return runStub.recordRunOpened(runId)
}
