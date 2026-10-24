// Adds the jest-dom matchers (toBeInTheDocument, ...) to Vitest's expect, with their types.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'
import { setStubDelays } from '../api/stub.ts'

// Every test talks to the fake account server instead of the API. Each function is a vi.fn, so a test can
// override one call, for example vi.mocked(signIn).mockRejectedValueOnce(...).
vi.mock('../api/account.ts', async () => {
  const fake = await import('./fakeAccountServer.ts')
  return {
    getSession: vi.fn(fake.getSession),
    signIn: vi.fn(fake.signIn),
    signOut: vi.fn(fake.signOut),
    createAccount: vi.fn(fake.createAccount),
    requestPasswordReset: vi.fn(fake.requestPasswordReset),
    resetPassword: vi.fn(fake.resetPassword),
  }
})

// Stub-backed pages and the fake account server resolve immediately in tests.
beforeAll(() => {
  setStubDelays({ valueMs: 0, chunkMs: 0 })
})

// Testing Library only cleans up automatically when test globals are on; they're off here.
afterEach(() => {
  cleanup()
  // ThemeProvider and the fake account server write to storage; reset so tests don't see each other's state.
  localStorage.clear()
  sessionStorage.clear()
  delete document.documentElement.dataset.theme
})
