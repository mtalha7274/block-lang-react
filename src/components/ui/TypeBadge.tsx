import type { ValueType } from '../../types'
import './TypeBadge.css'

interface TypeBadgeProps {
  type: ValueType
  className?: string
}

export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  return (
    <span className={`type-badge type-badge--${type} ${className}`.trim()}>
      {type}
    </span>
  )
}
