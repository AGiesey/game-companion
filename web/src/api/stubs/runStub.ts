// An in-browser stand-in for the run endpoints, until the developer builds them. Only runs.ts imports it.
// Runs are kept per player, found from the real session, so each account has its own runs as it will with the API.
import { getSession } from '../account.ts'
import { ApiError } from '../client.ts'
import { stub, type StubOptions } from '../stub.ts'

export interface StubRun {
  id: string
  name: string
  gameId: string
  themeId: string | null
  createdAt: string
  lastOpenedAt: string | null
}

const runsKey = 'game-companion.stub.runs'
const maximumNameLength = 60
// The stub's own copy of the games the backend accepts; the front end's list is in src/games/games.ts.
const knownGameIds = ['elden-ring']

// Every player's runs, by user id.
type RunStore = Record<string, StubRun[]>

// Used when localStorage is unavailable or throws, so the stub still works for the page's lifetime.
let memory: RunStore | null = null

function loadStore(): RunStore {
  try {
    const json = localStorage.getItem(runsKey)
    return json ? (JSON.parse(json) as RunStore) : {}
  } catch {
    return memory ?? {}
  }
}

function saveStore(store: RunStore): void {
  try {
    localStorage.setItem(runsKey, JSON.stringify(store))
  } catch {
    memory = store
  }
}

// Waits like a real request, then finds the signed-in player. Answers 401 when there isn't one, as the API will.
async function currentUserId(options?: StubOptions): Promise<string> {
  await stub(undefined, options)
  const session = await getSession({ signal: options?.signal })
  if (!session) throw new ApiError(401, 'Unauthorized', { title: 'Unauthorized', status: 401 })
  return session.userId
}

function notFound(): ApiError {
  const title = 'Run not found'
  return new ApiError(404, title, { title, status: 404 })
}

function validationError(errors: Record<string, string[]>): ApiError {
  const title = 'One or more validation errors occurred.'
  return new ApiError(400, title, { title, status: 400, errors })
}

// Most recently opened first; a run never opened counts from when it was created. ISO times sort as strings.
function byMostRecent(a: StubRun, b: StubRun): number {
  return (b.lastOpenedAt ?? b.createdAt).localeCompare(a.lastOpenedAt ?? a.createdAt)
}

export async function listRuns(options?: StubOptions): Promise<StubRun[]> {
  const userId = await currentUserId(options)
  return [...(loadStore()[userId] ?? [])].sort(byMostRecent)
}

export async function createRun(
  { name, gameId, themeId }: { name: string; gameId: string; themeId: string | null },
  options?: StubOptions,
): Promise<StubRun> {
  const userId = await currentUserId(options)
  const trimmed = name.trim()
  const errors: Record<string, string[]> = {}
  if (!trimmed) errors.Name = ['The Name field is required.']
  else if (trimmed.length > maximumNameLength) {
    errors.Name = [`The field Name must be a string with a maximum length of ${maximumNameLength}.`]
  }
  if (!knownGameIds.includes(gameId)) errors.GameId = [`'${gameId}' is not a supported game.`]
  if (Object.keys(errors).length > 0) throw validationError(errors)

  const run: StubRun = {
    id: crypto.randomUUID(),
    name: trimmed,
    gameId,
    themeId,
    createdAt: new Date().toISOString(),
    lastOpenedAt: null,
  }
  const store = loadStore()
  store[userId] = [...(store[userId] ?? []), run]
  saveStore(store)
  return run
}

// Another player's run is reported the same way as a missing one, so the answer doesn't reveal it exists.
export async function getRun(runId: string, options?: StubOptions): Promise<StubRun> {
  const userId = await currentUserId(options)
  const run = loadStore()[userId]?.find((candidate) => candidate.id === runId)
  if (!run) throw notFound()
  return run
}

export async function recordRunOpened(runId: string, options?: StubOptions): Promise<void> {
  const userId = await currentUserId(options)
  const store = loadStore()
  const run = store[userId]?.find((candidate) => candidate.id === runId)
  if (!run) throw notFound()
  run.lastOpenedAt = new Date().toISOString()
  saveStore(store)
}

// Tests only: give a player these runs, replacing any they had.
export function seedStubRuns(userId: string, runs: StubRun[]): void {
  const store = loadStore()
  store[userId] = runs
  saveStore(store)
}

// Tests only: forget anything kept in memory because storage was unavailable.
export function resetRunStubMemory(): void {
  memory = null
}
