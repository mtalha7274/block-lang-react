import type { SlotTarget } from '../../types'

export function slotTargetToSelector(target: SlotTarget): string {
  switch (target.kind) {
    case 'statement-body':
      return `[data-slot-kind="statement-body"][data-slot-parent-id="${target.parentBlockId}"][data-slot-region="${target.region}"]`
    case 'variable-value':
      return `[data-slot-kind="variable-value"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'print-value':
      return `[data-slot-kind="print-value"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'return-value':
      return `[data-slot-kind="return-value"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'if-condition':
      return `[data-slot-kind="if-condition"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'for-init':
      return `[data-slot-kind="for-init"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'for-condition':
      return `[data-slot-kind="for-condition"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'for-increment':
      return `[data-slot-kind="for-increment"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'while-condition':
      return `[data-slot-kind="while-condition"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'expression-operand':
      return `[data-slot-kind="expression-operand"][data-slot-parent-id="${target.parentBlockId}"][data-slot-side="${target.side}"]`
    case 'call-arg':
      return `[data-slot-kind="call-arg"][data-slot-parent-id="${target.parentBlockId}"][data-slot-arg-port-id="${target.argPortId}"]`
    case 'function-signature':
      return `[data-slot-kind="function-signature"][data-slot-parent-id="${target.parentBlockId}"]`
    case 'type-variable':
      return `[data-slot-kind="type-variable"][data-slot-parent-id="${target.parentBlockId}"]`
    default:
      return '[data-slot-kind]'
  }
}

export function paletteKindSelector(kind: string): string {
  return `[data-palette-kind="${kind}"]`
}

export function blockChipSelector(blockId: string): string {
  return `[data-block-id="${blockId}"]`
}

export function getElementCenter(el: Element): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
