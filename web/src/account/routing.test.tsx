import { screen } from '@testing-library/react'
import { useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { setStubDelays } from '../api/stub.ts'
import { demoAccount, signIn } from '../api/stubs/accountStub.ts'
import { renderWithProviders } from '../test/render.tsx'

// Shows the router's current address so tests can check where a redirect went.
function LocationProbe() {
  const { pathname, search } = useLocation()
  return <span data-testid="location">{pathname + search}</span>
}

function renderApp(route: string) {
  return renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { route },
  )
}

const currentLocation = () => screen.getByTestId('location').textContent

async function signInDemo() {
  await signIn({ email: demoAccount.email, password: demoAccount.password, remember: true })
}

afterEach(() => {
  setStubDelays({ valueMs: 0 })
})

describe('protected routes', () => {
  it('sends a signed-out player from home to sign-in without a return path', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/sign-in')
  })

  it('shows home to a signed-in player', async () => {
    await signInDemo()
    renderApp('/')

    expect(await screen.findByText(`Signed in as ${demoAccount.email}`)).toBeInTheDocument()
  })

  it('shows a loading state, not sign-in, while checking the session', async () => {
    setStubDelays({ valueMs: 50 })
    renderApp('/')

    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})

describe('signed-out-only routes', () => {
  it('sends a signed-in player from sign-in to home', async () => {
    await signInDemo()
    renderApp('/sign-in')

    expect(await screen.findByText(`Signed in as ${demoAccount.email}`)).toBeInTheDocument()
    expect(currentLocation()).toBe('/')
  })

  it('sends a signed-in player to a safe return path', async () => {
    await signInDemo()
    renderApp('/sign-in?returnTo=%2Fno-such-page%3Fx%3D1')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/no-such-page?x=1')
  })

  it('ignores a return path to another site', async () => {
    await signInDemo()
    renderApp('/sign-in?returnTo=%2F%2Fevil.example')

    expect(await screen.findByText(`Signed in as ${demoAccount.email}`)).toBeInTheDocument()
    expect(currentLocation()).toBe('/')
  })
})
