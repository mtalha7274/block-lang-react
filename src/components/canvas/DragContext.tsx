import { createContext, useContext } from 'react'
import type {
  BlockKind,
  BlockLayoutOverride,
  BlockNode,
  OperatorSymbol,
  SlotTarget,
  ValueType,
} from '../../types'

export interface HoverPreviewSize {
  width: number
  height: number
}

export interface DragContextValue {
  draggingBlockId: string | null
  draggingPaletteKind: BlockKind | null
  draggingReferenceSourceId: string | null
  hoverSlot: SlotTarget | null
  slotValidity: 'valid' | 'invalid' | null
  rejectBlockId: string | null
  rejectMessage: string | null
  rejectSlotTarget: SlotTarget | null
  editorStack: string[]
  updateBlockType: (blockId: string, type: ValueType) => void
  updateBlockValue: (blockId: string, value: string | number | boolean) => void
  updateVariableName: (blockId: string, name: string) => void
  updateFunctionReturnType: (blockId: string, returnType: ValueType) => void
  updateFunctionName: (blockId: string, name: string) => void
  addTypeParamRow: (typeBlockId: string) => void
  removeTypeParamRow: (typeBlockId: string, rowId: string) => void
  updateTypeParamRow: (
    typeBlockId: string,
    rowId: string,
    patch: { name?: string; type?: ValueType },
  ) => void
  updateFunctionCallName: (blockId: string, name: string) => void
  updateExpressionOperator: (blockId: string, operator: OperatorSymbol) => void
  updateExpressionResultName: (blockId: string, name: string) => void
  updateBlockLayout: (blockId: string, layout: BlockLayoutOverride | null) => void
  hoverPreviewSize: HoverPreviewSize | null
  referenceDragPosition: { x: number; y: number } | null
  onSlotPointerEnter: (target: SlotTarget, expectedType?: ValueType) => void
  onSlotPointerLeave: (target: SlotTarget) => void
  onSlotPointerUp: (target: SlotTarget) => void
  onBlockDragStart: (blockId: string) => void
  onBlockDragEnd: () => void
  onReferenceDragStart: (sourceBlockId: string) => (e: React.PointerEvent) => void
  onReferenceDragEnd: () => void
  onNestedChipPointerDown?: (
    blockId: string,
    e: React.PointerEvent,
    anchorEl: HTMLElement,
    openEditor: (anchor: HTMLElement) => void,
  ) => void
  handleSlotDragOver?: (
    target: SlotTarget,
    expectedType?: ValueType,
  ) => (e: React.DragEvent) => void
  handleSlotDrop?: (
    target: SlotTarget,
    expectedType?: ValueType,
  ) => (e: React.DragEvent) => void
  openBlockEditor: (blockId: string, anchorEl?: HTMLElement | null) => void
  closeBlockEditor: (blockId: string) => void
  closeNestedEditors: (containerBlockId: string) => void
  detachNestedBlock: (blockId: string) => void
  removeTopLevelBlock: (blockId: string) => void
  assignInScopeReference: (sourceBlockId: string, target: SlotTarget) => boolean
  getInScopeValues: (consumerBlockId: string) => import('../../lib/program/scope').InScopeValue[]
  isNested: boolean
}

export const DragContext = createContext<DragContextValue | null>(null)

export function useDragContext(): DragContextValue {
  const ctx = useContext(DragContext)
  if (!ctx) {
    return {
      draggingBlockId: null,
      draggingPaletteKind: null,
      draggingReferenceSourceId: null,
      hoverSlot: null,
      slotValidity: null,
      rejectBlockId: null,
      rejectMessage: null,
      rejectSlotTarget: null,
      editorStack: [],
      updateBlockType: () => {},
      updateBlockValue: () => {},
      updateVariableName: () => {},
      updateFunctionReturnType: () => {},
      updateFunctionName: () => {},
      addTypeParamRow: () => {},
      removeTypeParamRow: () => {},
      updateTypeParamRow: () => {},
      updateFunctionCallName: () => {},
      updateExpressionOperator: () => {},
      updateExpressionResultName: () => {},
      updateBlockLayout: () => {},
      hoverPreviewSize: null,
      referenceDragPosition: null,
      onSlotPointerEnter: () => {},
      onSlotPointerLeave: () => {},
      onSlotPointerUp: () => {},
      onBlockDragStart: () => {},
      onBlockDragEnd: () => {},
      onReferenceDragStart: () => () => {},
      onReferenceDragEnd: () => {},
      onNestedChipPointerDown: undefined,
      openBlockEditor: () => {},
      closeBlockEditor: () => {},
      closeNestedEditors: () => {},
      detachNestedBlock: () => {},
      removeTopLevelBlock: () => {},
      assignInScopeReference: () => false,
      getInScopeValues: () => [],
      isNested: false,
    }
  }
  return ctx
}

export function isBlockEditing(ctx: DragContextValue, blockId: string): boolean {
  return ctx.editorStack.includes(blockId)
}

export function slotTargetKey(target: SlotTarget): string {
  if (target.kind === 'variable-value') {
    return `var:${target.parentBlockId}`
  }
  if (target.kind === 'type-variable') {
    return `type-var:${target.parentBlockId}`
  }
  if (target.kind === 'function-signature') {
    return `func-sig:${target.parentBlockId}`
  }
  if (target.kind === 'call-arg') {
    return `call-arg:${target.parentBlockId}:${target.argPortId}`
  }
  if (target.kind === 'print-value') {
    return `print:${target.parentBlockId}`
  }
  if (target.kind === 'if-condition') {
    return `if-cond:${target.parentBlockId}`
  }
  if (target.kind === 'expression-operand') {
    return `expr-op:${target.parentBlockId}:${target.side}`
  }
  if (target.kind === 'for-init') {
    return `for-init:${target.parentBlockId}`
  }
  if (target.kind === 'for-condition') {
    return `for-cond:${target.parentBlockId}`
  }
  if (target.kind === 'for-increment') {
    return `for-inc:${target.parentBlockId}`
  }
  if (target.kind === 'while-condition') {
    return `while-cond:${target.parentBlockId}`
  }
  if (target.kind === 'statement-body') {
    return `stmt:${target.parentBlockId}:${target.region}:${target.index ?? 'append'}`
  }
  return `unknown:${JSON.stringify(target)}`
}

export function isSlotHovered(
  ctx: DragContextValue,
  target: SlotTarget,
): boolean {
  if (!ctx.hoverSlot) return false
  return slotTargetKey(ctx.hoverSlot) === slotTargetKey(target)
}

export function isSlotRejected(
  ctx: DragContextValue,
  target: SlotTarget,
): boolean {
  if (!ctx.rejectSlotTarget) return false
  return slotTargetKey(ctx.rejectSlotTarget) === slotTargetKey(target)
}

export function getDraggedBlockForSlot(
  ctx: DragContextValue,
  findBlock: (id: string) => BlockNode | undefined,
): BlockNode | null {
  if (ctx.draggingBlockId) {
    return findBlock(ctx.draggingBlockId) ?? null
  }
  return null
}
