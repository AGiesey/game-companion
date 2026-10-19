import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { getPing } from './api/ping.ts'
import { renderWithProviders } from './test/render.tsx'

vi.mock('./api/ping.ts')

beforeEach(() => {
  vi.mocked(getPing).mockResolvedValue({ message: 'pong', serverTime: '2026-10-18T19:00:00Z' })
})

describe('App routes', () => {
  it('serves the theme preview at /preview in development', async () => {
    renderWithProviders(<App />, { route: '/preview' })

    expect(screen.getByRole('heading', { name: 'Theme preview' })).toBeInTheDocument()
    expect(await screen.findByText('pong')).toBeInTheDocument()
  })

  it('shows not found for unknown addresses', () => {
    renderWithProviders(<App />, { route: '/no-such-page' })

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/')
  })
})
