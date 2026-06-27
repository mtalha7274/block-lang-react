import type { BlockNode, FunctionParameter, ProgramDocument } from '../../types'
import { deriveFunctionParams } from './functionParams'

export interface ResolvedCallArg {
  name: string
  type: import('../../types').ValueType
  value?: BlockNode
}

export interface ResolvedFunctionCall {
  functionBlock: Extract<BlockNode, { kind: 'function' }>
  args: ResolvedCallArg[]
}

export function resolveFunctionCall(
  call: Extract<BlockNode, { kind: 'functionCall' }>,
  doc: ProgramDocument,
): ResolvedFunctionCall | null {
  const fn =
    (call.data.targetFunctionId
      ? doc.blocks.find(
          (b) => b.id === call.data.targetFunctionId && b.kind === 'function',
        )
      : doc.blocks.find(
          (b) => b.kind === 'function' && b.data.name === call.data.functionName,
        )) ?? null

  if (!fn || fn.kind !== 'function') return null

  const signatureParams: FunctionParameter[] = deriveFunctionParams(fn)

  if (call.data.arguments.length > 0) {
    return {
      functionBlock: fn,
      args: call.data.arguments.map((a) => ({
        name: a.name,
        type: a.type,
        value: a.value,
      })),
    }
  }

  return {
    functionBlock: fn,
    args: signatureParams.map((p) => ({
      name: p.name,
      type: p.type,
      value: {
        id: `ref-${p.name}`,
        kind: 'variable' as const,
        data: { valueType: p.type, name: p.name },
      },
    })),
  }
}
