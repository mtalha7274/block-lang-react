import type { BlockNode, OperatorSymbol, RenderChildOptions } from '../../types'
import { operators } from '../../constants'
import {
  canExpressionOperandAcceptBlock,
  getExpressionOperandType,
} from '../../lib/validation/typeChecker'
import { useDragContext } from '../canvas/DragContext'
import { BlockShell } from './BlockShell'
import { ValueSourceOutPort } from './ValueSourceOutPort'
import { TypeBadge, BlockSlot, SelectField } from '../ui'
import './ExpressionBlock.css'

interface ExpressionBlockProps {
  block: Extract<BlockNode, { kind: 'expression' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  inStatementBody?: boolean
  inEditorPanel?: boolean
}

export function ExpressionBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
  inStatementBody = false,
  inEditorPanel = false,
}: ExpressionBlockProps) {
  const slotChildOpts = { slotFit: true, nestedView: !inEditorPanel } as const
  const ctx = useDragContext()
  const { resultName, resultType, operator, left, right } = block.data
  const leftInvalid = left != null && !canExpressionOperandAcceptBlock(block, left)
  const rightInvalid = right != null && !canExpressionOperandAcceptBlock(block, right)
  const hasOperandError = leftInvalid || rightInvalid
  const state =
    activeBlockId === block.id
      ? 'active'
      : hasOperandError
        ? 'error'
        : block.visual?.state ?? 'default'
  const errorMessage = hasOperandError
    ? 'Operand type does not match operator'
    : block.visual?.errorMessage
  const operatorOptions = operators.map((op) => ({
    value: op.symbol,
    label: op.symbol,
  }))
  const operandType = getExpressionOperandType(operator)
  const leftSlotTarget = {
    kind: 'expression-operand' as const,
    parentBlockId: block.id,
    side: 'left' as const,
  }
  const rightSlotTarget = {
    kind: 'expression-operand' as const,
    parentBlockId: block.id,
    side: 'right' as const,
  }
  const showOutPort = !inStatementBody

  return (
    <BlockShell
      blockId={compact ? undefined : block.id}
      layoutOverride={block.visual?.layout}
      category="variable"
      title="Expression"
      state={state}
      compact={compact}
      errorMessage={errorMessage}
    >
      <div
        className={`expression-block__row${inStatementBody ? ' expression-block__row--nested' : ''}`}
      >
        <input
          type="text"
          className="expression-block__name"
          value={resultName}
          placeholder="name"
          onChange={(e) => ctx.updateExpressionResultName(block.id, e.target.value)}
        />
        <span className="expression-block__eq">=</span>
        <BlockSlot
          slotTarget={leftSlotTarget}
          scopeConsumerId={block.id}
          filled={!!left}
          invalid={leftInvalid}
          expectedType={operandType}
          hint={`Drop a ${operandType} value here`}
        >
          {left && renderChild ? renderChild(left, slotChildOpts) : null}
        </BlockSlot>
        <SelectField
          value={operator}
          options={operatorOptions}
          onChange={(op) =>
            ctx.updateExpressionOperator(block.id, op as OperatorSymbol)
          }
        />
        <BlockSlot
          slotTarget={rightSlotTarget}
          scopeConsumerId={block.id}
          filled={!!right}
          invalid={rightInvalid}
          expectedType={operandType}
          hint={`Drop a ${operandType} value here`}
        >
          {right && renderChild ? renderChild(right, slotChildOpts) : null}
        </BlockSlot>
        <TypeBadge type={resultType} />
        {showOutPort && (
          <ValueSourceOutPort
            block={block}
            onPointerDown={ctx.onReferenceDragStart(block.id)}
          />
        )}
      </div>
    </BlockShell>
  )
}
