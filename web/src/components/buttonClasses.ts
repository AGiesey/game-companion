export type ButtonVariant = 'primary' | 'secondary'

const variants = {
  primary: 'bg-accent text-on-accent font-semibold',
  secondary: 'border border-border text-text',
}

// The button look, shared by Button and by elements that aren't buttons, such as a Link that should look like one.
// Kept out of Button.tsx so that file only exports a component (needed for fast refresh).
export function buttonClasses(variant: ButtonVariant = 'secondary'): string {
  return `rounded-md px-4 py-3 text-body transition-opacity hover:opacity-90 disabled:opacity-50 ${variants[variant]}`
}
