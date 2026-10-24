import { useLocation, useNavigate } from 'react-router'

// Render next to <App /> in a test: shows the current address and has a Back button, like the browser's.
export function RouterProbe() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="location">{pathname + search}</span>
      <button type="button" onClick={() => void navigate(-1)}>
        Browser back
      </button>
    </>
  )
}
