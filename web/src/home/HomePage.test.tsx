import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { sessionQueryKey } from '../account/useSession.ts'
import { signOut } from '../api/account.ts'
import { ApiError } from '../api/client.ts'
import { demoAccount, signIn } from '../test/fakeAccountServer.ts'
import { renderWithProviders } from '../test/render.tsx'

async function openHomeSignedIn() {
  await signIn({ email: demoAccount.email, password: demoAccount.password, remember: true })
  const user = userEvent.setup()
  const rendered = renderWithProviders(<App />, { route: '/' })
  await screen.findByText(`Signed in as ${demoAccount.email}`)
  return { user, ...rendered }
}

describe('HomePage', () => {
  it('signs out and returns to sign-in', async () => {
    const { user, queryClient } = await openHomeSignedIn()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull()
  })

  it('still signs out locally when the server call fails', async () => {
    vi.mocked(signOut).mockRejectedValueOnce(new ApiError(0, 'Couldn’t reach the server.'))
    const { user, queryClient } = await openHomeSignedIn()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull()
  })
})
