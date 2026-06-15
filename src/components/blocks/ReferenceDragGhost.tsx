import type { BlockNode } from '../../types'
import { typeColorMap } from '../../constants'
import { getLabelFromSource, getValueTypeFromSource } from '../../lib/program/scope'
import './ReferenceDragGhost.css'

interface ReferenceDragGhostProps {
  block: BlockNode
  x: number
  y: number
}

function chipLabel(block: BlockNode): string {
  return getLabelFromSource(block) ?? block.kind
}

export function ReferenceDragGhost({ block, x, y }: ReferenceDragGhostProps) {
  const valueType = getValueTypeFromSource(block)
  const color = valueType ? typeColorMap[valueType] : typeColorMap.void

  return (
    <div
      className="reference-drag-ghost"
      style={{
        left: x,
        top: y,
        '--chip-color': color,
      } as React.CSSProperties}
      aria-hidden
    >
      {valueType && <span className="reference-drag-ghost__type">{valueType}</span>}
      <span className="reference-drag-ghost__label">{chipLabel(block)}</span>
    </div>
  )
}
