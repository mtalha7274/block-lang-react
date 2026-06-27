import type { BlockNode, FunctionParameter } from '../../types'
import { deriveTypeParams } from './typeParams'
import { linkFunctionCallToTarget } from './callWire'
import { findBlockInTree, mapBlocksInTree } from './blockTree'

type FunctionBlock = Extract<BlockNode, { kind: 'function' }>
type FunctionCallBlock = Extract<BlockNode, { kind: 'functionCall' }>

const PARAM_SOURCE_PREFIX = 'param:'

export function functionParamSourceId(fnId: string, paramId: string): string {
  return `${PARAM_SOURCE_PREFIX}${fnId}:${paramId}`
}

export function parseFunctionParamSourceId(
  sourceId: string,
): { fnId: string; paramId: string } | null {
  if (!sourceId.startsWith(PARAM_SOURCE_PREFIX)) return null
  const rest = sourceId.slice(PARAM_SOURCE_PREFIX.length)
  const colon = rest.indexOf(':')
  if (colon === -1) return null
  return { fnId: rest.slice(0, colon), paramId: rest.slice(colon + 1) }
}

export function isFunctionParamSourceId(sourceId: string): boolean {
  return parseFunctionParamSourceId(sourceId) !== null
}

export function findFunctionParamBySourceId(
  blocks: BlockNode[],
  sourceId: string,
): { fn: FunctionBlock; param: FunctionParameter } | null {
  const parsed = parseFunctionParamSourceId(sourceId)
  if (!parsed) return null

  const fn = findBlockInTree(blocks, parsed.fnId)
  if (!fn || fn.kind !== 'function') return null

  const param = deriveFunctionParams(fn).find((p) => p.id === parsed.paramId)
  if (!param) return null

  return { fn, param }
}

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
