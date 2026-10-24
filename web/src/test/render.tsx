import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { createQueryClient } from '../queryClient.ts'
import { ThemeProvider } from '../theme/ThemeProvider.tsx'

interface RenderOptions {
  // The address the app starts at, including any query string.
  route?: string
  // Earlier history entries, before route, so a test can press Back.
  history?: string[]
}

// Renders inside the app's providers and an in-memory router, with a fresh query client per test so
// cached data never leaks between tests. Same 401 handling as the app; retries are off so error states appear immediately.
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', history = [] }: RenderOptions = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = createQueryClient({ retry: false })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[...history, route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return { ...result, queryClient }
}
