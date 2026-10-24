import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BackIcon } from '../components/icons.tsx'

interface RunHeaderProps {
  title: string
  subtitle: string
  // The run screen's page heading is the run's name; the theme preview shows the header further down its page.
  titleAs?: 'h1' | 'h3'
  // The right-hand side, such as the run panel's menu button.
  actions?: ReactNode
}

// The bar across the top of a run (web/design/README.md, Run header): back to the run list, the run's name and
// a muted subtitle line.
export function RunHeader({ title, subtitle, titleAs: Title = 'h1', actions }: RunHeaderProps) {
  return (
    <div className="-mx-4 flex items-center gap-3 border-b border-border-subtle bg-bg-chrome px-4 py-4">
      <Link to="/runs" aria-label="Your runs" className="p-1 text-2xl text-text-muted">
        <BackIcon />
      </Link>
      <div className="min-w-0 flex-1">
        <Title className="truncate font-display text-2xl font-semibold text-accent">{title}</Title>
        <p className="truncate text-text-muted">{subtitle}</p>
      </div>
      {actions}
    </div>
  )
}
