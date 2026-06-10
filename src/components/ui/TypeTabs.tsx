import type { ValueType } from '../../types'
import './TypeTabs.css'

const TYPES: ValueType[] = ['number', 'string', 'boolean']

interface TypeTabsProps {
  value: ValueType
  onChange?: (type: ValueType) => void
  disabled?: boolean
}

export function TypeTabs({ value, onChange, disabled = false }: TypeTabsProps) {
  return (
    <div className="type-tabs" role="tablist" aria-label="Type">
      {TYPES.map((type) => (
        <button
          key={type}
          type="button"
          role="tab"
          aria-selected={value === type}
          className={`type-tabs__tab type-tabs__tab--${type}${value === type ? ' type-tabs__tab--active' : ''}`}
          disabled={disabled || !onChange}
          onClick={() => onChange?.(type)}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
