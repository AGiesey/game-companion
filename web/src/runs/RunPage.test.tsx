import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { ApiError } from '../api/client.ts'
import { getRun, recordRunOpened } from '../api/runs.ts'
import { renderWithProviders } from '../test/render.tsx'
import { RouterProbe } from '../test/RouterProbe.tsx'
import { daysAgo, seedRuns, signInAsDemo, testRun } from '../test/runs.ts'
import { runQueryKey } from './runQueries.ts'

const vaelasRun = testRun({ id: 'vaela', name: "Vaela's Run", lastOpenedAt: daysAgo(2) })

function renderApp(route: string, { strict = false } = {}) {
  const app = (
    <>
      <App />
      <RouterProbe />
    </>
  )
  return renderWithProviders(strict ? <StrictMode>{app}</StrictMode> : app, { route })
}

async function openRun(route = '/runs/vaela', options?: { strict?: boolean }) {
  const user = userEvent.setup()
  const rendered = renderApp(route, options)
  await screen.findByRole('heading', { level: 1, name: "Vaela's Run" })
  return { user, ...rendered }
}

const htmlTheme = () => document.documentElement.dataset.theme
const currentLocation = () => screen.getByTestId('location').textContent

describe('RunPage', () => {
  it('shows the run’s header in the run’s theme', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun])
    await openRun()

    expect(htmlTheme()).toBe('elden-ring')
    expect(screen.getByText('Elden Ring')).toBeInTheDocument()
    expect(screen.getByText('Your conversation with the companion will appear here.')).toBeInTheDocument()
    await vi.waitFor(() => expect(document.title).toBe("Vaela's Run · Game Companion"))
  })

  it('goes back to the run list in the default theme', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun])
    const { user } = await openRun()

    await user.click(screen.getByRole('link', { name: 'Your runs' }))

    expect(await screen.findByRole('heading', { name: 'Your runs' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/runs')
    expect(htmlTheme()).toBe('general')
  })

  it('arrives from creating a run in the game’s theme', async () => {
    await signInAsDemo()
    const user = userEvent.setup()
    renderApp('/runs/new')

    await user.type(await screen.findByLabelText('Name'), 'Night run')
    await user.click(screen.getByRole('radio', { name: 'Elden Ring' }))
    await user.click(screen.getByRole('button', { name: 'Start run' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Night run' })).toBeInTheDocument()
    expect(htmlTheme()).toBe('elden-ring')
  })

  it('records the open once per arrival, even when the run refetches', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun])
    const { queryClient } = await openRun()
    await vi.waitFor(() => expect(vi.mocked(recordRunOpened)).toHaveBeenCalledTimes(1))

    await queryClient.refetchQueries({ queryKey: runQueryKey('vaela') })

    expect(vi.mocked(recordRunOpened)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(recordRunOpened).mock.calls[0][0]).toBe('vaela')
  })

  it('records the open once under StrictMode', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun])
    await openRun('/runs/vaela', { strict: true })

    await vi.waitFor(() => expect(vi.mocked(recordRunOpened)).toHaveBeenCalledTimes(1))
  })

  it('records the open again when the player comes back through the list', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun])
    const { user } = await openRun()
    await vi.waitFor(() => expect(vi.mocked(recordRunOpened)).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('link', { name: 'Your runs' }))
    await user.click(await screen.findByRole('link', { name: "Vaela's Run" }))

    await screen.findByRole('heading', { level: 1, name: "Vaela's Run" })
    await vi.waitFor(() => expect(vi.mocked(recordRunOpened)).toHaveBeenCalledTimes(2))
  })

  it('makes an opened run the most recent', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun, testRun({ id: 'other', name: 'Other run', lastOpenedAt: daysAgo(1) })])
    const { user } = await openRun()
    await vi.waitFor(() => expect(vi.mocked(recordRunOpened)).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('link', { name: 'Your runs' }))

    const list = await screen.findByRole('list')
    await vi.waitFor(() => expect(within(list).getAllByRole('link')[0]).toHaveAttribute('href', '/runs/vaela'))
  })

  it('shows nothing when recording the open fails', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun])
    vi.mocked(recordRunOpened).mockRejectedValueOnce(new ApiError(500, 'Request failed (500)'))
    await openRun()

    await vi.waitFor(() => expect(vi.mocked(recordRunOpened)).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: "Vaela's Run" })).toBeInTheDocument()
  })

  it('says the run wasn’t found, in the default theme, for a missing run or another player’s', async () => {
    await signInAsDemo()
    renderApp('/runs/someone-elses')

    expect(await screen.findByRole('heading', { name: 'Run not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Your runs' })).toHaveAttribute('href', '/runs')
    expect(htmlTheme()).toBe('general')
    expect(vi.mocked(recordRunOpened)).not.toHaveBeenCalled()
  })

  it('shows other errors with a way to try again', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [vaelasRun])
    vi.mocked(getRun).mockRejectedValueOnce(new ApiError(0, "Couldn't reach the server. Check your connection and try again."))
    const user = userEvent.setup()
    renderApp('/runs/vaela')

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach the server.")

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 1, name: "Vaela's Run" })).toBeInTheDocument()
  })

  it('names an unknown game as such', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [{ ...vaelasRun, gameId: 'removed-game' }])
    await openRun()

    expect(screen.getByText('Unknown game')).toBeInTheDocument()
  })

  it('falls back to the default theme when the run’s theme no longer exists', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [{ ...vaelasRun, themeId: 'removed-theme' }])
    await openRun()

    expect(htmlTheme()).toBe('general')
  })

  it('follows the default theme when the run has none', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [{ ...vaelasRun, themeId: null }])
    await openRun()

    expect(htmlTheme()).toBe('general')
  })
})
