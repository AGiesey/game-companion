import { QueryClient } from '@tanstack/react-query'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Retry once instead of three times, so stub and API errors show up quickly.
      queries: { retry: 1 },
    },
  })
}
