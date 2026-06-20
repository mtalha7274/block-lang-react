import { useRef } from 'react'
import type { BlockNode, ValueType } from '../../types'
import { getMiniBlockView } from '../../lib/program/blockContract'
import { getLabelFromSource, isValueSourceBlock } from '../../lib/program/scope'
import './MinimizedBlockChip.css'

const TAP_MOVE_THRESHOLD_PX = 6

interface MinimizedBlockChipProps {
  block: BlockNode
  onOpenEditor: (anchorEl: HTMLElement) => void
  onRemove: () => void
  onReferenceDragStart?: (e: React.PointerEvent) => void
  onChipPointerDown?: (
    e: React.PointerEvent,
    anchorEl: HTMLElement,
  ) => void
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
  isSelected = false,
  usageOutPort = false,
  usageInPortId,
  callOutPort = false,
}: MinimizedBlockChipProps) {
  const typeLabel = chipTypeLabel(block)
  const color = chipColor(block)
  const showReferenceGrip = isValueSourceBlock(block) && !!onReferenceDragStart
  const gestureRef = useRef({ startX: 0, startY: 0 })
  const openedFromPointerRef = useRef(false)
  const supportsChipDrag = block.kind !== 'primitive' && !!onChipPointerDown

  const openFromAnchor = (anchor: HTMLElement, e: React.PointerEvent | React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpenEditor(anchor)
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
        <span className="usage-anchor usage-anchor--out" data-port-id="call-out" aria-hidden />
      )}
      <button
        type="button"
        className="minimized-chip__main"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('.minimized-chip__link-grip, .minimized-chip__remove')) {
            return
          }
          const anchor = e.currentTarget.closest('[data-block-id]') as HTMLElement
          if (!anchor) return

          gestureRef.current = { startX: e.clientX, startY: e.clientY }

          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            // Pointer capture is best-effort for reliable tap detection.
          }

          if (supportsChipDrag) {
            onChipPointerDown!(e, anchor)
          }
        }}
        onPointerUp={(e) => {
          if ((e.target as HTMLElement).closest('.minimized-chip__link-grip, .minimized-chip__remove')) {
            return
          }
          const anchor = e.currentTarget.closest('[data-block-id]') as HTMLElement
          if (!anchor) return

          const { startX, startY } = gestureRef.current
          const dx = e.clientX - startX
          const dy = e.clientY - startY
          const isTap = Math.abs(dx) < TAP_MOVE_THRESHOLD_PX && Math.abs(dy) < TAP_MOVE_THRESHOLD_PX

          try {
            e.currentTarget.releasePointerCapture(e.pointerId)
          } catch {
            // Ignore if capture was not set.
          }

          if (isTap) {
            openedFromPointerRef.current = true
            openFromAnchor(anchor, e)
          }
        }}
        onClick={(e) => {
          if (openedFromPointerRef.current) {
            openedFromPointerRef.current = false
            return
          }
          if ((e.target as HTMLElement).closest('.minimized-chip__link-grip, .minimized-chip__remove')) {
            return
          }
          const anchor = e.currentTarget.closest('[data-block-id]') as HTMLElement
          if (!anchor) return
          openFromAnchor(anchor, e)
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
