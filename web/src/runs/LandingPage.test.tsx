import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { signOut } from '../api/account.ts'
import { ApiError } from '../api/client.ts'
import { listRuns } from '../api/runs.ts'
import { demoAccount } from '../test/fakeAccountServer.ts'
import { renderWithProviders } from '../test/render.tsx'
import { RouterProbe } from '../test/RouterProbe.tsx'
import { daysAgo, seedRuns, signInAsDemo, testRun } from '../test/runs.ts'

function renderApp(route: string, history: string[] = []) {
  return renderWithProviders(
    <>
      <App />
      <RouterProbe />
    </>,
    { route, history },
  )
}

const currentLocation = () => screen.getByTestId('location').textContent

describe('landing', () => {
  it('sends the player to the run they opened most recently', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [
      testRun({ id: 'older', name: 'Older run', lastOpenedAt: daysAgo(5) }),
      testRun({ id: 'recent', name: "Vaela's Run", lastOpenedAt: daysAgo(1) }),
    ])

    renderApp('/')

    await vi.waitFor(() => expect(currentLocation()).toBe('/runs/recent'))
  })

  it('sends a player with no runs to the run list', async () => {
    await signInAsDemo()

    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Your runs' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/runs')
  })

  it('sends the player to the run list when their runs fail to load', async () => {
    await signInAsDemo()
    vi.mocked(listRuns).mockRejectedValueOnce(new ApiError(0, 'Couldn’t reach the server.'))

    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Your runs' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/runs')
  })

  it('lands in the most recent run right after signing in', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [testRun({ id: 'recent', name: "Vaela's Run", lastOpenedAt: daysAgo(1) })])
    await signOut()
    const user = userEvent.setup()
    renderApp('/sign-in')

    await user.type(await screen.findByLabelText('Email'), demoAccount.email)
    await user.type(screen.getByLabelText('Password'), `${demoAccount.password}{Enter}`)

    await vi.waitFor(() => expect(currentLocation()).toBe('/runs/recent'))
  })

  it('lets a remembered return path win over the most recent run', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [testRun({ id: 'recent', name: "Vaela's Run", lastOpenedAt: daysAgo(1) })])
    await signOut()
    const user = userEvent.setup()
    renderApp('/sign-in?returnTo=%2Fruns%2Fnew')

    await user.type(await screen.findByLabelText('Email'), demoAccount.email)
    await user.type(screen.getByLabelText('Password'), `${demoAccount.password}{Enter}`)

    expect(await screen.findByRole('heading', { name: 'New run' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/runs/new')
  })

  it('replaces itself in the history, so Back skips it', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [testRun({ id: 'recent', name: "Vaela's Run", lastOpenedAt: daysAgo(1) })])
    const user = userEvent.setup()
    renderApp('/', ['/no-such-page'])
    await vi.waitFor(() => expect(currentLocation()).toBe('/runs/recent'))

    await user.click(screen.getByRole('button', { name: 'Browser back' }))

    expect(currentLocation()).toBe('/no-such-page')
  })
})
