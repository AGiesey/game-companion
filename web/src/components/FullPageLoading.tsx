// Shown while the app checks who is signed in, so neither sign-in nor protected content flashes.
export function FullPageLoading() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center text-text-muted">
      Loading…
    </div>
  )
}
