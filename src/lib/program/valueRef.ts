import type { BlockNode, FunctionParameter } from '../../types'
import { findBlockInTree, mapBlocksInTree } from './blockTree'
import { findFunctionParamBySourceId, functionParamSourceId } from './functionParams'
import { getLabelFromSource, getValueTypeFromSource } from './scope'

let refCounter = 0

function nextRefId(): string {
  refCounter += 1
  return `valueRef-${refCounter}-${Date.now()}`
}

export function createValueRefFromParam(
  fnId: string,
  param: FunctionParameter,
): BlockNode {
  return {
    id: nextRefId(),
    kind: 'valueRef',
    data: {
      sourceBlockId: functionParamSourceId(fnId, param.id),
      label: param.name,
      valueType: param.type,
    },
  }
}

export function createValueRefFromSource(source: BlockNode): BlockNode | null {
  const valueType = getValueTypeFromSource(source)
  const label = getLabelFromSource(source)
  if (!valueType || !label) return null

  return {
    id: nextRefId(),
    kind: 'valueRef',
    data: {
      sourceBlockId: source.id,
      label,
      valueType,
    },
  }
}

export function getUsageInPortId(target: import('../../types').SlotTarget): string {
  switch (target.kind) {
    case 'print-value':
      return 'print-value-in'
    case 'return-value':
      return 'return-value-in'
    case 'if-condition':
      return 'if-condition-in'
    case 'call-arg':
      return `call-arg-in-${target.argPortId}`
    case 'variable-value':
      return 'variable-value-in'
    case 'expression-operand':
      return `expression-operand-in-${target.side}`
    case 'for-init':
      return 'for-init-in'
    case 'for-condition':
      return 'for-condition-in'
    case 'for-increment':
      return 'for-increment-in'
    case 'while-condition':
      return 'while-condition-in'
    default:
      return 'value-in'
  }
}

export function usageConnectionId(
  fromBlockId: string,
  toBlockId: string,
  inPortId: string,
): string {
  return `usage-${fromBlockId}-${toBlockId}-${inPortId}`
}

export function upsertUsageConnection(
  connections: import('../../types').ConnectionEdge[],
  fromBlockId: string,
  toBlockId: string,
  inPortId: string,
  type: import('../../types').ValueType,
): import('../../types').ConnectionEdge[] {
  const filtered = connections.filter(
    (c) =>
      !(
        c.purpose === 'usage' &&
        c.to.blockId === toBlockId &&
        c.to.portId === inPortId
      ),
  )
  return [
    ...filtered,
    {
      id: usageConnectionId(fromBlockId, toBlockId, inPortId),
      from: { blockId: fromBlockId, portId: 'value-out' },
      to: { blockId: toBlockId, portId: inPortId },
      type,
      valid: true,
      purpose: 'usage',
    },
  ]
}

export function removeUsageConnectionsForBlock(
  connections: import('../../types').ConnectionEdge[],
  blockId: string,
): import('../../types').ConnectionEdge[] {
  return connections.filter(
    (c) =>
      c.purpose !== 'usage' ||
      (c.from.blockId !== blockId && c.to.blockId !== blockId),
  )
}

export function removeUsageConnectionAtPort(
  connections: import('../../types').ConnectionEdge[],
  toBlockId: string,
  inPortId: string,
): import('../../types').ConnectionEdge[] {
  return connections.filter(
    (c) =>
      !(
        c.purpose === 'usage' &&
        c.to.blockId === toBlockId &&
        c.to.portId === inPortId
      ),
  )
}

export function syncValueRefLabels(blocks: BlockNode[]): BlockNode[] {
  return mapBlocksInTree(blocks, (block) => {
    if (block.kind !== 'valueRef') return block

    const paramRef = findFunctionParamBySourceId(blocks, block.data.sourceBlockId)
    if (paramRef) {
      const hadError = block.visual?.state === 'error'
      return {
        ...block,
        data: {
          ...block.data,
          label: paramRef.param.name,
          valueType: paramRef.param.type,
        },
        visual: hadError
          ? { ...block.visual, state: 'default', errorMessage: undefined }
          : block.visual,
      }
    }

    const source = findBlockInTree(blocks, block.data.sourceBlockId)
    if (!source) {
      return {
        ...block,
        visual: {
          ...block.visual,
          state: 'error',
          errorMessage: 'Referenced value was removed',
        },
      }
    }

    const label = getLabelFromSource(source)
    const valueType = getValueTypeFromSource(source)
    if (!label || !valueType) return block

    const hadError = block.visual?.state === 'error'
    return {
      ...block,
      data: { ...block.data, label, valueType },
      visual: hadError
        ? { ...block.visual, state: 'default', errorMessage: undefined }
        : block.visual,
    }
  })
}
