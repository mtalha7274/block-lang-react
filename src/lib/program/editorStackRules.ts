import type { BlockNode, StatementBodyRegion } from '../../types'
import { collectSubtreeBlockIds } from './collectDescendantBlockIds'
import { findBlockInTree, findBlockParent } from './blockTree'
import { resolveBlockEditorTargetId } from './callWire'

function getStatementsForRegion(
  parentBlock: BlockNode,
  region: StatementBodyRegion,
): BlockNode[] {
  switch (parentBlock.kind) {
    case 'main':
      return region === 'main' ? parentBlock.data.body : []
    case 'function':
      return region === 'function' ? parentBlock.data.body : []
    case 'if':
      if (region === 'if-true') return parentBlock.data.trueBranch
      if (region === 'if-false') return parentBlock.data.falseBranch ?? []
      return []
    case 'for':
      return region === 'for' ? parentBlock.data.body : []
    case 'while':
      return region === 'while' ? parentBlock.data.body : []
    default:
      return []
  }
}

/** Direct sibling statements in the same statement-body list (same nesting level). */
export function getSiblingStatementBlockIds(
  blocks: BlockNode[],
  blockId: string,
): string[] {
  const parent = findBlockParent(blocks, blockId)
  if (!parent || parent.target.kind !== 'statement-body') return []

  const parentBlock = findBlockInTree(blocks, parent.parentBlockId)
  if (!parentBlock) return []

  const statements = getStatementsForRegion(parentBlock, parent.target.region)
  return statements.filter((stmt) => stmt.id !== blockId).map((stmt) => stmt.id)
}

/**
 * Editor panel ids to close when opening a block editor so that no two
 * same-level statement siblings keep their editors open at once.
 */
export function getSiblingEditorIdsToClose(
  blocks: BlockNode[],
  openingBlockId: string,
): Set<string> {
  const toClose = new Set<string>()
  const openingBlock = findBlockInTree(blocks, openingBlockId)
  const openingEditorId = openingBlock
    ? resolveBlockEditorTargetId(openingBlock, blocks)
    : openingBlockId
  const siblings = getSiblingStatementBlockIds(blocks, openingBlockId)

  for (const siblingId of siblings) {
    const sibling = findBlockInTree(blocks, siblingId)
    if (!sibling) continue

    toClose.add(resolveBlockEditorTargetId(sibling, blocks))

    for (const descId of collectSubtreeBlockIds(sibling)) {
      const desc = findBlockInTree(blocks, descId)
      if (desc) {
        toClose.add(resolveBlockEditorTargetId(desc, blocks))
      }
    }
  }

  toClose.delete(openingEditorId)
  return toClose
}
