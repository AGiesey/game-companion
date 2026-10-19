// Adds the jest-dom matchers (toBeInTheDocument, ...) to Vitest's expect, with their types.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'
import { setStubDelays } from '../api/stub.ts'

// Stub-backed pages resolve immediately in tests.
beforeAll(() => {
  setStubDelays({ valueMs: 0, chunkMs: 0 })
})

// Testing Library only cleans up automatically when test globals are on; they're off here.
afterEach(() => {
  cleanup()
  // ThemeProvider and the account stubs write to storage; reset so tests don't see each other's state.
  localStorage.clear()
  sessionStorage.clear()
  delete document.documentElement.dataset.theme
})
