// A fake account server that runs in the browser, standing in for ASP.NET Core Identity until the developer
// builds it. Only web/src/api/account.ts may use this file. It throws the same ApiErrors a real backend would.
import { ApiError } from '../client.ts'
import { stub, type StubOptions } from '../stub.ts'

export interface StubSession {
  userId: string
  email: string
}

interface StubAccount {
  id: string
  email: string
  password: string
}

export const demoAccount = { email: 'vaela@example.com', password: 'stub-password' }
export const demoResetToken = 'stub-reset-token'

const accountsKey = 'game-companion.stub.accounts'
const sessionKey = 'game-companion.stub.session'
const minimumPasswordLength = 8

// Accounts live in localStorage. The session lives in localStorage when "keep me signed in" was chosen
// (like a persistent cookie) and in sessionStorage otherwise (like a session cookie).
type StorageKind = 'local' | 'session'

// Used when browser storage is unavailable or throws, so the stub still works for the page's lifetime.
const memory = new Map<string, string>()

function storageFor(kind: StorageKind): Storage {
  return kind === 'local' ? localStorage : sessionStorage
}

function readItem(kind: StorageKind, key: string): string | null {
  try {
    return storageFor(kind).getItem(key)
  } catch {
    return memory.get(`${kind}:${key}`) ?? null
  }
}

function writeItem(kind: StorageKind, key: string, value: string): void {
  try {
    storageFor(kind).setItem(key, value)
  } catch {
    memory.set(`${kind}:${key}`, value)
  }
}

function removeItem(kind: StorageKind, key: string): void {
  try {
    storageFor(kind).removeItem(key)
  } catch {
    // Fall through to the in-memory copy.
  }
  memory.delete(`${kind}:${key}`)
}

function parse<T>(json: string | null): T | null {
  if (json === null) return null
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

function loadAccounts(): StubAccount[] {
  return (
    parse<StubAccount[]>(readItem('local', accountsKey)) ?? [
      { id: 'stub-user-vaela', email: demoAccount.email, password: demoAccount.password },
    ]
  )
}

function saveAccounts(accounts: StubAccount[]): void {
  writeItem('local', accountsKey, JSON.stringify(accounts))
}

function findAccount(accounts: StubAccount[], email: string): StubAccount | undefined {
  const wanted = email.trim().toLowerCase()
  return accounts.find((account) => account.email.toLowerCase() === wanted)
}

function startSession(account: StubAccount, remember: boolean): StubSession {
  const session: StubSession = { userId: account.id, email: account.email }
  removeItem('local', sessionKey)
  removeItem('session', sessionKey)
  writeItem(remember ? 'local' : 'session', sessionKey, JSON.stringify(session))
  return session
}

function validationError(errors: Record<string, string[]>): ApiError {
  const title = 'One or more validation errors occurred.'
  return new ApiError(400, title, { title, status: 400, errors })
}

function passwordErrors(password: string): string[] {
  return password.length < minimumPasswordLength
    ? [`Passwords must be at least ${minimumPasswordLength} characters.`]
    : []
}

// Each operation waits like a real request first, so a cancelled call has no effect.

export async function getSession(options?: StubOptions): Promise<StubSession | null> {
  await stub(undefined, options)
  return parse<StubSession>(readItem('local', sessionKey)) ?? parse<StubSession>(readItem('session', sessionKey))
}

export async function signIn(
  { email, password, remember }: { email: string; password: string; remember: boolean },
  options?: StubOptions,
): Promise<StubSession> {
  await stub(undefined, options)
  const account = findAccount(loadAccounts(), email)
  if (!account || account.password !== password) {
    throw new ApiError(401, 'Unauthorized', { title: 'Unauthorized', status: 401 })
  }
  return startSession(account, remember)
}

export async function signOut(options?: StubOptions): Promise<void> {
  await stub(undefined, options)
  removeItem('local', sessionKey)
  removeItem('session', sessionKey)
}

export async function createAccount(
  { email, password }: { email: string; password: string },
  options?: StubOptions,
): Promise<StubSession> {
  await stub(undefined, options)
  const accounts = loadAccounts()
  const errors: Record<string, string[]> = {}
  if (findAccount(accounts, email)) errors.Email = [`Email '${email.trim()}' is already taken.`]
  const passwordProblems = passwordErrors(password)
  if (passwordProblems.length > 0) errors.Password = passwordProblems
  if (Object.keys(errors).length > 0) throw validationError(errors)

  const account: StubAccount = { id: `stub-user-${crypto.randomUUID()}`, email: email.trim(), password }
  saveAccounts([...accounts, account])
  // New accounts stay signed in, matching the default of the sign-in screen's checkbox.
  return startSession(account, true)
}

// Always succeeds, whether or not the account exists, so the response doesn't reveal which emails have accounts.
export async function requestPasswordReset(_request: { email: string }, options?: StubOptions): Promise<void> {
  await stub(undefined, options)
}

export async function resetPassword(
  { email, token, newPassword }: { email: string; token: string; newPassword: string },
  options?: StubOptions,
): Promise<void> {
  await stub(undefined, options)
  const accounts = loadAccounts()
  const account = findAccount(accounts, email)
  if (!account || token !== demoResetToken) {
    const title = 'Invalid or expired reset link'
    throw new ApiError(400, title, { title, status: 400 })
  }
  const passwordProblems = passwordErrors(newPassword)
  if (passwordProblems.length > 0) throw validationError({ Password: passwordProblems })

  account.password = newPassword
  saveAccounts(accounts)
}

// Tests only: forget anything kept in memory because storage was unavailable.
export function resetAccountStubMemory(): void {
  memory.clear()
}
