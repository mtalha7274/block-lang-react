import type { BlockNode, RenderChildOptions, ValueType } from '../../types'
import { findEnclosingFunction } from '../../lib/program/enclosingFunction'
import { typeColorMap } from '../../constants'
import { useDragContext } from '../canvas/DragContext'
import { PuzzleStrip } from './PuzzleStrip'
import { BlockSlot } from '../ui'
import './ReturnBlock.css'

interface ReturnBlockProps {
  block: Extract<BlockNode, { kind: 'return' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  inStatementBody?: boolean
  inEditorPanel?: boolean
}

export function ReturnBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
  inStatementBody = false,
}: ReturnBlockProps) {
  const ctx = useDragContext()
  const { value } = block.data
  const isActive = activeBlockId === block.id
  const isReject = ctx.rejectBlockId === block.id
  const isDragging = ctx.draggingBlockId === block.id

  const fn = findEnclosingFunction(ctx.getBlocks(), block.id)
  const returnType: ValueType = fn?.data.returnType ?? 'void'
  const showValueSlot = returnType !== 'void'
  const slotTarget = { kind: 'return-value' as const, parentBlockId: block.id }
  const typeColor = showValueSlot ? typeColorMap[returnType] : 'var(--type-void)'

  if (compact) {
    return <span className="return-inline">return …</span>
  }

  return (
    <PuzzleStrip
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      typeColor={typeColor}
      nested={inStatementBody}
      state={
        isReject ? 'reject' : isDragging ? 'dragging' : isActive ? 'active' : 'default'
      }
    >
      <div className={`return-block${inStatementBody ? ' return-block--nested' : ''}`}>
        {showValueSlot ? (
          <BlockSlot
            slotTarget={slotTarget}
            scopeConsumerId={block.id}
            expectedType={returnType}
            hint={`Drop a ${returnType} value to return`}
            filled={!!value}
          >
            {value && renderChild
              ? renderChild(value, { slotFit: true, nestedView: true })
              : null}
          </BlockSlot>
        ) : null}
      </div>
    </PuzzleStrip>
  )
}
