import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import { getPing } from '../api/ping.ts'
import { renderWithProviders } from '../test/render.tsx'
import { ApiStatus } from './ApiStatus.tsx'

vi.mock('../api/ping.ts')

afterEach(() => {
  vi.mocked(getPing).mockReset()
})

describe('ApiStatus', () => {
  it('shows a loading message, then the ping result', async () => {
    vi.mocked(getPing).mockResolvedValue({ message: 'pong', serverTime: '2026-10-18T19:00:00Z' })

    renderWithProviders(<ApiStatus />)

    expect(screen.getByText('Pinging API…')).toBeInTheDocument()
    expect(await screen.findByText('pong')).toBeInTheDocument()
    expect(screen.getByText(/2026-10-18T19:00:00Z/)).toBeInTheDocument()
  })

  it('shows an alert when the ping fails', async () => {
    vi.mocked(getPing).mockRejectedValue(new ApiError(503, 'Request failed (503)'))

    renderWithProviders(<ApiStatus />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API unreachable: Request failed (503)')
  })
})
