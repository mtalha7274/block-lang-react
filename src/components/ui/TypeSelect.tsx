import type { ValueType } from '../../types'
import './TypeSelect.css'

const VALUE_TYPES: ValueType[] = ['number', 'string', 'boolean']

interface TypeSelectProps {
  value: ValueType
  onChange?: (type: ValueType) => void
  disabled?: boolean
  includeVoid?: boolean
  className?: string
}

export function TypeSelect({
  value,
  onChange,
  disabled = false,
  includeVoid = false,
  className = '',
}: TypeSelectProps) {
  const types = includeVoid ? [...VALUE_TYPES, 'void' as const] : VALUE_TYPES

  return (
    <select
      className={`type-select type-select--${value} ${className}`.trim()}
      value={value}
      disabled={disabled || !onChange}
      onChange={(e) => onChange?.(e.target.value as ValueType)}
      aria-label="Type"
    >
      {types.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  )
}
