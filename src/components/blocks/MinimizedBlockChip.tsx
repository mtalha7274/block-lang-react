import type { BlockNode, ValueType } from '../../types'
import { getMiniBlockView } from '../../lib/program/blockContract'
import { getLabelFromSource, isValueSourceBlock } from '../../lib/program/scope'
import './MinimizedBlockChip.css'

interface MinimizedBlockChipProps {
  block: BlockNode
  onOpenEditor: (anchorEl: HTMLElement) => void
  onRemove: () => void
  onReferenceDragStart?: (e: React.PointerEvent) => void
  onChipPointerDown?: (
    e: React.PointerEvent,
    anchorEl: HTMLElement,
  ) => void
  onCallOutOpen?: () => void
  isSelected?: boolean
  usageOutPort?: boolean
  usageInPortId?: string
  callOutPort?: boolean
}

function chipLabel(block: BlockNode): string {
  return getMiniBlockView(block).label
}

function chipColor(block: BlockNode): string {
  return getMiniBlockView(block).color
}

function chipTypeLabel(block: BlockNode): ValueType | null {
  return getMiniBlockView(block).valueType
}

export function MinimizedBlockChip({
  block,
  onOpenEditor,
  onRemove,
  onReferenceDragStart,
  onChipPointerDown,
  onCallOutOpen,
  isSelected = false,
  usageOutPort = false,
  usageInPortId,
  callOutPort = false,
}: MinimizedBlockChipProps) {
  const typeLabel = chipTypeLabel(block)
  const color = chipColor(block)
  const showReferenceGrip = isValueSourceBlock(block) && !!onReferenceDragStart

  const openEditorFromEvent = (e: React.PointerEvent | React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.minimized-chip__link-grip, .minimized-chip__remove')) {
      return
    }
    const anchor = (e.currentTarget as HTMLElement).closest('[data-block-id]') as HTMLElement
    if (anchor) onOpenEditor(anchor)
  }

  return (
    <div
      className={`minimized-chip${isSelected ? ' minimized-chip--selected' : ''}`}
      style={{ '--chip-color': color } as React.CSSProperties}
      data-block-id={block.id}
    >
      {usageInPortId && (
        <span
          className="usage-anchor usage-anchor--in"
          data-port-id={usageInPortId}
          aria-hidden
        />
      )}
      {usageOutPort && (
        <span className="usage-anchor usage-anchor--out" data-port-id="value-out" aria-hidden />
      )}
      {callOutPort && (
        <button
          type="button"
          className="usage-anchor usage-anchor--out"
          data-port-id="call-out"
          aria-label="Open function definition"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onCallOutOpen?.()
          }}
        />
      )}
      <button
        type="button"
        className="minimized-chip__main"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('.minimized-chip__link-grip, .minimized-chip__remove')) {
            return
          }
          const anchor = e.currentTarget.closest('[data-block-id]') as HTMLElement
          if (anchor && onChipPointerDown) {
            onChipPointerDown(e, anchor)
          }
        }}
        onClick={(e) => {
          // Pointer-up on the drag handler opens the editor for chips that support drag.
          if (onChipPointerDown) return
          openEditorFromEvent(e)
        }}
      >
        {typeLabel && (
          <span className="minimized-chip__type">{typeLabel}</span>
        )}
        <span className="minimized-chip__label">{chipLabel(block)}</span>
      </button>
      {showReferenceGrip && (
        <button
          type="button"
          className="minimized-chip__link-grip"
          aria-label={`Drag ${getLabelFromSource(block) ?? 'value'} to link`}
          title="Drag to use in another block"
          onPointerDown={(e) => {
            e.stopPropagation()
            onReferenceDragStart?.(e)
          }}
        >
          ⠿
        </button>
      )}
      <button
        type="button"
        className="minimized-chip__remove"
        aria-label="Remove block"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        ×
      </button>
    </div>
  )
}
