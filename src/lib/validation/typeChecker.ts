import type { BlockKind, BlockNode, OperatorSymbol, ValueType } from '../../types'
import { operators } from '../../constants/operators'
import { createBlockFromKind } from '../../constants/blockDefaults'

export const VALUE_NESTABLE_KINDS = new Set<BlockKind>([
  'primitive',
  'variable',
  'expression',
  'functionCall',
  'valueRef',
])

export function getBlockValueType(block: BlockNode): ValueType | null {
  if (block.kind === 'primitive') return block.data.valueType
  if (block.kind === 'functionCall') return block.data.returnType
  if (block.kind === 'expression') return block.data.resultType
  if (block.kind === 'variable') return block.data.valueType
  if (block.kind === 'valueRef') return block.data.valueType
  return null
}

export function canValueSlotAcceptBlock(
  expected: ValueType,
  block: BlockNode,
): boolean {
  if (block.kind === 'primitive') return true
  const blockType = getBlockValueType(block)
  if (blockType === null) return false
  return blockType === expected
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
  if (kind === 'primitive') return true
  if (kind === 'variable') {
    const probe = createBlockFromKind('variable') as Extract<
      BlockNode,
      { kind: 'variable' }
    >
    return probe.data.valueType === expected
  }
  if (kind === 'expression') {
    const probe = createBlockFromKind('expression') as Extract<
      BlockNode,
      { kind: 'expression' }
    >
    return probe.data.resultType === expected
  }
  if (kind === 'functionCall') {
    const probe = createBlockFromKind('functionCall') as Extract<
      BlockNode,
      { kind: 'functionCall' }
    >
    return probe.data.returnType === expected
  }
  return false
}

const STATEMENT_BODY_KINDS = new Set([
  'variable',
  'expression',
  'print',
  'functionCall',
  'if',
  'for',
  'while',
])

export function canStatementBodyAcceptBlock(block: BlockNode): boolean {
  return STATEMENT_BODY_KINDS.has(block.kind)
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
  return VALUE_NESTABLE_KINDS.has(block.kind)
}

export function canIfConditionAcceptBlock(block: BlockNode): boolean {
  return canBooleanSlotAcceptBlock(block)
}

export function getExpressionOperandType(operator: OperatorSymbol): ValueType {
  const entry = operators.find((op) => op.symbol === operator)
  if (!entry) return 'number'
  return entry.resultType === 'boolean' ? 'number' : entry.resultType
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
  const expected = getExpressionOperandType(expr.data.operator)
  if (!VALUE_NESTABLE_KINDS.has(block.kind)) return false
  return canValueSlotAcceptBlock(expected, block)
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
