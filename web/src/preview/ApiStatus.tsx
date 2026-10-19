import { useQuery } from '@tanstack/react-query'
import { getPing } from '../api/ping.ts'

// One line showing whether the API answers. Keeps the src/api pattern exercised on the preview page.
export function ApiStatus() {
  const ping = useQuery({
    queryKey: ['ping'],
    queryFn: ({ signal }) => getPing({ signal }),
  })

  return (
    <footer className="text-label text-text-muted">
      {ping.isPending && <p>Pinging API…</p>}
      {ping.isSuccess && (
        <p>
          API says <strong>{ping.data.message}</strong> at {ping.data.serverTime}
        </p>
      )}
      {ping.isError && <p role="alert">API unreachable: {ping.error.message}</p>}
    </footer>
  )
}
