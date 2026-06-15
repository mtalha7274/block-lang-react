import { useState, useRef, useEffect } from 'react'
import type { ValueType } from '../../types'
import type { InScopeValue } from '../../lib/program/scope'
import { TypeBadge } from './TypeBadge'
import './ScopePicker.css'

interface ScopePickerProps {
  options: InScopeValue[]
  expectedType?: ValueType
  onSelect: (sourceBlockId: string) => void
}

export function ScopePicker({ options, expectedType, onSelect }: ScopePickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = expectedType
    ? options.filter((o) => o.valueType === expectedType)
    : options

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (filtered.length === 0) return null

  return (
    <div className="scope-picker" ref={rootRef}>
      <button
        type="button"
        className="scope-picker__toggle"
        onClick={() => setOpen((v) => !v)}
      >
        Use existing…
      </button>
      {open && (
        <ul className="scope-picker__menu" role="listbox">
          {filtered.map((item) => (
            <li key={item.blockId}>
              <button
                type="button"
                className="scope-picker__item"
                role="option"
                onClick={() => {
                  onSelect(item.blockId)
                  setOpen(false)
                }}
              >
                <TypeBadge type={item.valueType} />
                <span className="scope-picker__label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
