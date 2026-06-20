import type { BlockNode, RenderChildOptions, ConnectionEdge, StatementBodyRegion } from '../../types'
import { ConnectionLayer } from '../canvas/ConnectionLayer'
import { BlockSlot } from '../ui'
import { CloseNestedEditorsButton } from './CloseNestedEditorsButton'
import './StatementBody.css'

interface StatementBodyProps {
  statements: BlockNode[]
  region: StatementBodyRegion
  parentBlockId: string
  containerBlock?: Extract<BlockNode, { kind: 'main' | 'function' }>
  renderChild: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  slotHint?: string
  connections?: ConnectionEdge[]
}

export function StatementBody({
  statements,
  region,
  parentBlockId,
  containerBlock,
  renderChild,
  activeBlockId,
  slotHint = 'Drop a Variable, Print, Return, Function Call, or control-flow block here',
  connections = [],
}: StatementBodyProps) {
  const slotTarget = {
    kind: 'statement-body' as const,
    parentBlockId,
    region,
  }

  const statementIds = new Set(statements.map((s) => s.id))
  const usageEdges = connections.filter(
    (c) =>
      c.purpose === 'usage' &&
      statementIds.has(c.from.blockId) &&
      statementIds.has(c.to.blockId),
  )
  const bodyEdges = usageEdges

  return (
    <div className="statement-body">
      {containerBlock && (
        <div className="statement-body__toolbar">
          <CloseNestedEditorsButton containerBlock={containerBlock} />
        </div>
      )}
      {statements.map((stmt, index) => (
        <div key={stmt.id} className="statement-body__row">
          <span className="statement-body__line">{index + 1}</span>
          <div className="statement-body__stmt">
            {renderChild(
              {
                ...stmt,
                visual: {
                  ...stmt.visual,
                  state:
                    activeBlockId === stmt.id
                      ? 'active'
                      : stmt.visual?.state ?? 'default',
                },
              },
              { inStatementBody: true, nestedView: true, statementIndex: index },
            )}
          </div>
        </div>
      ))}
      <div className="statement-body__row statement-body__row--append">
        <span className="statement-body__line" aria-hidden />
        <BlockSlot slotTarget={slotTarget} hint={slotHint} />
      </div>
      {bodyEdges.length > 0 && (
        <ConnectionLayer edges={bodyEdges} blockIds={statements.map((s) => s.id)} />
      )}
    </div>
  )
}
