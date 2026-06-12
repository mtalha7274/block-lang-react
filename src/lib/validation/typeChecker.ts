import type { BlockKind, BlockNode, ValueType } from '../../types'
import {
  canUseAsStatement,
  getBlockValueType,
  isValueReturningBlock,
} from '../program/blockContract'
import { getExpressionOperandType } from './slotRules'

export { getBlockValueType, getExpressionOperandType }

export const VALUE_NESTABLE_KINDS = new Set<BlockKind>([
  'primitive',
  'variable',
  'expression',
  'functionCall',
  'valueRef',
])

export function canValueSlotAcceptBlock(
  expected: ValueType,
  block: BlockNode,
): boolean {
  return getBlockValueType(block) === expected
}

export function canSlotAcceptBlock(
  expected: ValueType,
  block: BlockNode,
): boolean {
  return canValueSlotAcceptBlock(expected, block)
}

export function canBooleanSlotAcceptBlock(block: BlockNode): boolean {
  return canValueSlotAcceptBlock('boolean', block)
}

export function canPaletteKindFitValueSlot(
  kind: BlockKind,
  expected: ValueType,
): boolean {
  if (kind === 'primitive') return expected !== 'void'
  if (kind === 'variable' || kind === 'expression' || kind === 'functionCall') {
    return expected === 'number'
  }
  return false
}

export function canStatementBodyAcceptBlock(block: BlockNode): boolean {
  return canUseAsStatement(block)
}

export function canTypeVariableAcceptBlock(block: BlockNode): boolean {
  return block.kind === 'variable'
}

export function canFunctionSignatureAcceptBlock(block: BlockNode): boolean {
  return block.kind === 'type'
}

export function canCallArgAcceptBlock(
  expected: ValueType,
  block: BlockNode,
): boolean {
  return canValueSlotAcceptBlock(expected, block)
}

export function canPrintValueAcceptBlock(block: BlockNode): boolean {
  return isValueReturningBlock(block)
}

export function canIfConditionAcceptBlock(block: BlockNode): boolean {
  return canBooleanSlotAcceptBlock(block)
}

export function canTypedValueSlotAcceptBlock(
  expected: ValueType,
  block: BlockNode,
): boolean {
  return canValueSlotAcceptBlock(expected, block)
}

export function canExpressionOperandAcceptBlock(
  expr: Extract<BlockNode, { kind: 'expression' }>,
  block: BlockNode,
): boolean {
  return canValueSlotAcceptBlock(getExpressionOperandType(expr.data.operator), block)
}

/** @deprecated Use canPaletteKindFitValueSlot */
export function paletteKindFitsTypedValueSlot(
  kind: BlockKind,
  expected: ValueType,
): boolean {
  return canPaletteKindFitValueSlot(kind, expected)
}

export function paletteKindFitsBooleanSlot(kind: BlockKind): boolean {
  return canPaletteKindFitValueSlot(kind, 'boolean')
}

export function defaultValueForType(type: ValueType): string | number | boolean {
  switch (type) {
    case 'number':
      return 0
    case 'string':
      return ''
    case 'boolean':
      return true
    default:
      return 0
  }
}

export function slotRejectMessage(
  expected: ValueType,
  block: BlockNode,
): string {
  const got = getBlockValueType(block)
  if (got === null) return `This slot needs a ${expected} value`
  return `Needs a ${expected}, not a ${got}`
}
