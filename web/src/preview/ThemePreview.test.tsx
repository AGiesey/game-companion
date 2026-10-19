import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPing } from '../api/ping.ts'
import { renderWithProviders } from '../test/render.tsx'
import { ThemePreview } from './ThemePreview.tsx'

vi.mock('../api/ping.ts')

beforeEach(() => {
  vi.mocked(getPing).mockResolvedValue({ message: 'pong', serverTime: '2026-10-18T19:00:00Z' })
})

const htmlTheme = () => document.documentElement.dataset.theme

describe('ThemePreview', () => {
  it('starts in General with its radio checked', () => {
    renderWithProviders(<ThemePreview />)

    expect(htmlTheme()).toBe('general')
    expect(screen.getByRole('radio', { name: 'General' })).toBeChecked()
  })

  it('switches the whole page to Elden Ring from the theme switcher', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ThemePreview />)

    await user.click(screen.getByRole('radio', { name: 'Elden Ring' }))

    expect(htmlTheme()).toBe('elden-ring')
    expect(screen.getByRole('radio', { name: 'Elden Ring' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'General' })).not.toBeChecked()
  })

  it('can be switched from the keyboard', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ThemePreview />)

    await user.click(screen.getByRole('radio', { name: 'General' }))
    await user.keyboard('{ArrowDown}')

    expect(htmlTheme()).toBe('elden-ring')
  })

  it('shows the parts of every mocked screen', async () => {
    renderWithProviders(<ThemePreview />)

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Vaela's Run" })).toBeInTheDocument()
    expect(screen.getByText('Saving to your run journal')).toBeInTheDocument()
    expect(screen.getByText('Spoiler ahead')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Just a hint' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
    expect(screen.getByText('INT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enter' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(await screen.findByText('pong')).toBeInTheDocument()
  })
})
