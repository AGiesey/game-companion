import { describe, expect, it } from 'vitest'
import { sessionQueryKey } from './account/sessionQueryKey.ts'
import { ApiError } from './api/client.ts'
import { createQueryClient, shouldRetry } from './queryClient.ts'

const signedIn = { userId: 'u1', email: 'vaela@example.com' }

describe('401 handling', () => {
  it('ends the session and drops other cached data when a query gets a 401', async () => {
    const queryClient = createQueryClient({ retry: false })
    queryClient.setQueryData(sessionQueryKey, signedIn)
    queryClient.setQueryData(['runs'], ['run-1'])

    await queryClient
      .fetchQuery({ queryKey: ['journal'], queryFn: () => Promise.reject(new ApiError(401, 'Unauthorized')) })
      .catch(() => {})

    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull()
    expect(queryClient.getQueryData(['runs'])).toBeUndefined()
  })

  it('ends the session when a mutation gets a 401', async () => {
    const queryClient = createQueryClient({ retry: false })
    queryClient.setQueryData(sessionQueryKey, signedIn)

    await queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: () => Promise.reject(new ApiError(401, 'Unauthorized')) })
      .execute(undefined)
      .catch(() => {})

    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull()
  })

  it('leaves the session alone when the 401 is expected', async () => {
    const queryClient = createQueryClient({ retry: false })
    queryClient.setQueryData(sessionQueryKey, signedIn)

    await queryClient
      .getMutationCache()
      .build(queryClient, {
        mutationFn: () => Promise.reject(new ApiError(401, 'Unauthorized')),
        meta: { expectsUnauthenticated: true },
      })
      .execute(undefined)
      .catch(() => {})

    expect(queryClient.getQueryData(sessionQueryKey)).toEqual(signedIn)
  })

  it('ignores errors other than 401', async () => {
    const queryClient = createQueryClient({ retry: false })
    queryClient.setQueryData(sessionQueryKey, signedIn)

    await queryClient
      .fetchQuery({ queryKey: ['journal'], queryFn: () => Promise.reject(new ApiError(403, 'Forbidden')) })
      .catch(() => {})

    expect(queryClient.getQueryData(sessionQueryKey)).toEqual(signedIn)
  })
})

describe('shouldRetry', () => {
  it('retries once for network failures and server errors', () => {
    expect(shouldRetry(0, new ApiError(0, 'offline'))).toBe(true)
    expect(shouldRetry(0, new ApiError(503, 'unavailable'))).toBe(true)
    expect(shouldRetry(1, new ApiError(503, 'unavailable'))).toBe(false)
  })

  it('never retries client errors or unknown errors', () => {
    expect(shouldRetry(0, new ApiError(401, 'unauthorized'))).toBe(false)
    expect(shouldRetry(0, new ApiError(400, 'invalid'))).toBe(false)
    expect(shouldRetry(0, new Error('bug'))).toBe(false)
  })
})
