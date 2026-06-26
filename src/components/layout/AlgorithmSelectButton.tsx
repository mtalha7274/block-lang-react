import { useEffect, useRef, useState } from 'react'
import type { AlgorithmDefinition } from '../../constants/algorithmCatalog'
import './AlgorithmSelectButton.css'

interface AlgorithmSelectButtonProps {
  algorithms: AlgorithmDefinition[]
  selectedId: string
  disabled?: boolean
  onSelect: (id: string) => void
}

export function AlgorithmSelectButton({
  algorithms,
  selectedId,
  disabled = false,
  onSelect,
}: AlgorithmSelectButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = algorithms.find((entry) => entry.id === selectedId) ?? algorithms[0]

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  return (
    <div className="algo-select" ref={rootRef} data-testid="algorithm-select-control">
      <button
        type="button"
        className="algo-select__btn"
        data-testid="toolbar-algorithm-select"
        aria-label="Choose algorithm"
        aria-expanded={menuOpen}
        disabled={disabled}
        onClick={() => setMenuOpen((open) => !open)}
        title={selected ? selected.name : 'Choose algorithm'}
      >
        <span className="algo-select__label">{selected?.name ?? 'Algorithm'}</span>
        <span className="algo-select__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {menuOpen && (
        <ul className="algo-select__menu" role="listbox" data-testid="algorithm-menu">
          {algorithms.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                role="option"
                aria-selected={entry.id === selectedId}
                className={`algo-select__option${entry.id === selectedId ? ' algo-select__option--active' : ''}`}
                data-testid={`algorithm-option-${entry.id}`}
                onClick={() => {
                  onSelect(entry.id)
                  setMenuOpen(false)
                }}
              >
                <span className="algo-select__option-name">{entry.name}</span>
                <span className="algo-select__option-desc">{entry.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
