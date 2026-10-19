import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../client.ts'
import {
  createAccount,
  demoAccount,
  demoResetToken,
  getSession,
  requestPasswordReset,
  resetAccountStubMemory,
  resetPassword,
  signIn,
  signOut,
} from './accountStub.ts'

afterEach(() => {
  vi.restoreAllMocks()
  resetAccountStubMemory()
})

async function apiErrorFrom(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

describe('account stub', () => {
  it('has nobody signed in at first', async () => {
    await expect(getSession()).resolves.toBeNull()
  })

  it('signs in the demo account, ignoring email case', async () => {
    const session = await signIn({ email: 'Vaela@Example.com', password: demoAccount.password, remember: true })

    expect(session.email).toBe(demoAccount.email)
    await expect(getSession()).resolves.toEqual(session)
  })

  it('rejects a wrong password with a 401', async () => {
    const error = await apiErrorFrom(signIn({ email: demoAccount.email, password: 'wrong', remember: true }))
    expect(error.status).toBe(401)
  })

  it('rejects an unknown email with a 401', async () => {
    const error = await apiErrorFrom(signIn({ email: 'nobody@example.com', password: 'whatever1', remember: true }))
    expect(error.status).toBe(401)
  })

  it('keeps a remembered session in localStorage and an unremembered one in sessionStorage', async () => {
    await signIn({ email: demoAccount.email, password: demoAccount.password, remember: true })
    expect(localStorage.getItem('game-companion.stub.session')).not.toBeNull()
    expect(sessionStorage.getItem('game-companion.stub.session')).toBeNull()

    await signIn({ email: demoAccount.email, password: demoAccount.password, remember: false })
    expect(localStorage.getItem('game-companion.stub.session')).toBeNull()
    expect(sessionStorage.getItem('game-companion.stub.session')).not.toBeNull()
  })

  it('signs out', async () => {
    await signIn({ email: demoAccount.email, password: demoAccount.password, remember: true })
    await signOut()

    await expect(getSession()).resolves.toBeNull()
  })

  it('creates an account and signs it in', async () => {
    const session = await createAccount({ email: 'tarnished@example.com', password: 'long-enough' })

    expect(session.email).toBe('tarnished@example.com')
    await expect(getSession()).resolves.toEqual(session)
    await signOut()
    await expect(signIn({ email: 'tarnished@example.com', password: 'long-enough', remember: false })).resolves.toEqual(session)
  })

  it('rejects a taken email and a short password with field errors', async () => {
    const error = await apiErrorFrom(createAccount({ email: demoAccount.email, password: 'short' }))

    expect(error.status).toBe(400)
    expect(Object.keys(error.errors ?? {}).sort()).toEqual(['Email', 'Password'])
  })

  it('accepts any password reset request', async () => {
    await expect(requestPasswordReset({ email: 'nobody@example.com' })).resolves.toBeUndefined()
  })

  it('resets the password with the demo token', async () => {
    await resetPassword({ email: demoAccount.email, token: demoResetToken, newPassword: 'brand-new-password' })

    await expect(
      signIn({ email: demoAccount.email, password: 'brand-new-password', remember: false }),
    ).resolves.toMatchObject({ email: demoAccount.email })
  })

  it('rejects an invalid reset token', async () => {
    const error = await apiErrorFrom(resetPassword({ email: demoAccount.email, token: 'expired', newPassword: 'whatever-123' }))

    expect(error.status).toBe(400)
    expect(error.title).toBe('Invalid or expired reset link')
  })

  it('rejects a short new password with a field error', async () => {
    const error = await apiErrorFrom(resetPassword({ email: demoAccount.email, token: demoResetToken, newPassword: 'short' }))

    expect(error.errors?.Password).toHaveLength(1)
  })

  it('keeps working in memory when storage throws', async () => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('Blocked', 'SecurityError')
      })
    }

    const session = await signIn({ email: demoAccount.email, password: demoAccount.password, remember: true })
    await expect(getSession()).resolves.toEqual(session)
  })
})
