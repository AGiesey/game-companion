// Token names from web/design/README.md. Each theme file defines --theme-<name> for every one.

export const colorTokens = [
  'bg',
  'bg-chrome',
  'backdrop',
  'surface',
  'surface-input',
  'surface-sheet',
  'surface-card',
  'surface-callout',
  'border',
  'border-subtle',
  'border-list',
  'border-accent',
  'text',
  'text-strong',
  'text-muted',
  'text-faint',
  'accent',
  'accent-bright',
  'on-accent',
] as const

export const otherThemeTokens = ['font-display', 'font-body', 'tagline-style'] as const

export type ColorToken = (typeof colorTokens)[number]

export interface ContrastPair {
  foreground: ColorToken
  background: ColorToken
}

const readableText: ColorToken[] = ['text', 'text-strong', 'text-muted', 'accent']
const textBackgrounds: ColorToken[] = ['bg', 'bg-chrome', 'surface', 'surface-card', 'surface-callout']

// Pairs that must reach 4.5:1 in every theme (spec FR-4).
// text-faint is only checked against bg because it's only used on the page background.
export const contrastPairs: ContrastPair[] = [
  ...readableText.flatMap((foreground) => textBackgrounds.map((background) => ({ foreground, background }))),
  { foreground: 'text-faint', background: 'bg' },
  { foreground: 'on-accent', background: 'accent' },
]

export const minimumContrast = 4.5
