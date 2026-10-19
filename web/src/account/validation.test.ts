import { describe, expect, it } from 'vitest'
import { validateCreateAccount, validateForgotPassword, validateResetPassword, validateSignIn } from './validation.ts'

describe('validateSignIn', () => {
  it('passes filled-in fields', () => {
    expect(validateSignIn({ email: 'vaela@example.com', password: 'x' })).toEqual({})
  })

  it('requires both fields', () => {
    expect(Object.keys(validateSignIn({ email: '', password: '' }))).toEqual(['email', 'password'])
  })

  it('rejects something that is not an email', () => {
    expect(validateSignIn({ email: 'vaela', password: 'x' }).email).toMatch(/email address/)
  })
})

describe('validateCreateAccount', () => {
  it('passes matching passwords without judging their strength', () => {
    expect(validateCreateAccount({ email: 'a@b.co', password: 'x', confirmPassword: 'x' })).toEqual({})
  })

  it('catches passwords that do not match', () => {
    expect(validateCreateAccount({ email: 'a@b.co', password: 'one', confirmPassword: 'two' })).toEqual({
      confirmPassword: 'The passwords don’t match.',
    })
  })

  it('requires the confirmation', () => {
    expect(validateCreateAccount({ email: 'a@b.co', password: 'one', confirmPassword: '' }).confirmPassword).toBe(
      'Enter the password again.',
    )
  })
})

describe('validateForgotPassword', () => {
  it('requires a valid email', () => {
    expect(validateForgotPassword({ email: '' }).email).toBe('Enter your email.')
    expect(validateForgotPassword({ email: 'a@b.co' })).toEqual({})
  })
})

describe('validateResetPassword', () => {
  it('requires a new password and a matching confirmation', () => {
    expect(Object.keys(validateResetPassword({ newPassword: '', confirmPassword: '' }))).toEqual([
      'newPassword',
      'confirmPassword',
    ])
    expect(validateResetPassword({ newPassword: 'abc', confirmPassword: 'abc' })).toEqual({})
  })
})
