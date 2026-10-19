import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { requestPasswordReset } from '../api/account.ts'
import { Button } from '../components/Button.tsx'
import { FormError } from '../components/FormError.tsx'
import { TextField } from '../components/TextField.tsx'
import { AccountLayout } from './AccountLayout.tsx'
import { fieldErrorsFrom } from './formErrors.ts'
import { firstErrorTarget, useFocusOnError } from './useFocusOnError.ts'
import { validateForgotPassword, type FieldErrors } from './validation.ts'

const fields = ['email'] as const
type Field = (typeof fields)[number]

const backToSignIn = (
  <Link to="/sign-in" className="text-center text-accent-bright underline">
    Back to sign in
  </Link>
)

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({})
  const [formError, setFormError] = useState<string>()
  const { register, focus } = useFocusOnError<Field | 'form'>()

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onError: (error) => {
      const mapped = fieldErrorsFrom(error, fields)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
      focus(firstErrorTarget(fields, mapped.fieldErrors))
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateForgotPassword({ email })
    setFieldErrors(errors)
    setFormError(undefined)
    if (Object.keys(errors).length > 0) {
      focus(firstErrorTarget(fields, errors))
      return
    }
    mutation.mutate({ email: email.trim() })
  }

  return (
    <AccountLayout cardTitle="Forgot password">
      {mutation.isSuccess ? (
        // The same message whether or not the account exists, so this page can't be used to find accounts.
        <div role="status" className="flex flex-col gap-5">
          <p>
            If there’s an account for <strong>{mutation.variables.email}</strong>, we’ve sent it a link to reset the
            password. Check your inbox.
          </p>
          {backToSignIn}
        </div>
      ) : (
        <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {formError && <FormError ref={register('form')} message={formError} />}
          <p className="text-text-muted">Enter your email and we’ll send you a link to choose a new password.</p>
          <TextField
            ref={register('email')}
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <Button type="submit" variant="primary" disabled={mutation.isPending} className="font-display text-xl tracking-wide">
            {mutation.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
          {backToSignIn}
        </form>
      )}
    </AccountLayout>
  )
}
