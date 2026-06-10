import type { BlockNode, RenderChildOptions } from '../../types'
import { BlockShell } from './BlockShell'
import { StatementBody } from './StatementBody'
import { BlockSlot } from '../ui'
import './ForLoopBlock.css'

interface ForLoopBlockProps {
  block: Extract<BlockNode, { kind: 'for' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
}

export function ForLoopBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
}: ForLoopBlockProps) {
  const { init, condition, increment, body } = block.data
  const state =
    activeBlockId === block.id ? 'active' : block.visual?.state ?? 'default'

  return (
    <BlockShell
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      category="control"
      title="For Loop"
      subtitle="for (init; condition; increment)"
      state={state}
      compact={compact}
      errorMessage={block.visual?.errorMessage}
    >
      <div className="for-loop__sections">
        <BlockSlot
          slotTarget={{ kind: 'for-init', parentBlockId: block.id }}
          scopeConsumerId={block.id}
          label="Init"
          expectedType="number"
          filled={!!init}
          hint="Drop a number value for loop init"
        >
          {init && renderChild ? renderChild(init, { slotFit: true, nestedView: false }) : null}
        </BlockSlot>
        <BlockSlot
          slotTarget={{ kind: 'for-condition', parentBlockId: block.id }}
          scopeConsumerId={block.id}
          label="Condition"
          expectedType="boolean"
          filled={!!condition}
          hint="Drop a boolean condition here"
        >
          {condition && renderChild
            ? renderChild(condition, { slotFit: true, nestedView: false })
            : null}
        </BlockSlot>
        <BlockSlot
          slotTarget={{ kind: 'for-increment', parentBlockId: block.id }}
          scopeConsumerId={block.id}
          label="Increment"
          expectedType="number"
          filled={!!increment}
          hint="Drop a number value for loop increment"
        >
          {increment && renderChild
            ? renderChild(increment, { slotFit: true, nestedView: false })
            : null}
        </BlockSlot>
        <div className="for-loop__body">
          <span className="for-loop__body-label">BODY</span>
          {renderChild ? (
            <StatementBody
              statements={body}
              region="for"
              parentBlockId={block.id}
              renderChild={renderChild}
              activeBlockId={activeBlockId}
            />
          ) : null}
        </div>
      </div>
    </BlockShell>
  )
}
