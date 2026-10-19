import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

const variants = {
  primary: 'bg-accent text-on-accent font-semibold',
  secondary: 'border border-border text-text',
}

export function Button({ variant = 'secondary', type = 'button', className = '', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-md px-4 py-3 text-body transition-opacity hover:opacity-90 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
