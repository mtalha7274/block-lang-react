import type { BlockNode, FunctionParameter } from '../../types'
import { deriveTypeParams } from './typeParams'
import { linkFunctionCallToTarget } from './callWire'
import { mapBlocksInTree } from './blockTree'

type FunctionBlock = Extract<BlockNode, { kind: 'function' }>
type FunctionCallBlock = Extract<BlockNode, { kind: 'functionCall' }>

export function deriveFunctionParams(fn: FunctionBlock): FunctionParameter[] {
  const inlineParams = fn.data.params ?? []
  if (inlineParams.length > 0) {
    return inlineParams.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
    }))
  }

  if (fn.data.signature) {
    return deriveTypeParams(fn.data.signature)
  }

  return []
}

export function formatFunctionParamsSummary(fn: FunctionBlock): string {
  const params = deriveFunctionParams(fn)
  if (params.length === 0) return 'no params'
  return params.map((p) => `${p.type} ${p.name}`).join(', ')
}

export function syncCallsToFunction(
  blocks: BlockNode[],
  fnId: string,
): BlockNode[] {
  const fn = blocks.find((b): b is FunctionBlock => b.id === fnId && b.kind === 'function')
  if (!fn) return blocks

  return mapBlocksInTree(blocks, (block): BlockNode => {
    if (block.kind !== 'functionCall') return block
    if (block.data.targetFunctionId !== fnId) return block
    return linkFunctionCallToTarget(block as FunctionCallBlock, fn)
  })
}
