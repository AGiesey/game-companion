import type { ReactNode } from 'react'
import { CornerBrackets } from '../components/ornaments/CornerBrackets.tsx'
import { DiamondRule } from '../components/ornaments/DiamondRule.tsx'
import { Emblem } from '../components/ornaments/Emblem.tsx'

interface AccountLayoutProps {
  // Only the sign-in screen has one ("Your journey continues").
  eyebrow?: string
  cardTitle: string
  children: ReactNode
  // Below the card, for example "New here? Begin a new journey".
  footer?: ReactNode
  // False when embedded in another page (the theme preview) rather than filling the screen.
  fullPage?: boolean
}

// The title-screen layout shared by every account screen (web/design/general-sign-in-title-screen.png).
export function AccountLayout({ eyebrow, cardTitle, children, footer, fullPage = true }: AccountLayoutProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-radial from-surface-card to-bg px-4 py-10 text-center ${fullPage ? 'min-h-screen' : '-mx-4'}`}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Emblem className="size-24" />
        {eyebrow && <p className="label-caps tracking-[0.3em] text-text-muted">{eyebrow}</p>}
        <h1 className="font-display text-4xl font-semibold text-text-strong">Game Companion</h1>
        <DiamondRule className="w-2/3" />
        <p className="tagline text-xl text-text-muted">A friend who’s played it, along for your run.</p>

        <div className="relative mt-4 flex w-full flex-col gap-5 border border-border-accent bg-surface-card p-6 text-left">
          <CornerBrackets />
          <h2 className="text-center font-display text-2xl font-semibold text-text-strong">{cardTitle}</h2>
          {children}
        </div>

        {footer && <div className="text-text-muted">{footer}</div>}
      </div>
    </div>
  )
}
