import { useQuery } from '@tanstack/react-query'
import { getPing } from './api/ping.ts'

function App() {
  const ping = useQuery({
    queryKey: ['ping'],
    queryFn: ({ signal }) => getPing({ signal }),
  })

  return (
    <main className="p-4">
      <h1>Game Companion</h1>
      {ping.isPending && <p>Pinging API…</p>}
      {ping.isSuccess && (
        <p>
          API says <strong>{ping.data.message}</strong> at {ping.data.serverTime}
        </p>
      )}
      {ping.isError && <p role="alert">API unreachable: {ping.error.message}</p>}
    </main>
  )
}

export default App
