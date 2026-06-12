import type { BlockNode, RenderChildOptions } from '../../types'
import { BlockShell } from './BlockShell'
import { StatementBody } from './StatementBody'
import { BlockSlot } from '../ui'
import './WhileLoopBlock.css'

interface WhileLoopBlockProps {
  block: Extract<BlockNode, { kind: 'while' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  inEditorPanel?: boolean
}

export function WhileLoopBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
}: WhileLoopBlockProps) {
  const { condition, body } = block.data
  const state =
    activeBlockId === block.id ? 'active' : block.visual?.state ?? 'default'

  return (
    <BlockShell
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      category="control"
      title="While Loop"
      subtitle="while (condition)"
      state={state}
      compact={compact}
      errorMessage={block.visual?.errorMessage}
    >
      <BlockSlot
        slotTarget={{ kind: 'while-condition', parentBlockId: block.id }}
        scopeConsumerId={block.id}
        label="Condition"
        expectedType="boolean"
        filled={!!condition}
        hint="Drop a boolean condition here"
      >
        {condition && renderChild
          ? renderChild(condition, { slotFit: true, nestedView: true })
          : null}
      </BlockSlot>
      <div className="while-loop__body">
        <span className="while-loop__body-label">BODY</span>
        {renderChild ? (
          <StatementBody
            statements={body}
            region="while"
            parentBlockId={block.id}
            renderChild={renderChild}
            activeBlockId={activeBlockId}
          />
        ) : null}
      </div>
    </BlockShell>
  )
}
