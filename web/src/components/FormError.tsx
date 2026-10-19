import type { Ref } from 'react'

// A problem with the whole form rather than one field. Announced when it appears, and focusable so a
// failed submit can move focus to it.
export function FormError({ message, ref }: { message: string; ref?: Ref<HTMLParagraphElement> }) {
  return (
    <p ref={ref} role="alert" tabIndex={-1} className="rounded-md border border-border-accent bg-bg px-4 py-3 text-text">
      {message}
    </p>
  )
}
