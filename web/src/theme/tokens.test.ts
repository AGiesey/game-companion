import { describe, expect, it } from 'vitest'
import eldenRingCss from '../styles/themes/elden-ring.css?raw'
import generalCss from '../styles/themes/general.css?raw'
import { themes, type ThemeId } from './themes.ts'
import { colorTokens, contrastPairs, minimumContrast, otherThemeTokens } from './tokens.ts'

const themeCss: Record<ThemeId, string> = {
  general: generalCss,
  'elden-ring': eldenRingCss,
}

function readVariables(css: string): Map<string, string> {
  const variables = new Map<string, string>()
  for (const [, name, value] of css.matchAll(/--theme-([a-z-]+):\s*([^;]+);/g)) {
    variables.set(name, value.trim())
  }
  return variables
}

// WCAG 2 relative luminance and contrast ratio.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe.each(themes.map((theme) => theme.id))('%s theme', (themeId) => {
  const variables = readVariables(themeCss[themeId])

  it('defines every token', () => {
    const missing = [...colorTokens, ...otherThemeTokens].filter((token) => !variables.has(token))
    expect(missing, `${themeId} is missing tokens`).toEqual([])
  })

  it('uses 6-digit hex for every color', () => {
    const invalid = colorTokens.filter((token) => !/^#[0-9a-f]{6}$/i.test(variables.get(token) ?? ''))
    expect(invalid, `${themeId} has non-hex colors`).toEqual([])
  })

  it(`meets ${minimumContrast}:1 for every required pair`, () => {
    const failures = contrastPairs.flatMap(({ foreground, background }) => {
      const ratio = contrast(variables.get(foreground) ?? '', variables.get(background) ?? '')
      // !(>=) so a missing or unreadable value (NaN) fails instead of passing.
      return !(ratio >= minimumContrast)
        ? [`${themeId}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1 (needs ${minimumContrast})`]
        : []
    })
    expect(failures).toEqual([])
  })
})

it('has a CSS file for every registered theme', () => {
  expect(Object.keys(themeCss).sort()).toEqual(themes.map((theme) => theme.id).sort())
})
