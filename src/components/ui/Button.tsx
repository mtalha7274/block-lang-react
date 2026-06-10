import type { Variant, Size } from '../../types'
import './Button.css'

interface ButtonProps {
  variant?: Variant
  size?: Size
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  title?: string
  className?: string
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
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size}${active ? ' btn--active' : ''} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}
