import type { BlockNode, RenderChildOptions } from '../../types'
import { typeColorMap } from '../../constants'
import { useDragContext } from '../canvas/DragContext'
import { PuzzleStrip } from './PuzzleStrip'
import { TypeBadge, BlockSlot } from '../ui'
import { ReferencePill } from './ReferencePill'
import { ValueSourceOutPort } from './ValueSourceOutPort'
import './FunctionCallBlock.css'

interface FunctionCallBlockProps {
  block: Extract<BlockNode, { kind: 'functionCall' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  inStatementBody?: boolean
  inEditorPanel?: boolean
}

export function FunctionCallBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
  inStatementBody = false,
  inEditorPanel = false,
}: FunctionCallBlockProps) {
  const ctx = useDragContext()
  const { functionName, returnType, arguments: args } = block.data
  const isActive = activeBlockId === block.id
  const isReject = ctx.rejectBlockId === block.id
  const isDragging = ctx.draggingBlockId === block.id

  if (compact) {
    const argLabels = args.map((a) => {
      if (a.value?.kind === 'variable') return a.value.data.name
      if (a.value?.kind === 'primitive') {
        const v = a.value.data.value
        return a.value.data.valueType === 'string' ? `"${v}"` : String(v)
      }
      return a.name
    })
    return (
      <span className="call-inline">
        {functionName}({argLabels.join(', ')})
      </span>
    )
  }

  return (
    <PuzzleStrip
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      typeColor={typeColorMap[returnType]}
      nested={inStatementBody}
      state={
        isReject ? 'reject' : isDragging ? 'dragging' : isActive ? 'active' : 'default'
      }
    >
      <div className={`function-call-block${inStatementBody ? ' function-call-block--nested' : ''}`}>
        <div className="function-call-block__header">
          <input
            type="text"
            className="function-call-block__name"
            value={functionName}
            onChange={(e) => ctx.updateFunctionCallName(block.id, e.target.value)}
            placeholder="function name"
          />
          <span className="function-call-block__arrow">→</span>
          <TypeBadge type={returnType} />
          {!inStatementBody && !inEditorPanel && (
            <ReferencePill
              block={block}
              onPointerDown={ctx.onReferenceDragStart(block.id)}
            />
          )}
          {!inStatementBody && inEditorPanel && (
            <ValueSourceOutPort
              block={block}
              onPointerDown={ctx.onReferenceDragStart(block.id)}
            />
          )}
        </div>
        {args.length > 0 && (
          <div className="function-call-block__args">
            {args.map((arg) => (
              <div key={arg.portId} className="function-call-block__arg">
                <span className="function-call-block__arg-label">{arg.name}:</span>
                <BlockSlot
                  slotTarget={{
                    kind: 'call-arg',
                    parentBlockId: block.id,
                    argPortId: arg.portId,
                  }}
                  expectedType={arg.type}
                  hint={`${arg.type}`}
                  filled={!!arg.value}
                >
                  {arg.value && renderChild
                    ? renderChild(arg.value, { slotFit: true, nestedView: true })
                    : null}
                </BlockSlot>
              </div>
            ))}
          </div>
        )}
      </div>
    </PuzzleStrip>
  )
}
