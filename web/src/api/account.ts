// Accounts and the signed-in session. Every function is a stub until the developer builds the Identity endpoints;
// replace each body with apiGet/apiSend from ./client.ts (see README.md).
import type { RequestOptions } from './client.ts'
import * as accountStub from './stubs/accountStub.ts'

export interface Session {
  userId: string
  email: string
}

// STUB: Current session (specs/backend-needs.md)
// Returns null when nobody is signed in. The real call should map a 401 from the session endpoint to null too.
export function getSession({ signal }: RequestOptions = {}): Promise<Session | null> {
  return accountStub.getSession({ signal })
}

// STUB: Sign in (specs/backend-needs.md)
// Fails with ApiError 401 for a wrong email or password.
export function signIn(request: { email: string; password: string; remember: boolean }): Promise<Session> {
  return accountStub.signIn(request)
}

// STUB: Sign out (specs/backend-needs.md)
export function signOut(): Promise<void> {
  return accountStub.signOut()
}

// STUB: Create account (specs/backend-needs.md)
// Signs the new player in. Fails with ApiError 400 carrying field errors.
export function createAccount(request: { email: string; password: string }): Promise<Session> {
  return accountStub.createAccount(request)
}

// STUB: Request a password reset (specs/backend-needs.md)
export function requestPasswordReset(request: { email: string }): Promise<void> {
  return accountStub.requestPasswordReset(request)
}

// STUB: Reset password (specs/backend-needs.md)
// Fails with ApiError 400: titled "Invalid or expired reset link", or carrying password field errors.
export function resetPassword(request: { email: string; token: string; newPassword: string }): Promise<void> {
  return accountStub.resetPassword(request)
}
