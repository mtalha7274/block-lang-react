import type { BlockNode } from '../../types'
import { typeColorMap } from '../../constants'
import { getLabelFromSource, getValueTypeFromSource } from '../../lib/program/scope'
import './ReferencePill.css'

interface ReferencePillProps {
  block: BlockNode
  onPointerDown: (e: React.PointerEvent) => void
}

export function ReferencePill({ block, onPointerDown }: ReferencePillProps) {
  const label = getLabelFromSource(block)
  const valueType = getValueTypeFromSource(block)
  if (!label || !valueType) return null

  const color = typeColorMap[valueType]

  return (
    <button
      type="button"
      className="reference-pill"
      style={{ '--pill-color': color } as React.CSSProperties}
      data-reference-source-id={block.id}
      title="Drag to use in another block"
      aria-label={`Drag ${label} to link in another block`}
      onPointerDown={(e) => {
        e.stopPropagation()
        onPointerDown(e)
      }}
    >
      <span className="reference-pill__grip" aria-hidden>
        ⠿
      </span>
      <span className="reference-pill__type">{valueType}</span>
      <span className="reference-pill__label">{label}</span>
    </button>
  )
}
