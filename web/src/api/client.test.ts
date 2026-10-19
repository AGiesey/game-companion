import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet, apiSend } from './client.ts'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

function jsonResponse(body: unknown, status = 200, contentType = 'application/json'): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

describe('apiGet', () => {
  it('returns the parsed JSON body on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'pong' }))

    await expect(apiGet<{ message: string }>('/ping')).resolves.toEqual({ message: 'pong' })
    expect(fetchMock).toHaveBeenCalledWith('/api/ping', expect.objectContaining({ method: 'GET' }))
  })

  it('throws an ApiError with the ProblemDetails title, detail and status', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5', title: 'Run not found', status: 404, detail: 'No run with id 42.' },
        404,
        'application/problem+json',
      ),
    )

    const error = await catchApiError(apiGet('/runs/42'))
    expect(error.status).toBe(404)
    expect(error.title).toBe('Run not found')
    expect(error.detail).toBe('No run with id 42.')
    expect(error.message).toBe('Run not found')
  })

  it('carries field errors from a validation ProblemDetails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          title: 'One or more validation errors occurred.',
          status: 400,
          errors: { Email: ['Email is already in use.'], Password: ['Too short.', 'Needs a digit.'] },
        },
        400,
        'application/problem+json',
      ),
    )

    const error = await catchApiError(apiGet('/accounts'))
    expect(error.status).toBe(400)
    expect(error.errors).toEqual({ Email: ['Email is already in use.'], Password: ['Too short.', 'Needs a digit.'] })
  })

  it('throws an ApiError with a generic message when the error body is not ProblemDetails', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502, headers: { 'Content-Type': 'text/plain' } }))

    const error = await catchApiError(apiGet('/ping'))
    expect(error.status).toBe(502)
    expect(error.title).toBeUndefined()
    expect(error.message).toBe('Request failed (502)')
  })

  it('throws an ApiError with status 0 when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await catchApiError(apiGet('/ping'))
    expect(error.status).toBe(0)
  })

  it('rethrows aborts unchanged', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'))

    await expect(apiGet('/ping')).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('apiSend', () => {
  it('sends the body as JSON and returns undefined for 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(apiSend('PUT', '/runs/42/theme', { themeId: 'elden-ring' })).resolves.toBeUndefined()
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBe('{"themeId":"elden-ring"}')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })
})
