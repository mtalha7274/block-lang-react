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
  scopePickerMode?: 'read' | 'assign'
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
  scopePickerMode = 'read',
  children,
}: BlockSlotProps) {
  const ctx = useDragContext()
  const hovered = slotTarget ? isSlotHovered(ctx, slotTarget) : false
  const rejected = slotTarget ? isSlotRejected(ctx, slotTarget) : false
  const isValid = hovered && ctx.slotValidity === 'valid'
  const isInvalid = hovered && ctx.slotValidity === 'invalid'
  const showPreview = isValid && !filled && ctx.hoverPreviewSize

  const isAssignMode =
    scopePickerMode === 'assign' && slotTarget?.kind === 'statement-body'

  const scopeOptions: InScopeValue[] =
    scopeConsumerId && isAssignMode
      ? ctx.getAssignableScopeValues(scopeConsumerId)
      : scopeConsumerId
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
        onDragOver: ctx.handleSlotDragOver?.(slotTarget, expectedType),
        onDrop: ctx.handleSlotDrop?.(slotTarget, expectedType),
      }
    : {}

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
    if (isAssignMode && slotTarget.kind === 'statement-body') {
      const createdId = ctx.assignReassignmentToBody(sourceBlockId, slotTarget)
      if (createdId) {
        ctx.openBlockEditor(createdId)
      }
      return
    }
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
          {scopeConsumerId && slotTarget && scopeOptions.length > 0 && (
            <ScopePicker
              options={scopeOptions}
              expectedType={expectedType}
              toggleLabel={isAssignMode ? 'Assign to existing…' : 'Use existing…'}
              onSelect={handlePickInScope}
            />
          )}
        </>
      )}
      <div className="slot__content">
        {filled && children ? (
          <div className="slot__preview">{children}</div>
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
