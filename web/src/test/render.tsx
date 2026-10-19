import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { ThemeProvider } from '../theme/ThemeProvider.tsx'

interface RenderOptions {
  // The address the app starts at, including any query string.
  route?: string
}

// Renders inside the app's providers and an in-memory router, with a fresh query client per test so
// cached data never leaks between tests. Retries are off so error states appear immediately.
export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: RenderOptions = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return { ...result, queryClient }
}
