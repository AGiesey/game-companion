import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { ApiError } from './api/client.ts'
import { getPing } from './api/ping.ts'
import { renderWithQuery } from './test/render.tsx'

vi.mock('./api/ping.ts')

afterEach(() => {
  vi.mocked(getPing).mockReset()
})

describe('App', () => {
  it('shows a loading message, then the ping result', async () => {
    vi.mocked(getPing).mockResolvedValue({ message: 'pong', serverTime: '2026-10-18T19:00:00Z' })

    renderWithQuery(<App />)

    expect(screen.getByText('Pinging API…')).toBeInTheDocument()
    expect(await screen.findByText('pong')).toBeInTheDocument()
    expect(screen.getByText(/2026-10-18T19:00:00Z/)).toBeInTheDocument()
  })

  it('shows an alert when the ping fails', async () => {
    vi.mocked(getPing).mockRejectedValue(new ApiError(503, 'Request failed (503)'))

    renderWithQuery(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API unreachable: Request failed (503)')
  })
})
