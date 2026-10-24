// Accounts and the signed-in session. The API keeps the session in a cookie, which the browser sends with every
// same-origin request, so none of these functions handle tokens.
import { ApiError, apiGet, apiSend, type RequestOptions } from './client.ts'

export interface Session {
  userId: string
  email: string
}

// Returns null when nobody is signed in: the session endpoint answers 401, which here isn't an ended session.
export async function getSession({ signal }: RequestOptions = {}): Promise<Session | null> {
  try {
    return await apiGet<Session>('/account/session', { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

// Fails with ApiError 401 for a wrong email or password, and 403 (with a title to show) when the account is locked out.
export function signIn(request: { email: string; password: string; remember: boolean }): Promise<Session> {
  return apiSend<Session>('POST', '/account/sign-in', request)
}

export function signOut(): Promise<void> {
  return apiSend<void>('POST', '/account/sign-out')
}

// Signs the new player in. Fails with ApiError 400 carrying field errors.
export function createAccount(request: { email: string; password: string }): Promise<Session> {
  return apiSend<Session>('POST', '/account', request)
}

// Succeeds whether or not the account exists, so the response doesn't reveal which emails have accounts.
export function requestPasswordReset(request: { email: string }): Promise<void> {
  return apiSend<void>('POST', '/account/forgot-password', request)
}

// Fails with ApiError 400: titled "Invalid or expired reset link", or carrying password field errors.
export function resetPassword(request: { email: string; token: string; newPassword: string }): Promise<void> {
  return apiSend<void>('POST', '/account/reset-password', request)
}
