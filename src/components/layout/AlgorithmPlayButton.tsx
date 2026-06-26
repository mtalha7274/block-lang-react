import { useEffect, useRef, useState } from 'react'
import type { AlgorithmDefinition } from '../../constants/algorithmCatalog'
import { Button } from '../ui'
import './AlgorithmPlayButton.css'

interface AlgorithmPlayButtonProps {
  algorithms: AlgorithmDefinition[]
  selectedId: string
  isPlaying: boolean
  statusMessage?: string | null
  onSelect: (id: string) => void
  onPlay: () => void
  onStop: () => void
}

export function AlgorithmPlayButton({
  algorithms,
  selectedId,
  isPlaying,
  statusMessage,
  onSelect,
  onPlay,
  onStop,
}: AlgorithmPlayButtonProps) {
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
    <div className="algo-play" ref={rootRef} data-testid="algorithm-play-control">
      <div className="algo-play__split">
        <Button
          variant="primary"
          size="md"
          className="algo-play__main"
          data-testid="toolbar-algorithm-play"
          disabled={isPlaying}
          onClick={() => {
            if (isPlaying) onStop()
            else onPlay()
          }}
          title={selected ? `Build: ${selected.name}` : 'Build algorithm'}
        >
          {isPlaying ? '■ Stop' : '▶ Play'}
        </Button>
        <button
          type="button"
          className="algo-play__menu-btn"
          data-testid="toolbar-algorithm-menu"
          aria-label="Choose algorithm"
          aria-expanded={menuOpen}
          disabled={isPlaying}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ▾
        </button>
      </div>

      {menuOpen && (
        <ul className="algo-play__menu" role="listbox" data-testid="algorithm-menu">
          {algorithms.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                role="option"
                aria-selected={entry.id === selectedId}
                className={`algo-play__option${entry.id === selectedId ? ' algo-play__option--active' : ''}`}
                data-testid={`algorithm-option-${entry.id}`}
                onClick={() => {
                  onSelect(entry.id)
                  setMenuOpen(false)
                }}
              >
                <span className="algo-play__option-name">{entry.name}</span>
                <span className="algo-play__option-desc">{entry.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {(isPlaying || statusMessage) && (
        <span className="algo-play__status" data-testid="algorithm-play-status">
          {statusMessage ?? (isPlaying ? 'Building…' : '')}
        </span>
      )}
    </div>
  )
}
