import type { BlockNode, RenderChildOptions } from '../../types'
import { typeColorMap } from '../../constants'
import { useDragContext } from '../canvas/DragContext'
import { PuzzleStrip } from './PuzzleStrip'
import { TypeSelect, TypeBadge, BlockSlot, ScopePicker } from '../ui'
import { resolveScopeConsumerForStatementBody } from '../../lib/program/scope'
import { findBlockParent } from '../../lib/program/blockTree'
import { ValueSourceOutPort } from './ValueSourceOutPort'
import './VariableBlock.css'

interface VariableBlockProps {
  block: Extract<BlockNode, { kind: 'variable' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  inStatementBody?: boolean
  inEditorPanel?: boolean
}

export function VariableBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
  inStatementBody = false,
}: VariableBlockProps) {
  const ctx = useDragContext()
  const { valueType, name, value } = block.data
  const isActive = activeBlockId === block.id
  const isReject = ctx.rejectBlockId === block.id
  const isDragging = ctx.draggingBlockId === block.id

  const slotTarget = { kind: 'variable-value' as const, parentBlockId: block.id }
  const assignableScopeConsumerId = inStatementBody
    ? (() => {
        const parent = findBlockParent(ctx.getBlocks(), block.id)
        if (!parent || parent.target.kind !== 'statement-body') return block.id
        return resolveScopeConsumerForStatementBody(ctx.getBlocks(), parent.target)
      })()
    : block.id
  const assignableOptions = inStatementBody
    ? ctx.getAssignableScopeValues(assignableScopeConsumerId)
    : []

  if (compact) {
    return (
      <span className="variable-inline">
        <TypeBadge type={valueType} />
        <span className="variable-inline__name">{name}</span>
        {value && renderChild ? (
          <>
            <span className="variable-inline__eq">=</span>
            {renderChild(value, { compact: true })}
          </>
        ) : null}
      </span>
    )
  }

  const nested = inStatementBody

  return (
    <PuzzleStrip
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      typeColor={typeColorMap[valueType]}
      nested={nested}
      state={
        isReject ? 'reject' : isDragging ? 'dragging' : isActive ? 'active' : 'default'
      }
    >
      <div className={`variable-block__row${nested ? ' variable-block__row--nested' : ''}`}>
        <div className="variable-block__header">
          <TypeSelect
            value={valueType}
            onChange={(type) => ctx.updateBlockType(block.id, type)}
          />
          <input
            type="text"
            className="variable-block__name"
            value={name}
            onChange={(e) => ctx.updateVariableName(block.id, e.target.value)}
          />
          {inStatementBody && assignableOptions.length > 0 && (
            <ScopePicker
              options={assignableOptions}
              toggleLabel="Assign to…"
              onSelect={(sourceBlockId) => {
                const selected = assignableOptions.find((item) => item.blockId === sourceBlockId)
                if (selected) {
                  ctx.updateVariableName(block.id, selected.label)
                  ctx.updateBlockType(block.id, selected.valueType)
                }
              }}
            />
          )}
          {!inStatementBody && (
            <ValueSourceOutPort
              block={block}
              onPointerDown={ctx.onReferenceDragStart(block.id)}
            />
          )}
        </div>
        <div className="variable-block__value-row">
          <span className="variable-block__eq">=</span>
          <BlockSlot
            slotTarget={slotTarget}
            scopeConsumerId={block.id}
            expectedType={valueType}
            hint={`Drop a ${valueType} value here`}
            filled={!!value}
          >
            {value && renderChild
              ? renderChild(value, { slotFit: true, nestedView: true })
              : null}
          </BlockSlot>
        </div>
      </div>
    </PuzzleStrip>
  )
}
