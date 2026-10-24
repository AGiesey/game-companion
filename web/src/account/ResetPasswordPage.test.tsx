import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { demoAccount, demoResetToken, signIn } from '../test/fakeAccountServer.ts'
import { renderWithProviders } from '../test/render.tsx'

const resetLink = (token = demoResetToken) =>
  `/reset-password?email=${encodeURIComponent(demoAccount.email)}&token=${encodeURIComponent(token)}`

async function openReset(route: string) {
  const user = userEvent.setup()
  renderWithProviders(<App />, { route })
  await screen.findByRole('heading', { name: 'Choose a new password' })
  return user
}

async function choosePassword(user: ReturnType<typeof userEvent.setup>, password: string, confirm = password) {
  await user.type(screen.getByLabelText('New password'), password)
  await user.type(screen.getByLabelText('Confirm new password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Change password' }))
}

describe('ResetPasswordPage', () => {
  it('changes the password', async () => {
    const user = await openReset(resetLink())

    await choosePassword(user, 'brand-new-password')

    expect(await screen.findByRole('status')).toHaveTextContent('Your password has been changed.')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
    await expect(
      signIn({ email: demoAccount.email, password: 'brand-new-password', remember: false }),
    ).resolves.toMatchObject({ email: demoAccount.email })
  })

  it('explains an invalid or expired link', async () => {
    const user = await openReset(resetLink('expired-token'))

    await choosePassword(user, 'brand-new-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('This reset link is invalid or has expired.')
    expect(screen.getByRole('link', { name: 'Send a new link' })).toHaveAttribute('href', '/forgot-password')
  })

  it('explains a link missing its token', async () => {
    await openReset(`/reset-password?email=${encodeURIComponent(demoAccount.email)}`)

    expect(screen.getByRole('alert')).toHaveTextContent('This reset link is invalid or has expired.')
  })

  it('catches mismatched passwords before calling the API', async () => {
    const user = await openReset(resetLink())

    await choosePassword(user, 'brand-new-password', 'something-else')

    expect(screen.getByLabelText('Confirm new password')).toHaveAccessibleDescription('The passwords don’t match.')
    expect(screen.getByLabelText('Confirm new password')).toHaveFocus()
  })

  it('shows the server’s password rules under the new password', async () => {
    const user = await openReset(resetLink())

    await choosePassword(user, 'short')

    expect(await screen.findByText('Passwords must be at least 8 characters.')).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription('Passwords must be at least 8 characters.')
    expect(screen.getByLabelText('New password')).toHaveFocus()
  })
})
