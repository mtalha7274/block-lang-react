import type { BlockNode, RenderChildOptions, ConnectionEdge } from '../../types'
import { BlockShell } from './BlockShell'
import { StatementBody } from './StatementBody'
import { BlockSlot } from '../ui'
import './IfBlock.css'

interface IfBlockProps {
  block: Extract<BlockNode, { kind: 'if' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  connections?: ConnectionEdge[]
}

export function IfBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
  connections = [],
}: IfBlockProps) {
  const { condition, trueBranch, falseBranch } = block.data
  const state =
    activeBlockId === block.id ? 'active' : block.visual?.state ?? 'default'

  const conditionSlot = {
    kind: 'if-condition' as const,
    parentBlockId: block.id,
  }

  return (
    <BlockShell
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      category="control"
      title="If / Else"
      state={state}
      compact={compact}
      errorMessage={block.visual?.errorMessage}
    >
      <BlockSlot
        slotTarget={conditionSlot}
        scopeConsumerId={block.id}
        label="IF condition"
        expectedType="boolean"
        filled={!!condition}
      >
        {condition && renderChild ? renderChild(condition, { slotFit: true, nestedView: true }) : null}
      </BlockSlot>
      <div className="if-block__branches">
        <div className="if-block__branch if-block__branch--true">
          <span className="if-block__branch-label">TRUE</span>
          {renderChild ? (
            <StatementBody
              statements={trueBranch}
              region="if-true"
              parentBlockId={block.id}
              renderChild={renderChild}
              activeBlockId={activeBlockId}
              connections={connections}
            />
          ) : null}
        </div>
        <div className="if-block__branch if-block__branch--false">
          <span className="if-block__branch-label">ELSE</span>
          {renderChild ? (
            <StatementBody
              statements={falseBranch ?? []}
              region="if-false"
              parentBlockId={block.id}
              renderChild={renderChild}
              activeBlockId={activeBlockId}
              connections={connections}
            />
          ) : null}
        </div>
      </div>
    </BlockShell>
  )
}
