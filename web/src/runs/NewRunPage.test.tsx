import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { ApiError } from '../api/client.ts'
import { createRun, listRuns } from '../api/runs.ts'
import { setStubDelays } from '../api/stub.ts'
import { renderWithProviders } from '../test/render.tsx'
import { RouterProbe } from '../test/RouterProbe.tsx'
import { daysAgo, seedRuns, signInAsDemo, testRun } from '../test/runs.ts'

async function openNewRun() {
  const user = userEvent.setup()
  renderWithProviders(
    <>
      <App />
      <RouterProbe />
    </>,
    { route: '/runs/new', history: ['/runs'] },
  )
  await screen.findByRole('heading', { name: 'New run' })
  return user
}

const currentLocation = () => screen.getByTestId('location').textContent
const htmlTheme = () => document.documentElement.dataset.theme
const gameGroup = () => screen.getByRole('group', { name: 'Game' })

describe('NewRunPage', () => {
  it('switches to the game’s look when the game is picked, and back on cancel without creating a run', async () => {
    await signInAsDemo()
    const user = await openNewRun()
    expect(htmlTheme()).toBe('general')

    await user.click(within(gameGroup()).getByRole('radio', { name: 'Elden Ring' }))
    expect(htmlTheme()).toBe('elden-ring')

    await user.click(screen.getByRole('link', { name: 'Cancel' }))

    expect(await screen.findByRole('heading', { name: 'Your runs' })).toBeInTheDocument()
    expect(htmlTheme()).toBe('general')
    expect(vi.mocked(createRun)).not.toHaveBeenCalled()
  })

  it('starts the run, lands in it, and Back goes to the run list with the new run first', async () => {
    const session = await signInAsDemo()
    seedRuns(session, [testRun({ id: 'older', name: 'Older run', lastOpenedAt: daysAgo(2) })])
    const user = await openNewRun()

    await user.type(screen.getByLabelText('Name'), "  Vaela's Run ")
    await user.click(screen.getByRole('radio', { name: 'Elden Ring' }))
    await user.click(screen.getByRole('button', { name: 'Start run' }))

    await vi.waitFor(() => expect(currentLocation()).toMatch(/^\/runs\/(?!new)[^/]+$/))
    // TanStack Query passes the mutation function a second, context argument; only the new run matters here.
    expect(vi.mocked(createRun).mock.calls[0][0]).toEqual({ name: "Vaela's Run", gameId: 'elden-ring', themeId: 'elden-ring' })

    await user.click(screen.getByRole('button', { name: 'Browser back' }))

    expect(currentLocation()).toBe('/runs')
    const links = within(await screen.findByRole('list')).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([expect.stringContaining("Vaela's Run"), expect.stringContaining('Older run')])
  })

  it('shows linked errors for a missing name and game, and focuses the name', async () => {
    await signInAsDemo()
    const user = await openNewRun()

    await user.click(screen.getByRole('button', { name: 'Start run' }))

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Give your run a name.')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(gameGroup()).toHaveAccessibleDescription('Choose a game.')
    expect(vi.mocked(createRun)).not.toHaveBeenCalled()
  })

  it('focuses the game choice when only the game is missing', async () => {
    await signInAsDemo()
    const user = await openNewRun()

    await user.type(screen.getByLabelText('Name'), "Vaela's Run{Enter}")

    expect(screen.getByLabelText('Name')).not.toHaveAccessibleDescription()
    expect(screen.getByRole('radio', { name: 'Elden Ring' })).toHaveFocus()
  })

  it('limits the name to 60 characters', async () => {
    await signInAsDemo()
    await openNewRun()

    expect(screen.getByLabelText('Name')).toHaveAttribute('maxLength', '60')
  })

  it('shows the server’s field errors under their fields', async () => {
    await signInAsDemo()
    vi.mocked(createRun).mockRejectedValueOnce(
      new ApiError(400, 'One or more validation errors occurred.', {
        errors: { Name: ['That name is taken by a ghost.'], GameId: ['That game is resting.'] },
      }),
    )
    const user = await openNewRun()

    await user.type(screen.getByLabelText('Name'), "Vaela's Run")
    await user.click(screen.getByRole('radio', { name: 'Elden Ring' }))
    await user.click(screen.getByRole('button', { name: 'Start run' }))

    expect(await screen.findByText('That name is taken by a ghost.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('That name is taken by a ghost.')
    expect(gameGroup()).toHaveAccessibleDescription('That game is resting.')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(currentLocation()).toBe('/runs/new')
  })

  it('shows the network message when the server can’t be reached', async () => {
    await signInAsDemo()
    vi.mocked(createRun).mockRejectedValueOnce(
      new ApiError(0, "Couldn't reach the server. Check your connection and try again."),
    )
    const user = await openNewRun()

    await user.type(screen.getByLabelText('Name'), "Vaela's Run")
    await user.click(screen.getByRole('radio', { name: 'Elden Ring' }))
    await user.click(screen.getByRole('button', { name: 'Start run' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Couldn't reach the server.")
    expect(alert).toHaveFocus()
  })

  it('disables the button while starting the run', async () => {
    await signInAsDemo()
    const user = await openNewRun()
    setStubDelays({ valueMs: 50 })
    try {
      await user.type(screen.getByLabelText('Name'), "Vaela's Run")
      await user.click(screen.getByRole('radio', { name: 'Elden Ring' }))
      await user.click(screen.getByRole('button', { name: 'Start run' }))

      expect(screen.getByRole('button', { name: 'Starting run…' })).toBeDisabled()
      await vi.waitFor(() => expect(currentLocation()).not.toBe('/runs/new'))
    } finally {
      setStubDelays({ valueMs: 0 })
    }
  })

  it('sets the page title', async () => {
    await signInAsDemo()
    await openNewRun()

    await vi.waitFor(() => expect(document.title).toBe('New run · Game Companion'))
    expect(vi.mocked(listRuns)).not.toHaveBeenCalled()
  })
})
