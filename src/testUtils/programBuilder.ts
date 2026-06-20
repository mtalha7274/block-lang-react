import type {
  BlockId,
  BlockNode,
  FunctionParameter,
  OperatorSymbol,
  ProgramDocument,
  ValueType,
} from '../types'
import { operators } from '../constants/operators'

let globalIdCounter = 0

export function resetProgramBuilderIds(): void {
  globalIdCounter = 0
}

function nextId(prefix: string): BlockId {
  globalIdCounter += 1
  return `${prefix}-${globalIdCounter}`
}

export function num(value: number, id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('prim'),
    kind: 'primitive',
    data: { valueType: 'number', value },
  }
}

export function str(value: string, id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('prim'),
    kind: 'primitive',
    data: { valueType: 'string', value: `"${value}"` },
  }
}

export function bool(value: boolean, id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('prim'),
    kind: 'primitive',
    data: { valueType: 'boolean', value },
  }
}

export function varRef(name: string, valueType: ValueType = 'number', id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('ref'),
    kind: 'variable',
    data: { valueType, name },
  }
}

export function variable(
  name: string,
  value: BlockNode,
  valueType: ValueType = 'number',
  id?: BlockId,
): BlockNode {
  return {
    id: id ?? nextId('var'),
    kind: 'variable',
    data: { valueType, name, value },
  }
}

export function expr(
  operator: OperatorSymbol,
  left: BlockNode,
  right: BlockNode,
  resultName = '',
  resultType?: ValueType,
  id?: BlockId,
): BlockNode {
  const entry = operators.find((op) => op.symbol === operator)
  const resolvedType = resultType ?? entry?.resultType ?? 'number'
  return {
    id: id ?? nextId('expr'),
    kind: 'expression',
    data: { operator, left, right, resultName, resultType: resolvedType },
  }
}

/** Reassign an existing variable (emulation overwrites; same as a new Variable block). */
export function reassign(name: string, value: BlockNode, valueType: ValueType = 'number', id?: BlockId): BlockNode {
  return variable(name, value, valueType, id)
}

export function print(value: BlockNode, id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('print'),
    kind: 'print',
    data: { value },
  }
}

export function ret(value?: BlockNode, id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('return'),
    kind: 'return',
    data: value ? { value } : {},
  }
}

export function ifBlock(
  condition: BlockNode,
  trueBranch: BlockNode[],
  falseBranch: BlockNode[] = [],
  id?: BlockId,
): BlockNode {
  return {
    id: id ?? nextId('if'),
    kind: 'if',
    data: { condition, trueBranch, falseBranch },
  }
}

export function forLoop(
  init: BlockNode | undefined,
  condition: BlockNode,
  increment: BlockNode | undefined,
  body: BlockNode[],
  id?: BlockId,
): BlockNode {
  return {
    id: id ?? nextId('for'),
    kind: 'for',
    data: { init, condition, increment, body },
  }
}

export function whileLoop(condition: BlockNode, body: BlockNode[], id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('while'),
    kind: 'while',
    data: { condition, body },
  }
}

export function typeSignature(params: FunctionParameter[], id?: BlockId): BlockNode {
  return {
    id: id ?? nextId('type'),
    kind: 'type',
    data: {
      rows: params.map((p) => ({ id: nextId('row'), name: p.name, type: p.type })),
      variables: [],
    },
  }
}

export function func(
  name: string,
  params: FunctionParameter[],
  returnType: ValueType,
  body: BlockNode[],
  id?: BlockId,
): BlockNode {
  const funcId = id ?? nextId('func')
  return {
    id: funcId,
    kind: 'function',
    data: {
      name,
      returnType,
      signature: typeSignature(params),
      body,
    },
  }
}

export function call(
  functionName: string,
  targetFunctionId: BlockId,
  args: { name: string; type: ValueType; value: BlockNode }[],
  returnType: ValueType = 'number',
  id?: BlockId,
): BlockNode {
  return {
    id: id ?? nextId('call'),
    kind: 'functionCall',
    data: {
      functionName,
      returnType,
      targetFunctionId,
      arguments: args.map((a) => ({
        portId: nextId('arg'),
        name: a.name,
        type: a.type,
        value: a.value,
      })),
    },
  }
}

export function main(body: BlockNode[], id = 'main'): BlockNode {
  return {
    id,
    kind: 'main',
    data: { body },
  }
}

export function program(mainBlock: BlockNode, extraBlocks: BlockNode[] = []): ProgramDocument {
  const blocks = [mainBlock, ...extraBlocks]
  return {
    blocks,
    placements: blocks.map((b, i) => ({ blockId: b.id, x: 40 + i * 40, y: 40 })),
    connections: [],
  }
}

export function getVarValue(result: import('../lib/emulate/types').EmulationResult, name: string): string | undefined {
  return result.variables.find((v) => v.name === name)?.value
}

export function getVarNumber(result: import('../lib/emulate/types').EmulationResult, name: string): number {
  const raw = getVarValue(result, name)
  if (raw === undefined) throw new Error(`Variable ${name} not found`)
  return Number(raw)
}
