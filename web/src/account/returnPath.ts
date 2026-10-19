// Where to send the player after signing in. Only same-app paths are allowed, so a crafted
// /sign-in?returnTo=… link can't send them to another site.

const signedOutOnlyPaths = ['/sign-in', '/create-account']

export function signInPath({ pathname, search }: { pathname: string; search: string }): string {
  const target = pathname + search
  return target === '/' ? '/sign-in' : `/sign-in?returnTo=${encodeURIComponent(target)}`
}

export function safeReturnPath(value: string | null | undefined): string | null {
  // "//host" and "/\host" are treated by browsers as links to another host.
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null

  let url: URL
  try {
    url = new URL(value, window.location.origin)
  } catch {
    return null
  }
  // Catches anything the prefix checks missed, such as tabs or newlines that URL parsing strips out.
  if (url.origin !== window.location.origin) return null
  // Returning to sign-in after signing in would loop.
  if (signedOutOnlyPaths.includes(url.pathname)) return null

  return url.pathname + url.search + url.hash
}
