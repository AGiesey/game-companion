import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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

// Pressing Back can restore an earlier page load from the browser's back/forward cache, React state and all,
// so a page from before signing out would still show signed-in content. On such a restore, forget the cached
// session and check again (showing the loading state meanwhile).
export function useRecheckSessionOnRestore() {
  const queryClient = useQueryClient()
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) void queryClient.resetQueries({ queryKey: sessionQueryKey })
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [queryClient])
}

// Signs out on the server, then forgets everything cached for the session, even if the server call failed.
export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signOut,
    onSettled: () => endSession(queryClient),
  })
}
