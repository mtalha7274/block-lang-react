import type { BlockNode, ProgramDocument, StatementBodyRegion } from '../../types'

export function findTopLevelBlock(
  program: ProgramDocument,
  blockId: string,
): BlockNode | undefined {
  return program.blocks.find((b) => b.id === blockId)
}

export function findBlockInTree(
  blocks: BlockNode[],
  blockId: string,
): BlockNode | undefined {
  for (const block of blocks) {
    if (block.id === blockId) return block

    if (block.kind === 'main') {
      const found = findBlockInTree(block.data.body, blockId)
      if (found) return found
    }
    if (block.kind === 'variable' && block.data.value) {
      if (block.data.value.id === blockId) return block.data.value
      const nested = findBlockInTree([block.data.value], blockId)
      if (nested) return nested
    }
    if (block.kind === 'print' && block.data.value) {
      if (block.data.value.id === blockId) return block.data.value
      const nested = findBlockInTree([block.data.value], blockId)
      if (nested) return nested
    }
    if (block.kind === 'return' && block.data.value) {
      if (block.data.value.id === blockId) return block.data.value
      const nested = findBlockInTree([block.data.value], blockId)
      if (nested) return nested
    }
    if (block.kind === 'function') {
      if (block.data.signature?.id === blockId) return block.data.signature
      if (block.data.signature) {
        const inSig = findBlockInTree([block.data.signature], blockId)
        if (inSig) return inSig
      }
      const found = findBlockInTree(block.data.body, blockId)
      if (found) return found
    }
    if (block.kind === 'functionCall') {
      for (const arg of block.data.arguments) {
        if (arg.value?.id === blockId) return arg.value
        if (arg.value) {
          const nested = findBlockInTree([arg.value], blockId)
          if (nested) return nested
        }
      }
    }
    if (block.kind === 'type') {
      for (const v of block.data.variables) {
        if (v.id === blockId) return v
        const nested = findBlockInTree([v], blockId)
        if (nested) return nested
      }
    }
    if (block.kind === 'if') {
      if (block.data.condition) {
        if (block.data.condition.id === blockId) return block.data.condition
        const inCond = findBlockInTree([block.data.condition], blockId)
        if (inCond) return inCond
      }
      const inTrue = findBlockInTree(block.data.trueBranch, blockId)
      if (inTrue) return inTrue
      if (block.data.falseBranch) {
        const inFalse = findBlockInTree(block.data.falseBranch, blockId)
        if (inFalse) return inFalse
      }
    }
    if (block.kind === 'expression') {
      if (block.data.left) {
        if (block.data.left.id === blockId) return block.data.left
        const inLeft = findBlockInTree([block.data.left], blockId)
        if (inLeft) return inLeft
      }
      if (block.data.right) {
        if (block.data.right.id === blockId) return block.data.right
        const inRight = findBlockInTree([block.data.right], blockId)
        if (inRight) return inRight
      }
    }
    if (block.kind === 'for') {
      if (block.data.init) {
        if (block.data.init.id === blockId) return block.data.init
        const inInit = findBlockInTree([block.data.init], blockId)
        if (inInit) return inInit
      }
      if (block.data.condition) {
        if (block.data.condition.id === blockId) return block.data.condition
        const inCond = findBlockInTree([block.data.condition], blockId)
        if (inCond) return inCond
      }
      if (block.data.increment) {
        if (block.data.increment.id === blockId) return block.data.increment
        const inInc = findBlockInTree([block.data.increment], blockId)
        if (inInc) return inInc
      }
      const found = findBlockInTree(block.data.body, blockId)
      if (found) return found
    }
    if (block.kind === 'while') {
      if (block.data.condition) {
        if (block.data.condition.id === blockId) return block.data.condition
        const inCond = findBlockInTree([block.data.condition], blockId)
        if (inCond) return inCond
      }
      const found = findBlockInTree(block.data.body, blockId)
      if (found) return found
    }
  }
  return undefined
}

export function isValidStatementBodyParent(
  block: BlockNode,
  region: StatementBodyRegion,
): boolean {
  switch (region) {
    case 'main':
      return block.kind === 'main'
    case 'function':
      return block.kind === 'function'
    case 'if-true':
    case 'if-false':
      return block.kind === 'if'
    case 'for':
      return block.kind === 'for'
    case 'while':
      return block.kind === 'while'
    default:
      return false
  }
}

export function updateBlockInTree(
  blocks: BlockNode[],
  blockId: string,
  updater: (block: BlockNode) => BlockNode,
): BlockNode[] {
  return blocks.map((block) => {
    if (block.id === blockId) return updater(block)

    switch (block.kind) {
      case 'main':
        return {
          ...block,
          data: {
            body: updateBlockInTree(block.data.body, blockId, updater),
          },
        }
      case 'variable':
        if (block.data.value?.id === blockId) {
          return {
            ...block,
            data: {
              ...block.data,
              value: updater(block.data.value),
            },
          }
        }
        if (block.data.value) {
          return {
            ...block,
            data: {
              ...block.data,
              value: updateBlockInTree([block.data.value], blockId, updater)[0],
            },
          }
        }
        return block
      case 'print':
        if (block.data.value?.id === blockId) {
          return {
            ...block,
            data: { ...block.data, value: updater(block.data.value) },
          }
        }
        if (block.data.value) {
          return {
            ...block,
            data: {
              ...block.data,
              value: updateBlockInTree([block.data.value], blockId, updater)[0],
            },
          }
        }
        return block
      case 'return':
        if (block.data.value?.id === blockId) {
          return {
            ...block,
            data: { ...block.data, value: updater(block.data.value) },
          }
        }
        if (block.data.value) {
          return {
            ...block,
            data: {
              ...block.data,
              value: updateBlockInTree([block.data.value], blockId, updater)[0],
            },
          }
        }
        return block
      case 'functionCall':
        return {
          ...block,
          data: {
            ...block.data,
            arguments: block.data.arguments.map((arg) => {
              if (arg.value?.id === blockId) {
                return { ...arg, value: updater(arg.value) }
              }
              if (arg.value) {
                return {
                  ...arg,
                  value: updateBlockInTree([arg.value], blockId, updater)[0],
                }
              }
              return arg
            }),
          },
        }
      case 'type':
        return {
          ...block,
          data: {
            ...block.data,
            variables: block.data.variables.map((v) =>
              v.id === blockId ? updater(v) : v,
            ),
          },
        }
      case 'if':
        if (block.data.condition?.id === blockId) {
          return {
            ...block,
            data: {
              ...block.data,
              condition: updater(block.data.condition),
            },
          }
        }
        return {
          ...block,
          data: {
            ...block.data,
            condition: block.data.condition
              ? updateBlockInTree([block.data.condition], blockId, updater)[0]
              : undefined,
            trueBranch: updateBlockInTree(block.data.trueBranch, blockId, updater),
            falseBranch: block.data.falseBranch
              ? updateBlockInTree(block.data.falseBranch, blockId, updater)
              : undefined,
          },
        }
      case 'for':
        return {
          ...block,
          data: {
            ...block.data,
            body: updateBlockInTree(block.data.body, blockId, updater),
          },
        }
      case 'while':
        return {
          ...block,
          data: {
            ...block.data,
            body: updateBlockInTree(block.data.body, blockId, updater),
          },
        }
      case 'function':
        if (block.data.signature?.id === blockId) {
          return {
            ...block,
            data: {
              ...block.data,
              signature: updater(block.data.signature),
            },
          }
        }
        return {
          ...block,
          data: {
            ...block.data,
            signature: block.data.signature
              ? updateBlockInTree([block.data.signature], blockId, updater)[0]
              : undefined,
            body: updateBlockInTree(block.data.body, blockId, updater),
          },
        }
      default:
        return block
    }
  })
}

export function mapBlocksInTree(
  blocks: BlockNode[],
  mapper: (block: BlockNode) => BlockNode,
): BlockNode[] {
  return blocks.map((block) => mapBlockNode(block, mapper))
}

function mapBlockNode(
  block: BlockNode,
  mapper: (block: BlockNode) => BlockNode,
): BlockNode {
  const mapped = mapper(block)

  switch (mapped.kind) {
    case 'main':
      return {
        ...mapped,
        data: {
          body: mapBlocksInTree(mapped.data.body, mapper),
        },
      }
    case 'variable':
      if (mapped.data.value) {
        return {
          ...mapped,
          data: {
            ...mapped.data,
            value: mapBlockNode(mapped.data.value, mapper),
          },
        }
      }
      return mapped
    case 'print':
      if (mapped.data.value) {
        return {
          ...mapped,
          data: {
            ...mapped.data,
            value: mapBlockNode(mapped.data.value, mapper),
          },
        }
      }
      return mapped
    case 'return':
      if (mapped.data.value) {
        return {
          ...mapped,
          data: {
            ...mapped.data,
            value: mapBlockNode(mapped.data.value, mapper),
          },
        }
      }
      return mapped
    case 'functionCall':
      return {
        ...mapped,
        data: {
          ...mapped.data,
          arguments: mapped.data.arguments.map((arg) =>
            arg.value
              ? { ...arg, value: mapBlockNode(arg.value, mapper) }
              : arg,
          ),
        },
      }
    case 'type':
      return {
        ...mapped,
        data: {
          ...mapped.data,
          variables: mapped.data.variables.map((v) => mapBlockNode(v, mapper)),
        },
      }
    case 'if':
      return {
        ...mapped,
        data: {
          ...mapped.data,
          condition: mapped.data.condition
            ? mapBlockNode(mapped.data.condition, mapper)
            : undefined,
          trueBranch: mapBlocksInTree(mapped.data.trueBranch, mapper),
          falseBranch: mapped.data.falseBranch
            ? mapBlocksInTree(mapped.data.falseBranch, mapper)
            : undefined,
        },
      }
    case 'for':
      return {
        ...mapped,
        data: {
          ...mapped.data,
          body: mapBlocksInTree(mapped.data.body, mapper),
        },
      }
    case 'while':
      return {
        ...mapped,
        data: {
          ...mapped.data,
          body: mapBlocksInTree(mapped.data.body, mapper),
        },
      }
    case 'function':
      return {
        ...mapped,
        data: {
          ...mapped.data,
          signature: mapped.data.signature
            ? mapBlockNode(mapped.data.signature, mapper)
            : undefined,
          body: mapBlocksInTree(mapped.data.body, mapper),
        },
      }
    default:
      return mapped
  }
}

export function updateNestedVariableValue(
  blocks: BlockNode[],
  parentId: string,
  value: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, parentId, (block) => {
    if (block.kind !== 'variable') return block
    return { ...block, data: { ...block.data, value } }
  })
}

export function appendToStatementBody(
  blocks: BlockNode[],
  parentId: string,
  region: StatementBodyRegion,
  statement: BlockNode,
): BlockNode[] {
  return updateBlockInTree(blocks, parentId, (block) => {
    switch (region) {
      case 'main':
        if (block.kind !== 'main') return block
        return { ...block, data: { body: [...block.data.body, statement] } }
      case 'function':
        if (block.kind !== 'function') return block
        return {
          ...block,
          data: { ...block.data, body: [...block.data.body, statement] },
        }
      case 'if-true':
        if (block.kind !== 'if') return block
        return {
          ...block,
          data: {
            ...block.data,
            trueBranch: [...block.data.trueBranch, statement],
          },
        }
      case 'if-false':
        if (block.kind !== 'if') return block
        return {
          ...block,
          data: {
            ...block.data,
            falseBranch: [...(block.data.falseBranch ?? []), statement],
          },
        }
      case 'for':
        if (block.kind !== 'for') return block
        return {
          ...block,
          data: { ...block.data, body: [...block.data.body, statement] },
        }
      case 'while':
        if (block.kind !== 'while') return block
        return {
          ...block,
          data: { ...block.data, body: [...block.data.body, statement] },
        }
      default:
        return block
    }
  })
}

export function appendToTypeVariables(
  blocks: BlockNode[],
  typeId: string,
  variable: BlockNode,
): BlockNode[] {
  return updateBlockInTree(blocks, typeId, (block) => {
    if (block.kind !== 'type') return block
    return {
      ...block,
      data: {
        ...block.data,
        variables: [...block.data.variables, variable],
      },
    }
  })
}

export function updateFunctionSignature(
  blocks: BlockNode[],
  functionId: string,
  signature: BlockNode | undefined,
): BlockNode[] {
  return blocks.map((block) => {
    if (block.id === functionId && block.kind === 'function') {
      return {
        ...block,
        data: { ...block.data, signature },
      }
    }
    return block
  })
}

export function updateCallArgValue(
  blocks: BlockNode[],
  callId: string,
  argPortId: string,
  value: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, callId, (block) => {
    if (block.kind !== 'functionCall') return block
    return {
      ...block,
      data: {
        ...block.data,
        arguments: block.data.arguments.map((arg) =>
          arg.portId === argPortId ? { ...arg, value } : arg,
        ),
      },
    }
  })
}

export function updatePrintValue(
  blocks: BlockNode[],
  printId: string,
  value: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, printId, (block) => {
    if (block.kind !== 'print') return block
    return { ...block, data: { ...block.data, value } }
  })
}

export function updateReturnValue(
  blocks: BlockNode[],
  returnId: string,
  value: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, returnId, (block) => {
    if (block.kind !== 'return') return block
    return { ...block, data: { ...block.data, value } }
  })
}

export function updateIfCondition(
  blocks: BlockNode[],
  ifId: string,
  condition: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, ifId, (block) => {
    if (block.kind !== 'if') return block
    return { ...block, data: { ...block.data, condition } }
  })
}

export function updateExpressionOperand(
  blocks: BlockNode[],
  exprId: string,
  side: 'left' | 'right',
  value: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, exprId, (block) => {
    if (block.kind !== 'expression') return block
    return {
      ...block,
      data: {
        ...block.data,
        [side]: value,
      },
    }
  })
}

export function updateForInit(
  blocks: BlockNode[],
  forId: string,
  init: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, forId, (block) => {
    if (block.kind !== 'for') return block
    return { ...block, data: { ...block.data, init } }
  })
}

export function updateForCondition(
  blocks: BlockNode[],
  forId: string,
  condition: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, forId, (block) => {
    if (block.kind !== 'for') return block
    return { ...block, data: { ...block.data, condition } }
  })
}

export function updateForIncrement(
  blocks: BlockNode[],
  forId: string,
  increment: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, forId, (block) => {
    if (block.kind !== 'for') return block
    return { ...block, data: { ...block.data, increment } }
  })
}

export function updateWhileCondition(
  blocks: BlockNode[],
  whileId: string,
  condition: BlockNode | undefined,
): BlockNode[] {
  return updateBlockInTree(blocks, whileId, (block) => {
    if (block.kind !== 'while') return block
    return { ...block, data: { ...block.data, condition } }
  })
}

export interface BlockParentRef {
  parentBlockId: string
  target: import('../../types').SlotTarget
}

export function findBlockParent(
  blocks: BlockNode[],
  blockId: string,
): BlockParentRef | null {
  for (const block of blocks) {
    if (block.kind === 'main') {
      if (block.data.body.some((s) => s.id === blockId)) {
        return {
          parentBlockId: block.id,
          target: { kind: 'statement-body', parentBlockId: block.id, region: 'main' },
        }
      }
      const nested = findBlockParent(block.data.body, blockId)
      if (nested) return nested
    }
    if (block.kind === 'variable') {
      if (block.data.value?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'variable-value', parentBlockId: block.id },
        }
      }
      if (block.data.value) {
        const nested = findBlockParent([block.data.value], blockId)
        if (nested) return nested
      }
    }
    if (block.kind === 'print') {
      if (block.data.value?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'print-value', parentBlockId: block.id },
        }
      }
      if (block.data.value) {
        const nested = findBlockParent([block.data.value], blockId)
        if (nested) return nested
      }
    }
    if (block.kind === 'return') {
      if (block.data.value?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'return-value', parentBlockId: block.id },
        }
      }
      if (block.data.value) {
        const nested = findBlockParent([block.data.value], blockId)
        if (nested) return nested
      }
    }
    if (block.kind === 'function') {
      if (block.data.signature?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'function-signature', parentBlockId: block.id },
        }
      }
      if (block.data.body.some((s) => s.id === blockId)) {
        return {
          parentBlockId: block.id,
          target: { kind: 'statement-body', parentBlockId: block.id, region: 'function' },
        }
      }
      if (block.data.signature) {
        const nested = findBlockParent([block.data.signature], blockId)
        if (nested) return nested
      }
      const nested = findBlockParent(block.data.body, blockId)
      if (nested) return nested
    }
    if (block.kind === 'functionCall') {
      for (const arg of block.data.arguments) {
        if (arg.value?.id === blockId) {
          return {
            parentBlockId: block.id,
            target: {
              kind: 'call-arg',
              parentBlockId: block.id,
              argPortId: arg.portId,
            },
          }
        }
        if (arg.value) {
          const nested = findBlockParent([arg.value], blockId)
          if (nested) return nested
        }
      }
    }
    if (block.kind === 'type') {
      if (block.data.variables.some((v) => v.id === blockId)) {
        return {
          parentBlockId: block.id,
          target: { kind: 'type-variable', parentBlockId: block.id },
        }
      }
    }
    if (block.kind === 'if') {
      if (block.data.condition?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'if-condition', parentBlockId: block.id },
        }
      }
      if (block.data.condition) {
        const nested = findBlockParent([block.data.condition], blockId)
        if (nested) return nested
      }
      if (block.data.trueBranch.some((s) => s.id === blockId)) {
        return {
          parentBlockId: block.id,
          target: { kind: 'statement-body', parentBlockId: block.id, region: 'if-true' },
        }
      }
      if (block.data.falseBranch?.some((s) => s.id === blockId)) {
        return {
          parentBlockId: block.id,
          target: { kind: 'statement-body', parentBlockId: block.id, region: 'if-false' },
        }
      }
      const inTrue = findBlockParent(block.data.trueBranch, blockId)
      if (inTrue) return inTrue
      if (block.data.falseBranch) {
        const inFalse = findBlockParent(block.data.falseBranch, blockId)
        if (inFalse) return inFalse
      }
    }
    if (block.kind === 'expression') {
      if (block.data.left?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: {
            kind: 'expression-operand',
            parentBlockId: block.id,
            side: 'left',
          },
        }
      }
      if (block.data.right?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: {
            kind: 'expression-operand',
            parentBlockId: block.id,
            side: 'right',
          },
        }
      }
      if (block.data.left) {
        const nested = findBlockParent([block.data.left], blockId)
        if (nested) return nested
      }
      if (block.data.right) {
        const nested = findBlockParent([block.data.right], blockId)
        if (nested) return nested
      }
    }
    if (block.kind === 'for') {
      if (block.data.init?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'for-init', parentBlockId: block.id },
        }
      }
      if (block.data.condition?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'for-condition', parentBlockId: block.id },
        }
      }
      if (block.data.increment?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'for-increment', parentBlockId: block.id },
        }
      }
      if (block.data.init) {
        const nested = findBlockParent([block.data.init], blockId)
        if (nested) return nested
      }
      if (block.data.condition) {
        const nested = findBlockParent([block.data.condition], blockId)
        if (nested) return nested
      }
      if (block.data.increment) {
        const nested = findBlockParent([block.data.increment], blockId)
        if (nested) return nested
      }
      if (block.data.body.some((s) => s.id === blockId)) {
        return {
          parentBlockId: block.id,
          target: { kind: 'statement-body', parentBlockId: block.id, region: 'for' },
        }
      }
      const nested = findBlockParent(block.data.body, blockId)
      if (nested) return nested
    }
    if (block.kind === 'while') {
      if (block.data.condition?.id === blockId) {
        return {
          parentBlockId: block.id,
          target: { kind: 'while-condition', parentBlockId: block.id },
        }
      }
      if (block.data.condition) {
        const nested = findBlockParent([block.data.condition], blockId)
        if (nested) return nested
      }
      if (block.data.body.some((s) => s.id === blockId)) {
        return {
          parentBlockId: block.id,
          target: { kind: 'statement-body', parentBlockId: block.id, region: 'while' },
        }
      }
      const nested = findBlockParent(block.data.body, blockId)
      if (nested) return nested
    }
  }
  return null
}

export function removeFromStatementBody(
  blocks: BlockNode[],
  parentId: string,
  region: StatementBodyRegion,
  childId: string,
): BlockNode[] {
  return updateBlockInTree(blocks, parentId, (block) => {
    switch (region) {
      case 'main':
        if (block.kind !== 'main') return block
        return {
          ...block,
          data: { body: block.data.body.filter((s) => s.id !== childId) },
        }
      case 'function':
        if (block.kind !== 'function') return block
        return {
          ...block,
          data: {
            ...block.data,
            body: block.data.body.filter((s) => s.id !== childId),
          },
        }
      case 'if-true':
        if (block.kind !== 'if') return block
        return {
          ...block,
          data: {
            ...block.data,
            trueBranch: block.data.trueBranch.filter((s) => s.id !== childId),
          },
        }
      case 'if-false':
        if (block.kind !== 'if') return block
        return {
          ...block,
          data: {
            ...block.data,
            falseBranch: block.data.falseBranch?.filter((s) => s.id !== childId),
          },
        }
      case 'for':
        if (block.kind !== 'for') return block
        return {
          ...block,
          data: { ...block.data, body: block.data.body.filter((s) => s.id !== childId) },
        }
      case 'while':
        if (block.kind !== 'while') return block
        return {
          ...block,
          data: { ...block.data, body: block.data.body.filter((s) => s.id !== childId) },
        }
      default:
        return block
    }
  })
}

export function removeFromTypeVariables(
  blocks: BlockNode[],
  typeId: string,
  childId: string,
): BlockNode[] {
  return updateBlockInTree(blocks, typeId, (block) => {
    if (block.kind !== 'type') return block
    return {
      ...block,
      data: {
        ...block.data,
        variables: block.data.variables.filter((v) => v.id !== childId),
      },
    }
  })
}

export function detachBlockFromTree(blocks: BlockNode[], blockId: string): BlockNode[] {
  const parent = findBlockParent(blocks, blockId)
  if (!parent) return blocks

  switch (parent.target.kind) {
    case 'variable-value':
      return updateNestedVariableValue(blocks, parent.parentBlockId, undefined)
    case 'statement-body':
      return removeFromStatementBody(
        blocks,
        parent.parentBlockId,
        parent.target.region,
        blockId,
      )
    case 'print-value':
      return updatePrintValue(blocks, parent.parentBlockId, undefined)
    case 'return-value':
      return updateReturnValue(blocks, parent.parentBlockId, undefined)
    case 'if-condition':
      return updateIfCondition(blocks, parent.parentBlockId, undefined)
    case 'call-arg':
      return updateCallArgValue(
        blocks,
        parent.parentBlockId,
        parent.target.argPortId,
        undefined,
      )
    case 'type-variable':
      return removeFromTypeVariables(blocks, parent.parentBlockId, blockId)
    case 'function-signature':
      return updateFunctionSignature(blocks, parent.parentBlockId, undefined)
    case 'expression-operand':
      return updateExpressionOperand(
        blocks,
        parent.parentBlockId,
        parent.target.side,
        undefined,
      )
    case 'for-init':
      return updateForInit(blocks, parent.parentBlockId, undefined)
    case 'for-condition':
      return updateForCondition(blocks, parent.parentBlockId, undefined)
    case 'for-increment':
      return updateForIncrement(blocks, parent.parentBlockId, undefined)
    case 'while-condition':
      return updateWhileCondition(blocks, parent.parentBlockId, undefined)
    default:
      return blocks
  }
}

export function getStatementLineNumber(
  blocks: BlockNode[],
  blockId: string,
): number | null {
  const parent = findBlockParent(blocks, blockId)
  if (!parent || parent.target.kind !== 'statement-body') return null

  const parentBlock = findBlockInTree(blocks, parent.parentBlockId)
  if (!parentBlock) return null

  const { region } = parent.target
  let statements: BlockNode[] = []

  switch (parentBlock.kind) {
    case 'main':
      if (region === 'main') statements = parentBlock.data.body
      break
    case 'function':
      if (region === 'function') statements = parentBlock.data.body
      break
    case 'if':
      if (region === 'if-true') statements = parentBlock.data.trueBranch
      else if (region === 'if-false') statements = parentBlock.data.falseBranch ?? []
      break
    case 'for':
      if (region === 'for') statements = parentBlock.data.body
      break
    case 'while':
      if (region === 'while') statements = parentBlock.data.body
      break
    default:
      break
  }

  const index = statements.findIndex((s) => s.id === blockId)
  return index >= 0 ? index + 1 : null
}

export function isForIncrementExpression(blocks: BlockNode[], blockId: string): boolean {
  const parent = findBlockParent(blocks, blockId)
  return parent?.target.kind === 'for-increment'
}
