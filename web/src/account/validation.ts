// Checks that don't depend on the backend's rules (spec FR-14). Password strength is the backend's call.

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailError(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email.'
  if (!emailPattern.test(email.trim())) return 'Enter an email address like name@example.com.'
  return undefined
}

function confirmError(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Enter the password again.'
  if (confirm !== password) return 'The passwords don’t match.'
  return undefined
}

// Drops fields without an error, so an empty object means the form is valid.
function onlyErrors<Field extends string>(errors: Record<Field, string | undefined>): FieldErrors<Field> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FieldErrors<Field>
}

export function validateSignIn(values: { email: string; password: string }) {
  return onlyErrors({
    email: emailError(values.email),
    password: values.password ? undefined : 'Enter your password.',
  })
}

export function validateCreateAccount(values: { email: string; password: string; confirmPassword: string }) {
  return onlyErrors({
    email: emailError(values.email),
    password: values.password ? undefined : 'Choose a password.',
    confirmPassword: confirmError(values.password, values.confirmPassword),
  })
}

export function validateForgotPassword(values: { email: string }) {
  return onlyErrors({ email: emailError(values.email) })
}

export function validateResetPassword(values: { newPassword: string; confirmPassword: string }) {
  return onlyErrors({
    newPassword: values.newPassword ? undefined : 'Choose a new password.',
    confirmPassword: confirmError(values.newPassword, values.confirmPassword),
  })
}
