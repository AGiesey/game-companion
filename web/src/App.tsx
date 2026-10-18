import { useEffect, useState } from 'react'

interface PingResponse {
  message: string
  serverTime: string
}

type PingState =
  | { status: 'loading' }
  | { status: 'ok'; data: PingResponse }
  | { status: 'error'; error: string }

function App() {
  const [ping, setPing] = useState<PingState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/ping', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        setPing({ status: 'ok', data: (await response.json()) as PingResponse })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setPing({ status: 'error', error: err instanceof Error ? err.message : String(err) })
      })

    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>Game Companion</h1>
      {ping.status === 'loading' && <p>Pinging API…</p>}
      {ping.status === 'ok' && (
        <p>
          API says <strong>{ping.data.message}</strong> at {ping.data.serverTime}
        </p>
      )}
      {ping.status === 'error' && <p role="alert">API unreachable: {ping.error}</p>}
    </main>
  )
}

export default App
