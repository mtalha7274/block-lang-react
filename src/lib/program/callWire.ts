import type { BlockNode, ConnectionEdge, ProgramDocument } from '../../types'
import { deriveTypeParams } from './typeParams'

export const CALL_OUT_PORT = 'call-out'
export const CALL_IN_PORT = 'call-in'

type FunctionCallBlock = Extract<BlockNode, { kind: 'functionCall' }>
type FunctionBlock = Extract<BlockNode, { kind: 'function' }>

function visitBlock(block: BlockNode, visit: (block: BlockNode) => void): void {
  visit(block)

  switch (block.kind) {
    case 'main':
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    case 'variable':
      if (block.data.value) visitBlock(block.data.value, visit)
      break
    case 'print':
      if (block.data.value) visitBlock(block.data.value, visit)
      break
    case 'functionCall':
      block.data.arguments.forEach((arg) => {
        if (arg.value) visitBlock(arg.value, visit)
      })
      break
    case 'type':
      block.data.variables.forEach((v) => visitBlock(v, visit))
      break
    case 'expression':
      if (block.data.left) visitBlock(block.data.left, visit)
      if (block.data.right) visitBlock(block.data.right, visit)
      break
    case 'if':
      if (block.data.condition) visitBlock(block.data.condition, visit)
      block.data.trueBranch.forEach((child) => visitBlock(child, visit))
      block.data.falseBranch?.forEach((child) => visitBlock(child, visit))
      break
    case 'for':
      if (block.data.init) visitBlock(block.data.init, visit)
      if (block.data.condition) visitBlock(block.data.condition, visit)
      if (block.data.increment) visitBlock(block.data.increment, visit)
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    case 'while':
      if (block.data.condition) visitBlock(block.data.condition, visit)
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    case 'function':
      if (block.data.signature) visitBlock(block.data.signature, visit)
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    default:
      break
  }
}

export function getTopLevelFunctions(
  blocks: BlockNode[],
): FunctionBlock[] {
  return blocks.filter((b): b is FunctionBlock => b.kind === 'function')
}

export function resolveCallTarget(
  call: FunctionCallBlock,
  topLevelBlocks: BlockNode[],
): FunctionBlock | null {
  const functions = getTopLevelFunctions(topLevelBlocks)

  if (call.data.targetFunctionId) {
    const byId = functions.find((b) => b.id === call.data.targetFunctionId)
    if (byId) return byId
  }

  const byName = functions.find((b) => b.data.name === call.data.functionName)
  return byName ?? null
}

/** Linked function definition id for a function call (wire + fn editor button). */
export function resolveBlockEditorTargetId(
  block: BlockNode,
  topLevelBlocks: BlockNode[],
): string {
  if (block.kind === 'functionCall') {
    const fn = resolveCallTarget(block, topLevelBlocks)
    if (fn) return fn.id
  }
  return block.id
}

export function linkFunctionCallToTarget(
  call: FunctionCallBlock,
  fn: FunctionBlock | null,
  name?: string,
): FunctionCallBlock {
  if (!fn) {
    return {
      ...call,
      data: {
        ...call.data,
        functionName: name ?? call.data.functionName,
        targetFunctionId: undefined,
        arguments: [],
      },
    }
  }

  const params = fn.data.signature ? deriveTypeParams(fn.data.signature) : []

  return {
    ...call,
    data: {
      functionName: fn.data.name,
      targetFunctionId: fn.id,
      returnType: fn.data.returnType,
      arguments: params.map((p) => {
        const existing = call.data.arguments.find((a) => a.name === p.name)
        return {
          portId: p.id,
          name: p.name,
          type: p.type,
          value: existing?.value,
        }
      }),
    },
  }
}

export function findFunctionByName(
  blocks: BlockNode[],
  name: string,
): FunctionBlock | null {
  const fn = blocks.find(
    (b) => b.kind === 'function' && b.data.name === name,
  )
  return fn?.kind === 'function' ? fn : null
}

function isStoredCallWire(edge: ConnectionEdge): boolean {
  if (edge.purpose === 'wire') return true
  return (
    edge.from.portId === 'out' &&
    edge.to.portId === 'in' &&
    edge.purpose !== 'usage'
  )
}

export function deriveCallWireEdges(blocks: BlockNode[]): ConnectionEdge[] {
  const edges: ConnectionEdge[] = []

  for (const root of blocks) {
    visitBlock(root, (block) => {
      if (block.kind !== 'functionCall') return

      const fn = resolveCallTarget(block, blocks)
      if (!fn) return

      edges.push({
        id: `call-wire-${block.id}-${fn.id}`,
        from: { blockId: block.id, portId: CALL_OUT_PORT },
        to: { blockId: fn.id, portId: CALL_IN_PORT },
        type: block.data.returnType,
        valid: true,
        purpose: 'wire',
      })
    })
  }

  return edges
}

export function mergeCanvasConnections(program: ProgramDocument): ConnectionEdge[] {
  const stored = program.connections.filter((c) => !isStoredCallWire(c))
  return [...stored, ...deriveCallWireEdges(program.blocks)]
}
