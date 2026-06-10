import type { BlockNode, OperatorSymbol, ValueType } from '../../types'
import { operators } from '../../constants/operators'
import { createBlockFromKind } from '../../constants/blockDefaults'

export function getBlockValueType(block: BlockNode): ValueType | null {
  if (block.kind === 'primitive') return block.data.valueType
  if (block.kind === 'functionCall') return block.data.returnType
  if (block.kind === 'expression') return block.data.resultType
  if (block.kind === 'variable') return block.data.valueType
  if (block.kind === 'valueRef') return block.data.valueType
  return null
}

export function canSlotAcceptBlock(
  expected: ValueType,
  block: BlockNode,
): boolean {
  const blockType = getBlockValueType(block)
  if (blockType === null) return false
  return blockType === expected
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
  if (block.kind === 'primitive') {
    return block.data.valueType === expected
  }
  if (block.kind === 'variable') {
    return block.data.valueType === expected
  }
  return false
}

export function canPrintValueAcceptBlock(block: BlockNode): boolean {
  return (
    block.kind === 'primitive' ||
    block.kind === 'variable' ||
    block.kind === 'expression' ||
    block.kind === 'functionCall' ||
    block.kind === 'valueRef'
  )
}

export function canIfConditionAcceptBlock(block: BlockNode): boolean {
  const blockType = getBlockValueType(block)
  return blockType === 'boolean'
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
  if (block.kind === 'primitive') return true
  return canSlotAcceptBlock(expected, block)
}

export function canExpressionOperandAcceptBlock(
  expr: Extract<BlockNode, { kind: 'expression' }>,
  block: BlockNode,
): boolean {
  const expected = getExpressionOperandType(expr.data.operator)
  if (block.kind === 'primitive') return true
  if (
    block.kind === 'variable' ||
    block.kind === 'expression' ||
    block.kind === 'functionCall' ||
    block.kind === 'valueRef'
  ) {
    return canSlotAcceptBlock(expected, block)
  }
  return false
}

export function paletteKindFitsTypedValueSlot(
  kind: import('../../types').BlockKind,
  expected: ValueType,
): boolean {
  if (kind === 'primitive') return true
  if (kind === 'variable') return true
  if (kind === 'expression') return true
  if (kind === 'functionCall') {
    const probe = createBlockFromKind('functionCall') as Extract<
      BlockNode,
      { kind: 'functionCall' }
    >
    return probe.data.returnType === expected
  }
  return false
}

export function paletteKindFitsBooleanSlot(
  kind: import('../../types').BlockKind,
): boolean {
  return (
    kind === 'primitive' ||
    kind === 'variable' ||
    kind === 'expression' ||
    kind === 'functionCall'
  )
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
