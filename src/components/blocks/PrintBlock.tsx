import type { BlockNode, RenderChildOptions } from '../../types'
import { useDragContext } from '../canvas/DragContext'
import { PuzzleStrip } from './PuzzleStrip'
import { BlockSlot } from '../ui'
import './PrintBlock.css'

interface PrintBlockProps {
  block: Extract<BlockNode, { kind: 'print' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  inStatementBody?: boolean
}

export function PrintBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
  inStatementBody = false,
}: PrintBlockProps) {
  const ctx = useDragContext()
  const { value } = block.data
  const isActive = activeBlockId === block.id
  const isReject = ctx.rejectBlockId === block.id
  const isDragging = ctx.draggingBlockId === block.id

  const slotTarget = { kind: 'print-value' as const, parentBlockId: block.id }

  if (compact) {
    return <span className="print-inline">print …</span>
  }

  return (
    <PuzzleStrip
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      typeColor="var(--type-string)"
      nested={inStatementBody}
      state={
        isReject ? 'reject' : isDragging ? 'dragging' : isActive ? 'active' : 'default'
      }
    >
      <div className={`print-block${inStatementBody ? ' print-block--nested' : ''}`}>
        <span className="print-block__label">PRINT</span>
        <BlockSlot
          slotTarget={slotTarget}
          scopeConsumerId={block.id}
          hint="Drop a value to print"
          filled={!!value}
        >
          {value && renderChild ? renderChild(value, { slotFit: true, nestedView: true }) : null}
        </BlockSlot>
      </div>
    </PuzzleStrip>
  )
}
