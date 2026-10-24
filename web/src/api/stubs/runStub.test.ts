import { afterEach, describe, expect, it, vi } from 'vitest'
import { signInAsDemo } from '../../test/runs.ts'
import { createAccount, signOut } from '../account.ts'
import { ApiError } from '../client.ts'
import { createRun, getRun, listRuns, recordRunOpened, seedStubRuns, type StubRun } from './runStub.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

async function apiErrorFrom(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

function run(overrides: Partial<StubRun> & Pick<StubRun, 'id'>): StubRun {
  return {
    name: 'A run',
    gameId: 'elden-ring',
    themeId: 'elden-ring',
    createdAt: '2026-10-01T12:00:00.000Z',
    lastOpenedAt: null,
    ...overrides,
  }
}

describe('run stub', () => {
  it('starts every player with no runs', async () => {
    await signInAsDemo()
    await expect(listRuns()).resolves.toEqual([])
  })

  it('creates a run with a trimmed name, never opened yet', async () => {
    await signInAsDemo()

    const created = await createRun({ name: "  Vaela's Run ", gameId: 'elden-ring', themeId: 'elden-ring' })

    expect(created).toMatchObject({ name: "Vaela's Run", gameId: 'elden-ring', themeId: 'elden-ring', lastOpenedAt: null })
    await expect(getRun(created.id)).resolves.toEqual(created)
    await expect(listRuns()).resolves.toEqual([created])
  })

  it('lists runs most recently opened first, counting never-opened runs from when they were created', async () => {
    const session = await signInAsDemo()
    seedStubRuns(session.userId, [
      run({ id: 'old', lastOpenedAt: '2026-10-02T12:00:00.000Z' }),
      run({ id: 'new-never-opened', createdAt: '2026-10-05T12:00:00.000Z' }),
      run({ id: 'recent', lastOpenedAt: '2026-10-10T12:00:00.000Z' }),
    ])

    const ids = (await listRuns()).map((r) => r.id)

    expect(ids).toEqual(['recent', 'new-never-opened', 'old'])
  })

  it('moves a run to the top when it is opened', async () => {
    const session = await signInAsDemo()
    seedStubRuns(session.userId, [
      run({ id: 'first', lastOpenedAt: '2026-10-02T12:00:00.000Z' }),
      run({ id: 'second', lastOpenedAt: '2026-10-10T12:00:00.000Z' }),
    ])

    await recordRunOpened('first')

    const runs = await listRuns()
    expect(runs.map((r) => r.id)).toEqual(['first', 'second'])
    expect(runs[0].lastOpenedAt).not.toBeNull()
  })

  it('keeps each player’s runs separate, and answers 404 for another player’s run', async () => {
    const demo = await signInAsDemo()
    seedStubRuns(demo.userId, [run({ id: 'demo-run' })])
    await createAccount({ email: 'other@example.com', password: 'long-enough' })

    await expect(listRuns()).resolves.toEqual([])
    expect((await apiErrorFrom(getRun('demo-run'))).status).toBe(404)
    expect((await apiErrorFrom(recordRunOpened('demo-run'))).status).toBe(404)
  })

  it('answers 404 for a run that does not exist', async () => {
    await signInAsDemo()

    const error = await apiErrorFrom(getRun('missing'))

    expect(error.status).toBe(404)
    expect(error.title).toBe('Run not found')
  })

  it('rejects a blank name and an unknown game with field errors', async () => {
    await signInAsDemo()

    const error = await apiErrorFrom(createRun({ name: '   ', gameId: 'removed-game', themeId: null }))

    expect(error.status).toBe(400)
    expect(Object.keys(error.errors ?? {})).toEqual(['Name', 'GameId'])
  })

  it('accepts a 60-character name and rejects 61', async () => {
    await signInAsDemo()

    await expect(createRun({ name: 'x'.repeat(60), gameId: 'elden-ring', themeId: null })).resolves.toBeDefined()
    const error = await apiErrorFrom(createRun({ name: 'x'.repeat(61), gameId: 'elden-ring', themeId: null }))
    expect(error.errors?.Name).toHaveLength(1)
  })

  it('answers 401 when nobody is signed in', async () => {
    await signOut()

    expect((await apiErrorFrom(listRuns())).status).toBe(401)
  })

  it('keeps working in memory when storage throws', async () => {
    for (const method of ['getItem', 'setItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('Blocked', 'SecurityError')
      })
    }
    // Signed in after blocking storage, so the fake account server keeps this session in memory too.
    await signInAsDemo()

    const created = await createRun({ name: 'Offline run', gameId: 'elden-ring', themeId: null })

    await expect(listRuns()).resolves.toEqual([created])
  })
})
