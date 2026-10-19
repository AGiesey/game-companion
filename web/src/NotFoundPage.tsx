import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold text-text-strong">Page not found</h1>
      <p className="text-text-muted">There’s nothing at this address.</p>
      <Link to="/" className="text-accent-bright underline">
        Go home
      </Link>
    </div>
  )
}
