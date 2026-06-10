import type { BlockNode, ValueType } from '../../types'
import { typeColorMap } from '../../constants'
import { useDragContext } from '../canvas/DragContext'
import { PuzzleStrip } from './PuzzleStrip'
import { TypeSelect, TypeBadge } from '../ui'
import './PrimitiveBlock.css'

interface PrimitiveBlockProps {
  block: Extract<BlockNode, { kind: 'primitive' }>
  activeBlockId?: string
  compact?: boolean
}

function formatValue(value: string | number | boolean, type: ValueType): string {
  if (type === 'string') return String(value)
  if (type === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

export function PrimitiveBlock({
  block,
  activeBlockId,
  compact = false,
}: PrimitiveBlockProps) {
  const ctx = useDragContext()
  const { valueType, value } = block.data
  const isActive = activeBlockId === block.id
  const isReject = ctx.rejectBlockId === block.id
  const isDragging = ctx.draggingBlockId === block.id

  if (compact) {
    return (
      <span className="primitive-inline">
        <TypeBadge type={valueType} />
        <span className="primitive-inline__val">{formatValue(value, valueType)}</span>
      </span>
    )
  }

  return (
    <PuzzleStrip
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      typeColor={typeColorMap[valueType]}
      state={
        isReject ? 'reject' : isDragging ? 'dragging' : isActive ? 'active' : 'default'
      }
    >
      <TypeSelect
        value={valueType}
        onChange={(type) => ctx.updateBlockType(block.id, type)}
      />
      {valueType === 'boolean' ? (
        <div className="primitive-block__toggle">
          <button
            type="button"
            className={`primitive-block__toggle-opt${value === true ? ' primitive-block__toggle-opt--on' : ''}`}
            onClick={() => ctx.updateBlockValue(block.id, true)}
          >
            true
          </button>
          <button
            type="button"
            className={`primitive-block__toggle-opt${value === false ? ' primitive-block__toggle-opt--on' : ''}`}
            onClick={() => ctx.updateBlockValue(block.id, false)}
          >
            false
          </button>
        </div>
      ) : (
        <input
          type="text"
          className="primitive-block__input"
          value={formatValue(value, valueType)}
          onChange={(e) => {
            if (valueType === 'number') {
              const n = Number(e.target.value)
              ctx.updateBlockValue(block.id, Number.isNaN(n) ? 0 : n)
            } else {
              ctx.updateBlockValue(block.id, e.target.value)
            }
          }}
        />
      )}
    </PuzzleStrip>
  )
}
