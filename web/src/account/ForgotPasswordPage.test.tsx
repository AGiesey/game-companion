import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { demoAccount } from '../api/stubs/accountStub.ts'
import { renderWithProviders } from '../test/render.tsx'

async function openForgotPassword() {
  const user = userEvent.setup()
  renderWithProviders(<App />, { route: '/forgot-password' })
  await screen.findByRole('heading', { name: 'Forgot password' })
  return user
}

describe('ForgotPasswordPage', () => {
  it.each([
    ['an existing account', demoAccount.email],
    ['an unknown email', 'nobody@example.com'],
  ])('shows the same confirmation for %s', async (_label, email) => {
    const user = await openForgotPassword()

    await user.type(screen.getByLabelText('Email'), `${email}{Enter}`)

    expect(await screen.findByRole('status')).toHaveTextContent(
      `If there’s an account for ${email}, we’ve sent it a link to reset the password.`,
    )
  })

  it('flags a malformed email and focuses it', async () => {
    const user = await openForgotPassword()

    await user.type(screen.getByLabelText('Email'), 'vaela{Enter}')

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter an email address like name@example.com.')
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('links back to sign in', async () => {
    await openForgotPassword()

    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/sign-in')
  })
})
