// Helpers for tests that need a signed-in player with runs. The run stub keeps runs per player, so seeding needs
// the session's user id.
import { signIn, type Session } from '../api/account.ts'
import type { Run } from '../api/runs.ts'
import { seedStubRuns } from '../api/stubs/runStub.ts'
import { demoAccount } from './fakeAccountServer.ts'

export function signInAsDemo(): Promise<Session> {
  return signIn({ email: demoAccount.email, password: demoAccount.password, remember: true })
}

const day = 24 * 60 * 60 * 1000

// An ISO time this many days before now, for runs opened "3 days ago".
export function daysAgo(days: number): string {
  return new Date(Date.now() - days * day).toISOString()
}

// A complete run from the fields a test cares about.
export function testRun(overrides: Partial<Run> & Pick<Run, 'id' | 'name'>): Run {
  return {
    gameId: 'elden-ring',
    themeId: 'elden-ring',
    createdAt: daysAgo(30),
    lastOpenedAt: null,
    ...overrides,
  }
}

// Gives the player these runs, replacing any they had.
export function seedRuns(session: Session, runs: Run[]): void {
  seedStubRuns(session.userId, runs)
}
