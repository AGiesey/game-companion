import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { createAccount } from '../api/account.ts'
import { Button } from '../components/Button.tsx'
import { FormError } from '../components/FormError.tsx'
import { TextField } from '../components/TextField.tsx'
import { AccountLayout } from './AccountLayout.tsx'
import { fieldErrorsFrom } from './formErrors.ts'
import { firstErrorTarget, useFocusOnError } from './useFocusOnError.ts'
import { sessionQueryKey } from './useSession.ts'
import { validateCreateAccount, type FieldErrors } from './validation.ts'

const fields = ['email', 'password', 'confirmPassword'] as const
type Field = (typeof fields)[number]

export function CreateAccountPage() {
  const queryClient = useQueryClient()
  const { search } = useLocation()
  const [values, setValues] = useState({ email: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({})
  const [formError, setFormError] = useState<string>()
  const { register, focus } = useFocusOnError<Field | 'form'>()

  const mutation = useMutation({
    mutationFn: createAccount,
    // The new account is signed in; RequireSignedOut moves the player on.
    onSuccess: (session) => queryClient.setQueryData(sessionQueryKey, session),
    onError: (error) => {
      const mapped = fieldErrorsFrom(error, fields)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
      focus(firstErrorTarget(fields, mapped.fieldErrors))
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateCreateAccount(values)
    setFieldErrors(errors)
    setFormError(undefined)
    if (Object.keys(errors).length > 0) {
      focus(firstErrorTarget(fields, errors))
      return
    }
    mutation.mutate({ email: values.email, password: values.password })
  }

  return (
    <AccountLayout
      cardTitle="Begin a new journey"
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/sign-in${search}`} className="font-semibold text-accent-bright underline">
            Sign in
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
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          error={fieldErrors.password}
        />
        <TextField
          ref={register('confirmPassword')}
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" variant="primary" disabled={mutation.isPending} className="font-display text-xl tracking-wide">
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AccountLayout>
  )
}
