import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { findFunctionByName } from './callWire'

type FunctionBlock = Extract<BlockNode, { kind: 'function' }>
type FunctionCallBlock = Extract<BlockNode, { kind: 'functionCall' }>

export interface EnsureFunctionResult {
  blocks: BlockNode[]
  fn: FunctionBlock
  created: boolean
}

export interface EnsureFunctionOptions {
  /**
   * When true (e.g. user renames a call), link to an existing top-level function
   * with the same name. When false (fresh palette drop), always create a new
   * function and pick a unique name on collision.
   */
  linkToExistingByName?: boolean
}

function uniqueFunctionName(blocks: BlockNode[], baseName: string): string {
  if (!findFunctionByName(blocks, baseName)) return baseName
  let suffix = 2
  while (findFunctionByName(blocks, `${baseName}${suffix}`)) {
    suffix += 1
  }
  return `${baseName}${suffix}`
}

export function ensureFunctionForCall(
  blocks: BlockNode[],
  call: FunctionCallBlock,
  options: EnsureFunctionOptions = {},
): EnsureFunctionResult {
  const linkToExisting = options.linkToExistingByName ?? false

  if (linkToExisting) {
    const existing = findFunctionByName(blocks, call.data.functionName)
    if (existing) {
      return { blocks, fn: existing, created: false }
    }
  }

  const name = linkToExisting
    ? call.data.functionName
    : uniqueFunctionName(blocks, call.data.functionName)

  const stub = createBlockFromKind('function') as FunctionBlock
  const fn: FunctionBlock = {
    ...stub,
    data: {
      ...stub.data,
      name,
      returnType: call.data.returnType === 'void' ? 'number' : call.data.returnType,
      body: [],
    },
  }

  return {
    blocks: [...blocks, fn],
    fn,
    created: true,
  }
}
