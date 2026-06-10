import type { BlockNode, ValueType } from '../../types'
import { findBlockInTree, findBlockParent } from './blockTree'

export interface InScopeValue {
  blockId: string
  label: string
  valueType: ValueType
  kind: BlockNode['kind']
}

export function getValueTypeFromSource(block: BlockNode): ValueType | null {
  switch (block.kind) {
    case 'variable':
      return block.data.valueType
    case 'expression':
      return block.data.resultType
    case 'functionCall':
      return block.data.returnType
    default:
      return null
  }
}

export function getLabelFromSource(block: BlockNode): string | null {
  switch (block.kind) {
    case 'variable':
      return block.data.name
    case 'expression':
      return block.data.resultName
    case 'functionCall':
      return `${block.data.functionName}(…)`
    default:
      return null
  }
}

export function isValueSourceBlock(block: BlockNode): boolean {
  return getValueTypeFromSource(block) !== null
}

export function collectInScopeValues(
  statements: BlockNode[],
  beforeIndex: number,
): InScopeValue[] {
  const result: InScopeValue[] = []
  for (let i = 0; i < beforeIndex && i < statements.length; i += 1) {
    const stmt = statements[i]
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
