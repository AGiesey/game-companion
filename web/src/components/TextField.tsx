import { useId, type InputHTMLAttributes, type Ref } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  // React 19 passes ref as an ordinary prop; no forwardRef needed.
  ref?: Ref<HTMLInputElement>
}

// A labeled input with its error linked for assistive technology (aria-invalid, aria-describedby).
// The design has no error color, so the message text carries the meaning.
export function TextField({ label, error, id, className = '', ref, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="label-caps text-text-muted">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-md border border-border bg-bg px-4 py-3 aria-invalid:border-accent ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-label text-accent-bright">
          {error}
        </p>
      )}
    </div>
  )
}
