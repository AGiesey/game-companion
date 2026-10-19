import { useEffect, useRef, useState } from 'react'

// After a failed submit, moves focus to the first field with an error, or to the form-level error (spec FR-17).
// The focus happens in an effect because the error element may only exist after the next render.
export function useFocusOnError<Target extends string>() {
  const elements = useRef(new Map<Target, HTMLElement | null>())
  const [request, setRequest] = useState<{ target: Target; id: number } | null>(null)

  useEffect(() => {
    if (request) elements.current.get(request.target)?.focus()
  }, [request])

  return {
    // Callback ref for each focusable target: <TextField ref={register('email')} />
    register: (target: Target) => (element: HTMLElement | null) => {
      elements.current.set(target, element)
    },
    // A new id each time, so asking for the same target twice still refocuses it.
    focus: (target: Target) => setRequest((previous) => ({ target, id: (previous?.id ?? 0) + 1 })),
  }
}

// The first field in form order that has an error, else the form-level error.
export function firstErrorTarget<Field extends string>(
  fieldOrder: readonly Field[],
  fieldErrors: Partial<Record<Field, string>>,
): Field | 'form' {
  return fieldOrder.find((field) => fieldErrors[field]) ?? 'form'
}
