import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession, signOut } from '../api/account.ts'
import { endSession } from '../queryClient.ts'
import { sessionQueryKey } from './sessionQueryKey.ts'

export { sessionQueryKey }

// Who is signed in: data is a Session, or null for nobody. Fetched once; sign-in, create account,
// sign-out and 401 handling update it directly.
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => getSession({ signal }),
    staleTime: Infinity,
  })
}

// Signs out on the server, then forgets everything cached for the session, even if the server call failed.
export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signOut,
    onSettled: () => endSession(queryClient),
  })
}
