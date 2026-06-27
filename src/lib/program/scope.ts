import type { BlockNode, SlotTarget, ValueType } from '../../types'
import {
  canCreateValueReference,
  getBlockValueType,
  getValueLabel,
} from './blockContract'
import { findBlockInTree, findBlockParent } from './blockTree'
import { findEnclosingFunction } from './enclosingFunction'
import {
  deriveFunctionParams,
  functionParamSourceId,
  isFunctionParamSourceId,
} from './functionParams'

export interface InScopeValue {
  blockId: string
  label: string
  valueType: ValueType
  kind: BlockNode['kind'] | 'functionParam'
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

const SCOPE_HOST_BLOCK_KINDS = new Set<BlockNode['kind']>([
  'if',
  'for',
  'while',
  'print',
  'return',
  'variable',
  'expression',
  'functionCall',
])

/** Walk from a slot or nested block to the block that owns scope for "use existing…". */
export function resolveScopeConsumerBlockId(
  blocks: BlockNode[],
  startBlockId: string,
): string {
  let currentId = startBlockId

  while (true) {
    const block = findBlockInTree(blocks, currentId)
    if (block && SCOPE_HOST_BLOCK_KINDS.has(block.kind)) {
      return currentId
    }

    const parent = findBlockParent(blocks, currentId)
    if (!parent) return startBlockId
    currentId = parent.parentBlockId
  }
}

export function resolveScopeConsumerId(
  blocks: BlockNode[],
  target: SlotTarget | string,
): string {
  if (typeof target === 'string') {
    return resolveScopeConsumerBlockId(blocks, target)
  }
  return resolveScopeConsumerBlockId(blocks, target.parentBlockId)
}

function findEnclosingForLoops(
  blocks: BlockNode[],
  blockId: string,
): Extract<BlockNode, { kind: 'for' }>[] {
  const loops: Extract<BlockNode, { kind: 'for' }>[] = []
  let walkId: string | null = blockId

  while (walkId) {
    const parent = findBlockParent(blocks, walkId)
    if (!parent) break

    const container = findBlockInTree(blocks, parent.parentBlockId)
    if (container?.kind === 'for') {
      loops.push(container)
      walkId = container.id
      continue
    }

    walkId = parent.parentBlockId
  }

  return loops
}

function mergeUniqueInScope(
  target: InScopeValue[],
  seen: Set<string>,
  incoming: InScopeValue[],
): void {
  for (const value of incoming) {
    if (seen.has(value.blockId)) continue
    seen.add(value.blockId)
    target.push(value)
  }
}

export function getInScopeValuesForConsumer(
  blocks: BlockNode[],
  consumerBlockId: string,
): InScopeValue[] {
  const consumerId = resolveScopeConsumerBlockId(blocks, consumerBlockId)
  const result: InScopeValue[] = []
  const seen = new Set<string>()

  let walkId: string | null = consumerId

  while (walkId) {
    const parent = findBlockParent(blocks, walkId)
    if (!parent) break

    if (parent.target.kind === 'statement-body') {
      const statements = getStatementsForParent(
        blocks,
        parent.parentBlockId,
        parent.target.region,
      )
      const index = statements.findIndex((s) => s.id === walkId)
      if (index > 0) {
        mergeUniqueInScope(result, seen, collectInScopeValues(statements, index))
      }
      walkId = parent.parentBlockId
      continue
    }

    if (
      parent.target.kind === 'if-condition' ||
      parent.target.kind === 'for-init' ||
      parent.target.kind === 'for-condition' ||
      parent.target.kind === 'for-increment' ||
      parent.target.kind === 'while-condition' ||
      parent.target.kind === 'expression-operand' ||
      parent.target.kind === 'variable-value' ||
      parent.target.kind === 'print-value' ||
      parent.target.kind === 'return-value' ||
      parent.target.kind === 'call-arg'
    ) {
      walkId = parent.parentBlockId
      continue
    }

    break
  }

  for (const forLoop of findEnclosingForLoops(blocks, consumerId)) {
    if (!forLoop.data.init) continue
    const initValues: InScopeValue[] = []
    collectValueSourcesFromStatement(forLoop.data.init, initValues)
    mergeUniqueInScope(result, seen, initValues)
  }

  const enclosingFn = findEnclosingFunction(blocks, consumerId)
  if (enclosingFn) {
    const paramValues = deriveFunctionParams(enclosingFn).map((param) => ({
      blockId: functionParamSourceId(enclosingFn.id, param.id),
      label: param.name,
      valueType: param.type,
      kind: 'functionParam' as const,
    }))
    mergeUniqueInScope(result, seen, paramValues)
  }

  return result
}

const CONSUMER_VALUE_SLOT_KINDS = new Set<SlotTarget['kind']>([
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

export function isConsumerValueSlot(target: SlotTarget): boolean {
  return CONSUMER_VALUE_SLOT_KINDS.has(target.kind)
}

/** Prefer a valueRef when the source block is already an in-scope value on the consumer's line. */
export function shouldUseInScopeReference(
  blocks: BlockNode[],
  sourceBlockId: string,
  target: SlotTarget,
): boolean {
  if (!isConsumerValueSlot(target)) return false

  const resolvedId = resolveInScopeReferenceSource(blocks, sourceBlockId, target)
  if (isFunctionParamSourceId(resolvedId)) {
    const consumerId = resolveScopeConsumerId(blocks, target)
    const inScope = getInScopeValuesForConsumer(blocks, consumerId)
    return inScope.some((value) => value.blockId === resolvedId)
  }

  const source = findBlockInTree(blocks, resolvedId)
  if (!source || !isValueSourceBlock(source)) return false

  const consumerId = resolveScopeConsumerId(blocks, target)
  const inScope = getInScopeValuesForConsumer(blocks, consumerId)
  return inScope.some((value) => value.blockId === resolvedId)
}

/**
 * When linking to a value slot, prefer the in-scope Variable that holds an expression
 * instead of the nested expression block itself.
 */
export function resolveInScopeReferenceSource(
  blocks: BlockNode[],
  sourceBlockId: string,
  target: SlotTarget,
): string {
  const consumerId = resolveScopeConsumerId(blocks, target)
  const inScope = getInScopeValuesForConsumer(blocks, consumerId)
  if (inScope.some((value) => value.blockId === sourceBlockId)) {
    return sourceBlockId
  }

  const source = findBlockInTree(blocks, sourceBlockId)
  if (source?.kind !== 'expression') return sourceBlockId

  const variableHost = inScope.find((value) => {
    if (value.kind !== 'variable') return false
    const variable = findBlockInTree(blocks, value.blockId)
    return variable?.kind === 'variable' && variable.data.value?.id === sourceBlockId
  })

  return variableHost?.blockId ?? sourceBlockId
}
