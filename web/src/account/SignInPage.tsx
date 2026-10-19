import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { signIn } from '../api/account.ts'
import { ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { FormError } from '../components/FormError.tsx'
import { TextField } from '../components/TextField.tsx'
import { AccountLayout } from './AccountLayout.tsx'
import { fieldErrorsFrom } from './formErrors.ts'
import { firstErrorTarget, useFocusOnError } from './useFocusOnError.ts'
import { sessionQueryKey } from './useSession.ts'
import { validateSignIn, type FieldErrors } from './validation.ts'

const fields = ['email', 'password'] as const
type Field = (typeof fields)[number]

export function SignInPage() {
  const queryClient = useQueryClient()
  // Keeps ?returnTo=… when switching to create account, so either way the player ends up where they were going.
  const { search } = useLocation()
  const [values, setValues] = useState({ email: '', password: '', remember: true })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({})
  const [formError, setFormError] = useState<string>()
  const { register, focus } = useFocusOnError<Field | 'form'>()

  const mutation = useMutation({
    mutationFn: signIn,
    // A 401 here means wrong credentials, not an ended session.
    meta: { expectsUnauthenticated: true },
    // RequireSignedOut sees the session and moves the player on.
    onSuccess: (session) => queryClient.setQueryData(sessionQueryKey, session),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        setValues((current) => ({ ...current, password: '' }))
        setFieldErrors({})
        setFormError('Email or password is incorrect.')
        focus('password')
        return
      }
      const mapped = fieldErrorsFrom(error, fields)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
      focus(firstErrorTarget(fields, mapped.fieldErrors))
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateSignIn(values)
    setFieldErrors(errors)
    setFormError(undefined)
    if (Object.keys(errors).length > 0) {
      focus(firstErrorTarget(fields, errors))
      return
    }
    mutation.mutate(values)
  }

  return (
    <AccountLayout
      eyebrow="Your journey continues"
      cardTitle="Sign in"
      footer={
        <>
          New here?{' '}
          <Link to={`/create-account${search}`} className="font-semibold text-accent-bright underline">
            Begin a new journey
          </Link>
        </>
      }
    >
      <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {formError && <FormError ref={register('form')} message={formError} />}

        <TextField
          ref={register('email')}
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          error={fieldErrors.email}
        />
        <TextField
          ref={register('password')}
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          error={fieldErrors.password}
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.remember}
            onChange={(event) => setValues({ ...values, remember: event.target.checked })}
            className="size-5 accent-accent"
          />
          Keep me signed in on this device
        </label>

        <Button type="submit" variant="primary" disabled={mutation.isPending} className="font-display text-xl tracking-wide">
          {mutation.isPending ? 'Entering…' : 'Enter'}
        </Button>

        <Link to="/forgot-password" className="text-center text-accent-bright underline">
          Forgot password?
        </Link>
      </form>
    </AccountLayout>
  )
}
