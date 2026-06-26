import type { BlockNode, RenderChildOptions, ConnectionEdge } from '../../types'
import { useDragContext } from '../canvas/DragContext'
import { deriveTypeParams } from '../../lib/program/typeParams'
import { BlockShell } from './BlockShell'
import { StatementBody } from './StatementBody'
import { CALL_IN_PORT } from '../../lib/program/callWire'
import { TypeSelect, TypeBadge, BlockSlot } from '../ui'
import './FunctionBlock.css'

interface FunctionBlockProps {
  block: Extract<BlockNode, { kind: 'function' }>
  renderChild?: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
  connections?: ConnectionEdge[]
}

export function FunctionBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
  connections = [],
}: FunctionBlockProps) {
  const ctx = useDragContext()
  const { name, returnType, signature, body } = block.data
  const state =
    activeBlockId === block.id ? 'active' : block.visual?.state ?? 'default'

  const derivedParams = signature ? deriveTypeParams(signature) : []
  const hasCallInWire = connections.some(
    (c) => c.purpose === 'wire' && c.to.blockId === block.id,
  )
  const slotTarget = {
    kind: 'function-signature' as const,
    parentBlockId: block.id,
  }

  if (compact) {
    const paramStr =
      derivedParams.length > 0
        ? derivedParams.map((p) => `${p.type} ${p.name}`).join(', ')
        : 'no params'
    return (
      <span className="function-inline">
        fn {name}({paramStr}) → {returnType}
      </span>
    )
  }

  return (
    <div className="function-block-wrap">
      {hasCallInWire && (
        <span
          className="usage-anchor usage-anchor--in"
          data-port-id={CALL_IN_PORT}
          aria-hidden
        />
      )}
      <BlockShell
        blockId={block.id}
        layoutOverride={block.visual?.layout}
        category="function"
        state={state}
        compact={compact}
        errorMessage={block.visual?.errorMessage}
        footer={
          <section className="function-block__panel function-block__panel--returns">
            <div className="function-block__returns-head">
              <span className="function-block__panel-head">RETURNS</span>
              <TypeSelect
                className="function-block__returns-type"
                value={returnType}
                includeVoid
                onChange={(type) => ctx.updateFunctionReturnType(block.id, type)}
              />
            </div>
          </section>
        }
      >
        <div className="function-block">
          <div className="function-block__hero">
            <input
              type="text"
              className="function-block__name"
              value={name}
              onChange={(e) => ctx.updateFunctionName(block.id, e.target.value)}
              placeholder="function name"
              aria-label="Function name"
            />
          </div>

          <section className="function-block__panel function-block__panel--input function-block__inputs">
            <span className="function-block__panel-head">INPUT</span>
            <BlockSlot
              slotTarget={slotTarget}
              hint="Drop a Type block (optional)"
              filled={!!signature}
            >
              {signature && renderChild
                ? renderChild(signature, { nestedView: true, slotFit: true })
                : null}
            </BlockSlot>
            {derivedParams.length > 0 && (
              <div className="function-block__params">
                {derivedParams.map((param) => (
                  <div key={param.id} className="function-block__param">
                    <TypeBadge type={param.type} />
                    <span className="function-block__param-name">{param.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="function-block__panel function-block__panel--body">
            <span className="function-block__panel-head">BODY</span>
            {renderChild ? (
              <StatementBody
                statements={body}
                region="function"
                parentBlockId={block.id}
                containerBlock={block}
                renderChild={renderChild}
                activeBlockId={activeBlockId}
                connections={connections}
              />
            ) : null}
          </section>
        </div>
      </BlockShell>
    </div>
  )
}
