import type { ValueType, SlotTarget } from '../../types'
import type { InScopeValue } from '../../lib/program/scope'
import { isSlotHovered, isSlotRejected, useDragContext } from '../canvas/DragContext'
import { ScopePicker } from './ScopePicker'
import './BlockSlot.css'

interface BlockSlotProps {
  slotTarget?: SlotTarget
  expectedType?: ValueType
  hint?: string
  label?: string
  filled?: boolean
  invalid?: boolean
  scopeConsumerId?: string
  children?: React.ReactNode
}

export function BlockSlot({
  slotTarget,
  expectedType,
  hint,
  label,
  filled = false,
  invalid = false,
  scopeConsumerId,
  children,
}: BlockSlotProps) {
  const ctx = useDragContext()
  const hovered = slotTarget ? isSlotHovered(ctx, slotTarget) : false
  const rejected = slotTarget ? isSlotRejected(ctx, slotTarget) : false
  const isValid = hovered && ctx.slotValidity === 'valid'
  const isInvalid = hovered && ctx.slotValidity === 'invalid'
  const showPreview = isValid && !filled && ctx.hoverPreviewSize

  const scopeOptions: InScopeValue[] = scopeConsumerId
    ? ctx.getInScopeValues(scopeConsumerId)
    : []

  const classes = [
    'slot',
    filled ? 'slot--filled' : 'slot--empty',
    isValid ? 'slot--hover-valid' : '',
    isInvalid ? 'slot--hover-invalid' : '',
    invalid ? 'slot--invalid' : '',
    rejected ? 'slot--reject' : '',
    showPreview ? 'slot--preview-sizing' : '',
    ctx.draggingPaletteKind ? 'slot--palette-drag' : '',
    ctx.rejectMessage && hovered ? 'slot--reject' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const hintText =
    hint ??
    label ??
    (expectedType
      ? `Drop a ${expectedType} Constant here`
      : 'Drop a Variable or Expression here')

  const interactiveProps = slotTarget
    ? {
        onPointerEnter: () => {
          if (ctx.draggingBlockId || ctx.draggingPaletteKind || ctx.draggingReferenceSourceId) {
            ctx.onSlotPointerEnter(slotTarget, expectedType)
          }
        },
        onPointerLeave: () => ctx.onSlotPointerLeave(slotTarget),
        onPointerUp: () => {
          if (ctx.draggingBlockId || ctx.draggingPaletteKind || ctx.draggingReferenceSourceId) {
            ctx.onSlotPointerUp(slotTarget)
          }
        },
        onDragOver: (e: React.DragEvent) => {
          ctx.handleSlotDragOver?.(slotTarget, expectedType)?.(e)
        },
        onDrop: (e: React.DragEvent) => {
          ctx.handleSlotDrop?.(slotTarget, expectedType)?.(e)
        },
      }
    : {}

  const passThroughDrag = (e: React.DragEvent) => {
    if (!slotTarget) return
    if (e.currentTarget === e.target) return
    ctx.handleSlotDragOver?.(slotTarget, expectedType)?.(e)
  }

  const passThroughDrop = (e: React.DragEvent) => {
    if (!slotTarget) return
    if (e.currentTarget === e.target) return
    ctx.handleSlotDrop?.(slotTarget, expectedType)?.(e)
  }

  const previewStyle: React.CSSProperties | undefined = showPreview
    ? {
        minWidth: ctx.hoverPreviewSize!.width,
        minHeight: ctx.hoverPreviewSize!.height,
      }
    : undefined

  const slotDataAttrs = slotTarget
    ? {
        'data-slot-kind': slotTarget.kind,
        'data-slot-parent-id': slotTarget.parentBlockId,
        ...(slotTarget.kind === 'statement-body'
          ? { 'data-slot-region': slotTarget.region }
          : {}),
        ...(slotTarget.kind === 'call-arg'
          ? { 'data-slot-arg-port-id': slotTarget.argPortId }
          : {}),
        ...(slotTarget.kind === 'expression-operand'
          ? { 'data-slot-side': slotTarget.side }
          : {}),
      }
    : {}

  const handlePickInScope = (sourceBlockId: string) => {
    if (!slotTarget) return
    ctx.assignInScopeReference(sourceBlockId, slotTarget)
  }

  return (
    <div
      className={classes}
      style={previewStyle}
      data-expected-type={expectedType}
      {...slotDataAttrs}
      {...interactiveProps}
    >
      {!filled && (
        <>
          <span className="slot__hint">{hintText}</span>
          {scopeConsumerId && slotTarget && (
            <ScopePicker
              options={scopeOptions}
              expectedType={expectedType}
              onSelect={handlePickInScope}
            />
          )}
        </>
      )}
      <div
        className="slot__content"
        onDragOver={passThroughDrag}
        onDrop={passThroughDrop}
      >
        {filled && children ? (
          <div
            className="slot__preview"
            onDragOver={passThroughDrag}
            onDrop={passThroughDrop}
          >
            {children}
          </div>
        ) : (
          !filled && <span className="slot__placeholder">+</span>
        )}
      </div>
      {isInvalid && ctx.rejectMessage && (
        <span className="slot__reject-msg">{ctx.rejectMessage}</span>
      )}
      {rejected && !hovered && ctx.rejectMessage && (
        <span className="slot__reject-msg">{ctx.rejectMessage}</span>
      )}
    </div>
  )
}
