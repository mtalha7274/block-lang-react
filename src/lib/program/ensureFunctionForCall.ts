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

export function ensureFunctionForCall(
  blocks: BlockNode[],
  call: FunctionCallBlock,
): EnsureFunctionResult {
  const existing = findFunctionByName(blocks, call.data.functionName)
  if (existing) {
    return { blocks, fn: existing, created: false }
  }

  const stub = createBlockFromKind('function') as FunctionBlock
  const fn: FunctionBlock = {
    ...stub,
    data: {
      ...stub.data,
      name: call.data.functionName,
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
