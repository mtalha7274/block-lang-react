import type { BlockNode } from '../../types'
import { useDragContext } from '../canvas/DragContext'
import { BlockShell } from './BlockShell'
import { TypeSelect, TypeBadge, BlockSlot } from '../ui'
import { formatTypeSummary } from '../../lib/program/typeParams'
import './TypeBlock.css'

interface TypeBlockProps {
  block: Extract<BlockNode, { kind: 'type' }>
  renderChild?: (node: BlockNode, opts?: { compact?: boolean }) => React.ReactNode
  activeBlockId?: string
  compact?: boolean
}

export function TypeBlock({
  block,
  renderChild,
  activeBlockId,
  compact = false,
}: TypeBlockProps) {
  const ctx = useDragContext()
  const { rows, variables } = block.data
  const state =
    activeBlockId === block.id ? 'active' : block.visual?.state ?? 'default'

  const slotTarget = { kind: 'type-variable' as const, parentBlockId: block.id }

  if (compact) {
    return (
      <span className="type-inline">
        <span className="type-inline__label">Type</span>
        <span className="type-inline__summary">{formatTypeSummary(block)}</span>
      </span>
    )
  }

  return (
    <BlockShell
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      category="variable"
      title="Type"
      state={state}
      compact={compact}
      errorMessage={block.visual?.errorMessage}
    >
      <div className="type-block__rows">
        {rows.map((row) => (
          <div key={row.id} className="type-block__row">
            <TypeSelect
              value={row.type}
              onChange={(type) =>
                ctx.updateTypeParamRow(block.id, row.id, { type })
              }
            />
            <input
              type="text"
              className="type-block__name"
              value={row.name}
              onChange={(e) =>
                ctx.updateTypeParamRow(block.id, row.id, { name: e.target.value })
              }
            />
            <button
              type="button"
              className="type-block__remove"
              disabled={rows.length <= 1}
              onClick={() => ctx.removeTypeParamRow(block.id, row.id)}
              aria-label="Remove param"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="type-block__add"
          onClick={() => ctx.addTypeParamRow(block.id)}
        >
          + Add param
        </button>
      </div>

      {variables.length > 0 && (
        <div className="type-block__dropped">
          <span className="type-block__section-label">From variables</span>
          <div className="type-block__var-list">
            {variables.map((v) => (
              <div key={v.id} className="type-block__var-chip">
                {v.kind === 'variable' ? (
                  <>
                    <TypeBadge type={v.data.valueType} />
                    <span>{v.data.name}</span>
                  </>
                ) : (
                  renderChild?.(v, { compact: true })
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <BlockSlot
        slotTarget={slotTarget}
        hint="Drop Variable blocks here"
        filled={false}
      />
    </BlockShell>
  )
}
