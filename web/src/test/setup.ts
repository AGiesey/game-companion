// Adds the jest-dom matchers (toBeInTheDocument, ...) to Vitest's expect, with their types.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only cleans up automatically when test globals are on; they're off here.
afterEach(() => {
  cleanup()
  // ThemeProvider writes both; reset so tests don't see each other's theme.
  localStorage.clear()
  delete document.documentElement.dataset.theme
})
