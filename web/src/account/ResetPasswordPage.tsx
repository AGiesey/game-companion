import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { resetPassword } from '../api/account.ts'
import { ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { FormError } from '../components/FormError.tsx'
import { TextField } from '../components/TextField.tsx'
import { AccountLayout } from './AccountLayout.tsx'
import { fieldErrorsFrom } from './formErrors.ts'
import { firstErrorTarget, useFocusOnError } from './useFocusOnError.ts'
import { validateResetPassword, type FieldErrors } from './validation.ts'

const fields = ['newPassword', 'confirmPassword'] as const
type Field = (typeof fields)[number]

// Opened from the emailed link: /reset-password?email=…&token=…
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const token = searchParams.get('token')
  const [values, setValues] = useState({ newPassword: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({})
  const [formError, setFormError] = useState<string>()
  const [linkRejected, setLinkRejected] = useState(false)
  const { register, focus } = useFocusOnError<Field | 'form'>()

  const mutation = useMutation({
    mutationFn: resetPassword,
    onError: (error) => {
      // A 400 without field errors means the token was refused.
      if (error instanceof ApiError && error.status === 400 && !error.errors) {
        setLinkRejected(true)
        return
      }
      // The API's "Password" errors belong to the new password field.
      const mapped = fieldErrorsFrom(error, fields, { password: 'newPassword' })
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
      focus(firstErrorTarget(fields, mapped.fieldErrors))
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateResetPassword(values)
    setFieldErrors(errors)
    setFormError(undefined)
    if (Object.keys(errors).length > 0) {
      focus(firstErrorTarget(fields, errors))
      return
    }
    if (email && token) mutation.mutate({ email, token, newPassword: values.newPassword })
  }

  if (!email || !token || linkRejected) {
    return (
      <AccountLayout cardTitle="Choose a new password">
        <div role="alert" className="flex flex-col gap-5">
          <p>This reset link is invalid or has expired. Reset links work once, for a limited time.</p>
          <Link to="/forgot-password" className="text-center text-accent-bright underline">
            Send a new link
          </Link>
        </div>
      </AccountLayout>
    )
  }

  if (mutation.isSuccess) {
    return (
      <AccountLayout cardTitle="Choose a new password">
        <div role="status" className="flex flex-col gap-5">
          <p>Your password has been changed.</p>
          <Link to="/sign-in" className="text-center text-accent-bright underline">
            Sign in
          </Link>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout cardTitle="Choose a new password">
      <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {formError && <FormError ref={register('form')} message={formError} />}
        <p className="text-text-muted">
          For <strong className="text-text">{email}</strong>
        </p>
        <TextField
          ref={register('newPassword')}
          label="New password"
          type="password"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={(event) => setValues({ ...values, newPassword: event.target.value })}
          error={fieldErrors.newPassword}
        />
        <TextField
          ref={register('confirmPassword')}
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
          error={fieldErrors.confirmPassword}
        />
        <Button type="submit" variant="primary" disabled={mutation.isPending} className="font-display text-xl tracking-wide">
          {mutation.isPending ? 'Changing password…' : 'Change password'}
        </Button>
      </form>
    </AccountLayout>
  )
}
