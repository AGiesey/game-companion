import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonVariant } from './buttonClasses.ts'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'secondary', type = 'button', className = '', ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClasses(variant)} ${className}`} {...props} />
}
