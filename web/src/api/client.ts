// The one place the app calls fetch. Every API function in web/src/api/ goes through apiGet or apiSend.

const basePath = '/api'

interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
}

// A failed API call. status is 0 when the server couldn't be reached.
export class ApiError extends Error {
  readonly status: number
  readonly title?: string
  readonly detail?: string
  readonly type?: string

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = problem?.title
    this.detail = problem?.detail
    this.type = problem?.type
  }
}

export interface RequestOptions {
  signal?: AbortSignal
}

export function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>('GET', path, undefined, options)
}

export function apiSend<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>(method, path, body, options)
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  { signal }: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(basePath + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // Let cancellation through untouched so TanStack Query treats it as a cancel, not a failure.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.")
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/problem+json')) {
    try {
      const problem = (await response.json()) as ProblemDetails
      return new ApiError(response.status, problem.title ?? `Request failed (${response.status})`, problem)
    } catch {
      // Malformed problem body; fall through to the generic error.
    }
  }
  return new ApiError(response.status, `Request failed (${response.status})`)
}
