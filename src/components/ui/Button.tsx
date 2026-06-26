import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { Variant, Size } from '../../types'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  active?: boolean
  children: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  active = false,
  disabled = false,
  children,
  onClick,
  title,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size}${active ? ' btn--active' : ''} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      title={title}
      {...rest}
    >
      {children}
    </button>
  )
}
