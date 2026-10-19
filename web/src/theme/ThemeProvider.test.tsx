import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { themeStorageKey } from './storage.ts'
import { ThemeProvider } from './ThemeProvider.tsx'
import { useTheme } from './useTheme.ts'

function ShowTheme() {
  const { themeId, setThemeId } = useTheme()
  return (
    <>
      <p>{themeId}</p>
      <button type="button" onClick={() => setThemeId('elden-ring')}>
        Use Elden Ring
      </button>
    </>
  )
}

const htmlTheme = () => document.documentElement.dataset.theme

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ThemeProvider', () => {
  it('applies General when nothing is set', () => {
    render(
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>,
    )

    expect(screen.getByText('general')).toBeInTheDocument()
    expect(htmlTheme()).toBe('general')
  })

  it('starts from the theme last used on this device', () => {
    localStorage.setItem(themeStorageKey, 'elden-ring')

    render(
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>,
    )

    expect(htmlTheme()).toBe('elden-ring')
  })

  it('prefers the run theme over the user theme, and the user theme over the device', () => {
    localStorage.setItem(themeStorageKey, 'general')

    const { rerender } = render(
      <ThemeProvider userThemeId="elden-ring">
        <ShowTheme />
      </ThemeProvider>,
    )
    expect(htmlTheme()).toBe('elden-ring')

    rerender(
      <ThemeProvider runThemeId="general" userThemeId="elden-ring">
        <ShowTheme />
      </ThemeProvider>,
    )
    expect(htmlTheme()).toBe('general')
  })

  it('switches theme and remembers it on this device', () => {
    render(
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>,
    )

    act(() => screen.getByRole('button', { name: 'Use Elden Ring' }).click())

    expect(htmlTheme()).toBe('elden-ring')
    expect(localStorage.getItem(themeStorageKey)).toBe('elden-ring')
  })

  it('still switches when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    render(
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>,
    )
    expect(htmlTheme()).toBe('general')

    act(() => screen.getByRole('button', { name: 'Use Elden Ring' }).click())
    expect(htmlTheme()).toBe('elden-ring')
  })

  it('throws a clear error when useTheme is used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<ShowTheme />)).toThrow('useTheme must be used inside a ThemeProvider.')
  })
})
