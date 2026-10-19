import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { createAccount } from '../api/account.ts'
import { demoAccount } from '../api/stubs/accountStub.ts'
import { renderWithProviders } from '../test/render.tsx'

vi.mock('../api/account.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/account.ts')>()
  return { ...actual, createAccount: vi.fn(actual.createAccount) }
})

async function openCreateAccount() {
  const user = userEvent.setup()
  renderWithProviders(<App />, { route: '/create-account' })
  await screen.findByRole('heading', { name: 'Begin a new journey' })
  return user
}

async function fillIn(user: ReturnType<typeof userEvent.setup>, email: string, password: string, confirm: string) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('CreateAccountPage', () => {
  it('creates the account, signs it in and goes home', async () => {
    const user = await openCreateAccount()

    await fillIn(user, 'tarnished@example.com', 'long-enough', 'long-enough')

    expect(await screen.findByText('Signed in as tarnished@example.com')).toBeInTheDocument()
  })

  it('catches mismatched passwords without calling the API', async () => {
    const user = await openCreateAccount()

    await fillIn(user, 'tarnished@example.com', 'long-enough', 'different')

    expect(screen.getByLabelText('Confirm password')).toHaveAccessibleDescription('The passwords don’t match.')
    expect(screen.getByLabelText('Confirm password')).toHaveFocus()
    expect(createAccount).not.toHaveBeenCalled()
  })

  it('shows the server’s field errors under their fields and focuses the first', async () => {
    const user = await openCreateAccount()

    await fillIn(user, demoAccount.email, 'short', 'short')

    expect(await screen.findByText(/is already taken/)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(`Email '${demoAccount.email}' is already taken.`)
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Passwords must be at least 8 characters.')
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('links back to sign in', async () => {
    await openCreateAccount()

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
  })
})
