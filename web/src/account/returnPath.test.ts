import { describe, expect, it } from 'vitest'
import { safeReturnPath, signInPath } from './returnPath.ts'

describe('signInPath', () => {
  it('leaves out returnTo for the home page', () => {
    expect(signInPath({ pathname: '/', search: '' })).toBe('/sign-in')
  })

  it('remembers the path and query string', () => {
    expect(signInPath({ pathname: '/runs/42', search: '?tab=journal' })).toBe('/sign-in?returnTo=%2Fruns%2F42%3Ftab%3Djournal')
  })
})

describe('safeReturnPath', () => {
  it('accepts same-app paths with query and hash', () => {
    expect(safeReturnPath('/runs/42?tab=journal#latest')).toBe('/runs/42?tab=journal#latest')
  })

  it.each([
    ['nothing', null],
    ['an empty string', ''],
    ['a relative path', 'runs/42'],
    ['a protocol-relative URL', '//evil.example/steal'],
    ['a backslash host', '/\\evil.example'],
    ['an absolute URL', 'https://evil.example/'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a tab hiding a second slash', '/\t/evil.example'],
    ['the sign-in page', '/sign-in?returnTo=%2F'],
    ['the create-account page', '/create-account'],
  ])('rejects %s', (_label, value) => {
    expect(safeReturnPath(value)).toBeNull()
  })
})
