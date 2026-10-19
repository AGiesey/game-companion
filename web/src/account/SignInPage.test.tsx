import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { signIn } from '../api/account.ts'
import { ApiError } from '../api/client.ts'
import { setStubDelays } from '../api/stub.ts'
import { demoAccount } from '../api/stubs/accountStub.ts'
import { renderWithProviders } from '../test/render.tsx'

// Real stub behaviour by default; individual tests can make signIn fail differently.
vi.mock('../api/account.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/account.ts')>()
  return { ...actual, signIn: vi.fn(actual.signIn) }
})

afterEach(() => {
  setStubDelays({ valueMs: 0 })
})

async function openSignIn(route = '/sign-in') {
  const user = userEvent.setup()
  renderWithProviders(<App />, { route })
  await screen.findByRole('heading', { name: 'Sign in' })
  return user
}

describe('SignInPage', () => {
  it('signs in and goes home', async () => {
    const user = await openSignIn()

    await user.type(screen.getByLabelText('Email'), demoAccount.email)
    await user.type(screen.getByLabelText('Password'), demoAccount.password)
    await user.click(screen.getByRole('button', { name: 'Enter' }))

    expect(await screen.findByText(`Signed in as ${demoAccount.email}`)).toBeInTheDocument()
  })

  it('returns to the remembered page after signing in', async () => {
    const user = await openSignIn('/sign-in?returnTo=%2Fsomewhere-else')

    await user.type(screen.getByLabelText('Email'), demoAccount.email)
    await user.type(screen.getByLabelText('Password'), `${demoAccount.password}{Enter}`)

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('explains a wrong password, keeps the email, and clears and focuses the password', async () => {
    const user = await openSignIn()

    await user.type(screen.getByLabelText('Email'), demoAccount.email)
    await user.type(screen.getByLabelText('Password'), 'not-the-password')
    await user.click(screen.getByRole('button', { name: 'Enter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
    expect(screen.getByLabelText('Email')).toHaveValue(demoAccount.email)
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveFocus()
  })

  it('flags empty fields next to the fields and focuses the first', async () => {
    const user = await openSignIn()

    await user.click(screen.getByRole('button', { name: 'Enter' }))

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter your email.')
    expect(screen.getByLabelText('Email')).toBeInvalid()
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password.')
    expect(screen.getByLabelText('Email')).toHaveFocus()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('shows the network message when the server is unreachable', async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new ApiError(0, 'Couldn’t reach the server. Check your connection and try again.'))
    const user = await openSignIn()

    await user.type(screen.getByLabelText('Email'), demoAccount.email)
    await user.type(screen.getByLabelText('Password'), `${demoAccount.password}{Enter}`)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Couldn’t reach the server.')
    expect(alert).toHaveFocus()
  })

  it('disables the button while signing in', async () => {
    const user = await openSignIn()
    setStubDelays({ valueMs: 50 })

    await user.type(screen.getByLabelText('Email'), demoAccount.email)
    await user.type(screen.getByLabelText('Password'), `${demoAccount.password}{Enter}`)

    expect(screen.getByRole('button', { name: 'Entering…' })).toBeDisabled()
    expect(await screen.findByText(`Signed in as ${demoAccount.email}`)).toBeInTheDocument()
  })

  it('keeps the return path when switching to create account', async () => {
    await openSignIn('/sign-in?returnTo=%2Fruns')

    expect(screen.getByRole('link', { name: 'Begin a new journey' })).toHaveAttribute('href', '/create-account?returnTo=%2Fruns')
  })
})
