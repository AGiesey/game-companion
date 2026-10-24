import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client.ts'
import { fieldErrorsFrom } from './formErrors.ts'

const validation = (errors: Record<string, string[]>) =>
  new ApiError(400, 'One or more validation errors occurred.', { status: 400, errors })

describe('fieldErrorsFrom', () => {
  it('matches server field names to form fields ignoring case', () => {
    const result = fieldErrorsFrom(validation({ Email: ['Taken.'], password: ['Too short.', 'Needs a digit.'] }), [
      'email',
      'password',
    ])

    expect(result).toEqual({ fieldErrors: { email: 'Taken.', password: 'Too short. Needs a digit.' }, formError: undefined })
  })

  it('maps aliased server names onto form fields', () => {
    const result = fieldErrorsFrom(validation({ Password: ['Too short.'] }), ['newPassword'], { password: 'newPassword' })

    expect(result.fieldErrors).toEqual({ newPassword: 'Too short.' })
  })

  it('collects messages for unknown fields at form level', () => {
    const result = fieldErrorsFrom(validation({ Username: ['Not allowed.'] }), ['email'])

    expect(result).toEqual({ fieldErrors: {}, formError: 'Not allowed.' })
  })

  it('uses the error message when there are no field errors', () => {
    expect(fieldErrorsFrom(new ApiError(0, 'Couldn’t reach the server.'), ['email'])).toEqual({
      fieldErrors: {},
      formError: 'Couldn’t reach the server.',
    })
  })

  it('falls back to a generic message for unexpected errors', () => {
    expect(fieldErrorsFrom(new Error('bug'), ['email']).formError).toBe('Something went wrong. Try again.')
  })
})
