import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { themeStorageKey } from './storage.ts'
import { ThemeProvider } from './ThemeProvider.tsx'
import { useTheme } from './useTheme.ts'
import { useRunTheme, useUserTheme } from './useThemeSources.ts'

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

function RunTheme({ themeId }: { themeId: string | null }) {
  useRunTheme(themeId)
  return null
}

function UserTheme({ themeId }: { themeId: string | null }) {
  useUserTheme(themeId)
  return null
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

  it('uses the run theme a screen sets, until that screen unmounts', () => {
    localStorage.setItem(themeStorageKey, 'general')

    const { rerender } = render(
      <ThemeProvider>
        <RunTheme themeId="elden-ring" />
      </ThemeProvider>,
    )
    expect(htmlTheme()).toBe('elden-ring')

    rerender(<ThemeProvider>{null}</ThemeProvider>)
    expect(htmlTheme()).toBe('general')
  })

  it('uses the user theme a screen sets, until that screen unmounts', () => {
    localStorage.setItem(themeStorageKey, 'elden-ring')

    const { rerender } = render(
      <ThemeProvider>
        <UserTheme themeId="general" />
      </ThemeProvider>,
    )
    expect(htmlTheme()).toBe('general')

    rerender(<ThemeProvider>{null}</ThemeProvider>)
    expect(htmlTheme()).toBe('elden-ring')
  })

  it('prefers a screen’s run theme over its user theme', () => {
    render(
      <ThemeProvider>
        <UserTheme themeId="general" />
        <RunTheme themeId="elden-ring" />
      </ThemeProvider>,
    )

    expect(htmlTheme()).toBe('elden-ring')
  })

  it('follows a run theme a screen changes, and falls back when it is cleared', () => {
    const { rerender } = render(
      <ThemeProvider>
        <UserTheme themeId="general" />
        <RunTheme themeId="elden-ring" />
      </ThemeProvider>,
    )

    rerender(
      <ThemeProvider>
        <UserTheme themeId="general" />
        <RunTheme themeId={null} />
      </ThemeProvider>,
    )
    expect(htmlTheme()).toBe('general')
  })

  it('lets props win over the themes screens set', () => {
    render(
      <ThemeProvider runThemeId="general" userThemeId="general">
        <UserTheme themeId="elden-ring" />
        <RunTheme themeId="elden-ring" />
      </ThemeProvider>,
    )

    expect(htmlTheme()).toBe('general')
  })

  it('throws a clear error when useTheme is used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<ShowTheme />)).toThrow('useTheme must be used inside a ThemeProvider.')
  })

  it('throws a clear error when useRunTheme is used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<RunTheme themeId="general" />)).toThrow(
      'useRunTheme and useUserTheme must be used inside a ThemeProvider.',
    )
  })
})
