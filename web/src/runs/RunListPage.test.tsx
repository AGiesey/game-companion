import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { sessionQueryKey } from '../account/useSession.ts'
import { signOut } from '../api/account.ts'
import { ApiError } from '../api/client.ts'
import { listRuns } from '../api/runs.ts'
import { setStubDelays } from '../api/stub.ts'
import { renderWithProviders } from '../test/render.tsx'
import { daysAgo, seedRuns, signInAsDemo, testRun } from '../test/runs.ts'
import { themeStorageKey } from '../theme/storage.ts'

async function openRunList() {
  const user = userEvent.setup()
  const rendered = renderWithProviders(<App />, { route: '/runs' })
  await screen.findByRole('heading', { name: 'Your runs' })
  return { user, ...rendered }
}

describe('RunListPage', () => {
  it('lists runs most recently opened first, each a link named by the run', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [
      testRun({ id: 'older', name: 'Older run', lastOpenedAt: daysAgo(3) }),
      testRun({ id: 'recent', name: "Vaela's Run", lastOpenedAt: daysAgo(0) }),
    ])
    await openRunList()

    const list = await screen.findByRole('list')
    const links = within(list).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/runs/recent', '/runs/older'])
    expect(screen.getByRole('link', { name: "Vaela's Run" })).toHaveAccessibleDescription('Elden Ring · Opened today')
    expect(screen.getByRole('link', { name: 'Older run' })).toHaveAccessibleDescription(/^Elden Ring · Opened /)
  })

  it('says when a run was started if it was never opened, and names unknown games', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [testRun({ id: 'new', name: 'Fresh run', gameId: 'removed-game', createdAt: daysAgo(0) })])
    await openRunList()

    expect(await screen.findByRole('link', { name: 'Fresh run' })).toHaveAccessibleDescription(
      'Unknown game · Started today',
    )
  })

  it('invites a player with no runs to start one', async () => {
    await signInAsDemo()
    await openRunList()

    expect(await screen.findByText('No runs yet. Start one when you begin a game.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New run' })).toHaveAttribute('href', '/runs/new')
  })

  it('shows a loading state while the runs load', async () => {
    await signInAsDemo()
    setStubDelays({ valueMs: 50 })
    try {
      renderWithProviders(<App />, { route: '/runs' })

      expect(await screen.findByText('Loading your runs…')).toHaveAttribute('role', 'status')
      expect(await screen.findByText('No runs yet. Start one when you begin a game.')).toBeInTheDocument()
    } finally {
      setStubDelays({ valueMs: 0 })
    }
  })

  it('shows an error when the runs fail to load, and tries again', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [testRun({ id: 'recent', name: "Vaela's Run", lastOpenedAt: daysAgo(0) })])
    vi.mocked(listRuns).mockRejectedValueOnce(
      new ApiError(0, "Couldn't reach the server. Check your connection and try again."),
    )
    const { user } = await openRunList()

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach the server.")

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: "Vaela's Run" })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('uses the player’s default theme, not the device’s last theme', async () => {
    localStorage.setItem(themeStorageKey, 'elden-ring')
    await signInAsDemo()
    await openRunList()

    expect(document.documentElement.dataset.theme).toBe('general')
  })

  it('sets the page title', async () => {
    await signInAsDemo()
    await openRunList()

    await vi.waitFor(() => expect(document.title).toBe('Your runs · Game Companion'))
  })

  it('signs out and returns to sign-in', async () => {
    await signInAsDemo()
    const { user, queryClient } = await openRunList()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull()
  })

  it('still signs out locally when the server call fails', async () => {
    vi.mocked(signOut).mockRejectedValueOnce(new ApiError(0, 'Couldn’t reach the server.'))
    await signInAsDemo()
    const { user, queryClient } = await openRunList()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull()
  })
})
