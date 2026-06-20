import type { BlockNode, ValueType } from '../../types'
import {
  canCreateValueReference,
  getBlockValueType,
  getValueLabel,
} from './blockContract'
import { findBlockInTree, findBlockParent } from './blockTree'

export interface InScopeValue {
  blockId: string
  label: string
  valueType: ValueType
  kind: BlockNode['kind']
}

export function getValueTypeFromSource(block: BlockNode): ValueType | null {
  return canCreateValueReference(block) ? getBlockValueType(block) : null
}

export function getLabelFromSource(block: BlockNode): string | null {
  return getValueLabel(block)
}

export function isValueSourceBlock(block: BlockNode): boolean {
  return canCreateValueReference(block)
}

function collectValueSourcesFromStatement(
  stmt: BlockNode,
  result: InScopeValue[],
): void {
  const valueType = getValueTypeFromSource(stmt)
  const label = getLabelFromSource(stmt)
  if (valueType && label) {
    result.push({
      blockId: stmt.id,
      label,
      valueType,
      kind: stmt.kind,
    })
  }

  if (stmt.kind === 'if') {
    stmt.data.trueBranch.forEach((child) => collectValueSourcesFromStatement(child, result))
    stmt.data.falseBranch?.forEach((child) => collectValueSourcesFromStatement(child, result))
  } else if (stmt.kind === 'for') {
    if (stmt.data.init) collectValueSourcesFromStatement(stmt.data.init, result)
    stmt.data.body.forEach((child) => collectValueSourcesFromStatement(child, result))
  } else if (stmt.kind === 'while') {
    stmt.data.body.forEach((child) => collectValueSourcesFromStatement(child, result))
  }
}

export function collectInScopeValues(
  statements: BlockNode[],
  beforeIndex: number,
): InScopeValue[] {
  const result: InScopeValue[] = []
  for (let i = 0; i < beforeIndex && i < statements.length; i += 1) {
    collectValueSourcesFromStatement(statements[i], result)
  }
  return result
}

function getStatementsForParent(
  blocks: BlockNode[],
  parentBlockId: string,
  region: import('../../types').StatementBodyRegion,
): BlockNode[] {
  const parent = findBlockInTree(blocks, parentBlockId)
  if (!parent) return []

  switch (parent.kind) {
    case 'main':
      return region === 'main' ? parent.data.body : []
    case 'function':
      return region === 'function' ? parent.data.body : []
    case 'if':
      if (region === 'if-true') return parent.data.trueBranch
      if (region === 'if-false') return parent.data.falseBranch ?? []
      return []
    case 'for':
      return region === 'for' ? parent.data.body : []
    case 'while':
      return region === 'while' ? parent.data.body : []
    default:
      return []
  }
}

export function getInScopeValuesForConsumer(
  blocks: BlockNode[],
  consumerBlockId: string,
): InScopeValue[] {
  const parent = findBlockParent(blocks, consumerBlockId)
  if (!parent || parent.target.kind !== 'statement-body') return []

  const statements = getStatementsForParent(
    blocks,
    parent.parentBlockId,
    parent.target.region,
  )
  const index = statements.findIndex((s) => s.id === consumerBlockId)
  if (index <= 0) return collectInScopeValues(statements, index)
  return collectInScopeValues(statements, index)
}

const CONSUMER_VALUE_SLOT_KINDS = new Set<import('../../types').SlotTarget['kind']>([
  'variable-value',
  'print-value',
  'return-value',
  'if-condition',
  'call-arg',
  'expression-operand',
  'for-init',
  'for-condition',
  'for-increment',
  'while-condition',
])

export function isConsumerValueSlot(target: import('../../types').SlotTarget): boolean {
  return CONSUMER_VALUE_SLOT_KINDS.has(target.kind)
}

/** Prefer a valueRef when the source block is already an in-scope value on the consumer's line. */
export function shouldUseInScopeReference(
  blocks: BlockNode[],
  sourceBlockId: string,
  target: import('../../types').SlotTarget,
): boolean {
  if (!isConsumerValueSlot(target)) return false

  const source = findBlockInTree(blocks, sourceBlockId)
  if (!source || !isValueSourceBlock(source)) return false

  const inScope = getInScopeValuesForConsumer(blocks, target.parentBlockId)
  return inScope.some((value) => value.blockId === sourceBlockId)
}
