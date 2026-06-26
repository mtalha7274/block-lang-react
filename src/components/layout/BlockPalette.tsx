import { learningStages, blockRegistry, categoryStripeMap } from '../../constants'
import type { BlockKind } from '../../types'
import './BlockPalette.css'

interface BlockPaletteProps {
  onDragStart: (kind: BlockKind) => (e: React.DragEvent) => void
  onDragEnd?: () => void
}

export function BlockPalette({ onDragStart, onDragEnd }: BlockPaletteProps) {
  return (
    <nav className="palette" aria-label="Block palette">
      <p className="palette__tip">
        Drag blocks into slots inside Main or open blocks — not onto empty canvas.
      </p>
      <div className="palette__sections">
        {learningStages.map((stage) => (
          <section key={stage.id} className="palette__section">
            <h3 className="palette__stage">{stage.label}</h3>
            <ul className="palette__list">
              {stage.blockKinds.map((kind) => {
                const entry = blockRegistry[kind]
                const stripe = categoryStripeMap[entry.category]
                return (
                  <li key={kind}>
                    <button
                      type="button"
                      className="palette__chip"
                      data-palette-kind={kind}
                      draggable
                      onDragStart={onDragStart(kind)}
                      onDragEnd={onDragEnd}
                      style={{ '--chip-color': stripe } as React.CSSProperties}
                    >
                      <span className="palette__chip-dot" />
                      <span className="palette__chip-label">{entry.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
