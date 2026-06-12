import type { BlockNode, SlotTarget } from '../../types'
import { findBlockInTree, findBlockParent } from './blockTree'

type FunctionBlock = Extract<BlockNode, { kind: 'function' }>

export function findEnclosingFunction(
  blocks: BlockNode[],
  blockId: string,
): FunctionBlock | null {
  let currentId = blockId
  while (true) {
    const parent = findBlockParent(blocks, currentId)
    if (!parent) return null
    const parentBlock = findBlockInTree(blocks, parent.parentBlockId)
    if (parentBlock?.kind === 'function') return parentBlock
    currentId = parent.parentBlockId
  }
}

export function isInsideFunctionBody(blocks: BlockNode[], blockId: string): boolean {
  return findEnclosingFunction(blocks, blockId) !== null
}

export function isStatementBodyInsideFunction(
  blocks: BlockNode[],
  target: Extract<SlotTarget, { kind: 'statement-body' }>,
): boolean {
  const parent = findBlockInTree(blocks, target.parentBlockId)
  if (!parent) return false
  if (parent.kind === 'function' && target.region === 'function') return true
  return findEnclosingFunction(blocks, target.parentBlockId) !== null
}
