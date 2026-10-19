import { ApiError } from '../api/client.ts'
import type { FieldErrors } from './validation.ts'

export interface MappedErrors<Field extends string> {
  fieldErrors: FieldErrors<Field>
  formError?: string
}

// Turns a failed API call into errors a form can show (spec FR-15). Validation errors go under the matching
// field; ASP.NET may send "Email" or "email", so keys match ignoring case. `aliases` maps server names that
// differ from the form's (for example the API's "Password" onto a "newPassword" field).
export function fieldErrorsFrom<Field extends string>(
  error: unknown,
  fields: readonly Field[],
  aliases: Record<string, Field> = {},
): MappedErrors<Field> {
  if (!(error instanceof ApiError)) return { fieldErrors: {}, formError: 'Something went wrong. Try again.' }
  if (!error.errors) return { fieldErrors: {}, formError: error.message }

  const fieldErrors: FieldErrors<Field> = {}
  const unmatched: string[] = []
  for (const [key, messages] of Object.entries(error.errors)) {
    const lower = key.toLowerCase()
    const field = fields.find((f) => f.toLowerCase() === lower) ?? aliases[lower]
    if (field) fieldErrors[field] = messages.join(' ')
    else unmatched.push(...messages)
  }
  return { fieldErrors, formError: unmatched.length > 0 ? unmatched.join(' ') : undefined }
}
