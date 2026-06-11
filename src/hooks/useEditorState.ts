import { useCallback, useState } from 'react'
import type {
  BlockKind,
  BlockLayoutOverride,
  BlockNode,
  OperatorSymbol,
  ProgramDocument,
  SlotTarget,
  ValueType,
} from '../types'
import { operators } from '../constants/operators'
import { emptyProgram } from '../constants/emptyProgram'
import { createBlockFromKind } from '../constants/blockDefaults'
import {
  canStatementBodyAcceptBlock,
  canValueSlotAcceptBlock,
  canTypeVariableAcceptBlock,
  canFunctionSignatureAcceptBlock,
  canCallArgAcceptBlock,
  canPrintValueAcceptBlock,
  canIfConditionAcceptBlock,
  canExpressionOperandAcceptBlock,
  canTypedValueSlotAcceptBlock,
  getExpressionOperandType,
  defaultValueForType,
} from '../lib/validation/typeChecker'
import {
  appendToStatementBody,
  isValidStatementBodyParent,
  appendToTypeVariables,
  detachBlockFromTree,
  findBlockInTree,
  findBlockParent,
  findTopLevelBlock,
  mapBlocksInTree,
  updateBlockInTree,
  updateNestedVariableValue,
  updateFunctionSignature,
  updateCallArgValue,
  updatePrintValue,
  updateIfCondition,
  updateExpressionOperand,
  updateForInit,
  updateForCondition,
  updateForIncrement,
  updateWhileCondition,
} from '../lib/program/blockTree'
import { createDefaultPanelPositions } from '../lib/workspace/panelDefaults'
import { getInScopeValuesForConsumer, isValueSourceBlock } from '../lib/program/scope'
import {
  findFunctionByName,
  linkFunctionCallToTarget,
} from '../lib/program/callWire'
import {
  createValueRefFromSource,
  getUsageInPortId,
  removeUsageConnectionAtPort,
  removeUsageConnectionsForBlock,
  syncValueRefLabels,
  upsertUsageConnection,
} from '../lib/program/valueRef'

function nextRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function applyProgramUpdate(
  prev: ProgramDocument,
  blocks: BlockNode[],
  connections?: import('../types').ConnectionEdge[],
): ProgramDocument {
  return {
    ...prev,
    blocks: syncValueRefLabels(blocks),
    connections: connections ?? prev.connections,
  }
}

function coercePrimitive(block: BlockNode, expected: ValueType): BlockNode {
  if (block.kind !== 'primitive') return block
  return {
    ...block,
    data: {
      valueType: expected,
      value: defaultValueForType(expected),
    },
  }
}

function slotAcceptsReference(
  target: SlotTarget,
  valueRef: BlockNode,
  blocks: BlockNode[],
): boolean {
  if (valueRef.kind !== 'valueRef') return false

  if (target.kind === 'print-value') {
    return canPrintValueAcceptBlock(valueRef)
  }
  if (target.kind === 'if-condition') {
    return canIfConditionAcceptBlock(valueRef)
  }
  if (target.kind === 'variable-value') {
    const parent = findBlockInTree(blocks, target.parentBlockId)
    if (parent?.kind !== 'variable') return false
    return canValueSlotAcceptBlock(parent.data.valueType, valueRef)
  }
  if (target.kind === 'call-arg') {
    const parent = findBlockInTree(blocks, target.parentBlockId)
    if (parent?.kind !== 'functionCall') return false
    const arg = parent.data.arguments.find((a) => a.portId === target.argPortId)
    if (!arg) return false
    return canCallArgAcceptBlock(arg.type, valueRef)
  }
  if (target.kind === 'expression-operand') {
    const parent = findBlockInTree(blocks, target.parentBlockId)
    if (parent?.kind !== 'expression') return false
    return canExpressionOperandAcceptBlock(parent, valueRef)
  }
  if (target.kind === 'for-init' || target.kind === 'for-increment') {
    return canTypedValueSlotAcceptBlock('number', valueRef)
  }
  if (target.kind === 'for-condition' || target.kind === 'while-condition') {
    return canIfConditionAcceptBlock(valueRef)
  }
  return false
}

function assignReferenceToSlot(
  prev: ProgramDocument,
  sourceBlockId: string,
  target: SlotTarget,
): { next: ProgramDocument; accepted: boolean } {
  const source = findBlockInTree(prev.blocks, sourceBlockId)
  if (!source || !isValueSourceBlock(source)) {
    return { next: prev, accepted: false }
  }

  const consumerId = target.parentBlockId
  const inScope = getInScopeValuesForConsumer(prev.blocks, consumerId)
  if (!inScope.some((v) => v.blockId === sourceBlockId)) {
    return { next: prev, accepted: false }
  }

  const valueRef = createValueRefFromSource(source)
  if (!valueRef || valueRef.kind !== 'valueRef') {
    return { next: prev, accepted: false }
  }
  if (!slotAcceptsReference(target, valueRef, prev.blocks)) {
    return { next: prev, accepted: false }
  }

  const inPortId = getUsageInPortId(target)
  let blocks = prev.blocks
  let connections = removeUsageConnectionAtPort(
    prev.connections,
    consumerId,
    inPortId,
  )

  if (target.kind === 'print-value') {
    blocks = updatePrintValue(blocks, consumerId, valueRef)
  } else if (target.kind === 'if-condition') {
    blocks = updateIfCondition(blocks, consumerId, valueRef)
  } else if (target.kind === 'variable-value') {
    blocks = updateNestedVariableValue(blocks, consumerId, valueRef)
  } else if (target.kind === 'call-arg') {
    blocks = updateCallArgValue(blocks, consumerId, target.argPortId, valueRef)
  } else if (target.kind === 'expression-operand') {
    blocks = updateExpressionOperand(blocks, consumerId, target.side, valueRef)
  } else if (target.kind === 'for-init') {
    blocks = updateForInit(blocks, consumerId, valueRef)
  } else if (target.kind === 'for-condition') {
    blocks = updateForCondition(blocks, consumerId, valueRef)
  } else if (target.kind === 'for-increment') {
    blocks = updateForIncrement(blocks, consumerId, valueRef)
  } else if (target.kind === 'while-condition') {
    blocks = updateWhileCondition(blocks, consumerId, valueRef)
  } else {
    return { next: prev, accepted: false }
  }

  connections = upsertUsageConnection(
    connections,
    sourceBlockId,
    consumerId,
    inPortId,
    valueRef.data.valueType,
  )

  return {
    next: applyProgramUpdate(prev, blocks, connections),
    accepted: true,
  }
}

export interface PanelPosition {
  x: number
  y: number
}

export function useEditorState() {
  const [program, setProgram] = useState<ProgramDocument>(emptyProgram)
  const [panelPositions, setPanelPositions] = useState<Record<string, PanelPosition>>(
    () => createDefaultPanelPositions(),
  )

  const addBlock = useCallback((kind: BlockKind, x: number, y: number): string | undefined => {
    if (kind === 'main') return undefined

    const block = createBlockFromKind(kind)
    setProgram((prev) => ({
      ...prev,
      blocks: [...prev.blocks, block],
      placements: [...prev.placements, { blockId: block.id, x, y }],
    }))
    return block.id
  }, [])

  const moveBlock = useCallback((blockId: string, x: number, y: number) => {
    setProgram((prev) => ({
      ...prev,
      placements: prev.placements.map((p) =>
        p.blockId === blockId ? { ...p, x, y } : p,
      ),
    }))
  }, [])

  const movePanel = useCallback((panelId: string, x: number, y: number) => {
    setPanelPositions((prev) => ({
      ...prev,
      [panelId]: { x, y },
    }))
  }, [])

  const resetProgram = useCallback(() => {
    setProgram(emptyProgram)
  }, [])

  const updateBlockType = useCallback((blockId: string, valueType: ValueType) => {
    setProgram((prev) => ({
      ...prev,
      blocks: updateBlockInTree(prev.blocks, blockId, (block) => {
        if (block.kind === 'primitive') {
          return {
            ...block,
            data: {
              valueType,
              value: defaultValueForType(valueType),
            },
          }
        }
        if (block.kind === 'variable') {
          const nested = block.data.value
          const nestedType =
            nested?.kind === 'primitive'
              ? nested.data.valueType
              : nested?.kind === 'functionCall'
                ? nested.data.returnType
                : nested?.kind === 'expression'
                  ? nested.data.resultType
                  : null
          const clearValue = nestedType !== null && nestedType !== valueType
          return {
            ...block,
            data: {
              ...block.data,
              valueType,
              value: clearValue ? undefined : block.data.value,
            },
          }
        }
        return block
      }),
    }))
  }, [])

  const updateBlockValue = useCallback(
    (blockId: string, value: string | number | boolean) => {
      setProgram((prev) => ({
        ...prev,
        blocks: updateBlockInTree(prev.blocks, blockId, (block) => {
          if (block.kind === 'primitive') {
            return { ...block, data: { ...block.data, value } }
          }
          return block
        }),
      }))
    },
    [],
  )

  const updateVariableName = useCallback((blockId: string, name: string) => {
    setProgram((prev) =>
      applyProgramUpdate(
        prev,
        updateBlockInTree(prev.blocks, blockId, (block) => {
          if (block.kind === 'variable') {
            return { ...block, data: { ...block.data, name } }
          }
          return block
        }),
      ),
    )
  }, [])

  const updateFunctionReturnType = useCallback(
    (blockId: string, returnType: ValueType) => {
      setProgram((prev) => ({
        ...prev,
        blocks: updateBlockInTree(prev.blocks, blockId, (block) => {
          if (block.kind === 'function') {
            return { ...block, data: { ...block.data, returnType } }
          }
          return block
        }),
      }))
    },
    [],
  )

  const updateFunctionName = useCallback((blockId: string, name: string) => {
    setProgram((prev) => {
      const fnBlock = findBlockInTree(prev.blocks, blockId)
      if (!fnBlock || fnBlock.kind !== 'function') return prev

      const oldName = fnBlock.data.name
      const functionsWithOldName = prev.blocks.filter(
        (b) => b.kind === 'function' && b.data.name === oldName,
      )
      const isOnlyFunctionWithOldName =
        functionsWithOldName.length === 1 && functionsWithOldName[0].id === blockId

      const blocks = mapBlocksInTree(prev.blocks, (block) => {
        if (block.id === blockId && block.kind === 'function') {
          return { ...block, data: { ...block.data, name } }
        }
        if (block.kind !== 'functionCall') return block

        if (block.data.targetFunctionId === blockId) {
          return {
            ...block,
            data: { ...block.data, functionName: name },
          }
        }

        if (
          !block.data.targetFunctionId &&
          block.data.functionName === oldName &&
          isOnlyFunctionWithOldName
        ) {
          return {
            ...block,
            data: {
              ...block.data,
              functionName: name,
              targetFunctionId: blockId,
            },
          }
        }

        return block
      })

      return { ...prev, blocks }
    })
  }, [])

  const addTypeParamRow = useCallback((typeBlockId: string) => {
    setProgram((prev) => ({
      ...prev,
      blocks: updateBlockInTree(prev.blocks, typeBlockId, (block) => {
        if (block.kind !== 'type') return block
        const n = block.data.rows.length + 1
        return {
          ...block,
          data: {
            ...block.data,
            rows: [
              ...block.data.rows,
              { id: nextRowId(), name: `param${n}`, type: 'number' },
            ],
          },
        }
      }),
    }))
  }, [])

  const removeTypeParamRow = useCallback((typeBlockId: string, rowId: string) => {
    setProgram((prev) => ({
      ...prev,
      blocks: updateBlockInTree(prev.blocks, typeBlockId, (block) => {
        if (block.kind !== 'type' || block.data.rows.length <= 1) return block
        return {
          ...block,
          data: {
            ...block.data,
            rows: block.data.rows.filter((r) => r.id !== rowId),
          },
        }
      }),
    }))
  }, [])

  const updateTypeParamRow = useCallback(
    (
      typeBlockId: string,
      rowId: string,
      patch: { name?: string; type?: ValueType },
    ) => {
      setProgram((prev) => ({
        ...prev,
        blocks: updateBlockInTree(prev.blocks, typeBlockId, (block) => {
          if (block.kind !== 'type') return block
          return {
            ...block,
            data: {
              ...block.data,
              rows: block.data.rows.map((r) =>
                r.id === rowId ? { ...r, ...patch } : r,
              ),
            },
          }
        }),
      }))
    },
    [],
  )

  const updateFunctionCallName = useCallback(
    (blockId: string, name: string) => {
      setProgram((prev) => {
        const fn = findFunctionByName(prev.blocks, name)
        const blocks = updateBlockInTree(prev.blocks, blockId, (block) => {
          if (block.kind !== 'functionCall') return block
          return linkFunctionCallToTarget(block, fn, name)
        })
        return applyProgramUpdate(prev, blocks)
      })
    },
    [],
  )

  const updateExpressionOperator = useCallback(
    (blockId: string, operator: OperatorSymbol) => {
      const entry = operators.find((op) => op.symbol === operator)
      if (!entry) return

      setProgram((prev) => ({
        ...prev,
        blocks: updateBlockInTree(prev.blocks, blockId, (block) => {
          if (block.kind !== 'expression') return block
          return {
            ...block,
            data: {
              ...block.data,
              operator,
              resultType: entry.resultType,
            },
          }
        }),
      }))
    },
    [],
  )

  const updateExpressionResultName = useCallback((blockId: string, name: string) => {
    setProgram((prev) =>
      applyProgramUpdate(
        prev,
        updateBlockInTree(prev.blocks, blockId, (block) => {
          if (block.kind !== 'expression') return block
          return { ...block, data: { ...block.data, resultName: name } }
        }),
      ),
    )
  }, [])

  const updateBlockLayout = useCallback(
    (blockId: string, layout: BlockLayoutOverride | null) => {
      setProgram((prev) => ({
        ...prev,
        blocks: updateBlockInTree(prev.blocks, blockId, (block) => ({
          ...block,
          visual: {
            ...block.visual,
            layout: layout ?? undefined,
          },
        })),
      }))
    },
    [],
  )

  const attachBlockToSlotInner = (
    prev: ProgramDocument,
    block: BlockNode,
    target: SlotTarget,
  ): { next: ProgramDocument; accepted: boolean } => {
    if (target.kind === 'variable-value') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'variable') return { next: prev, accepted: false }

      let blockToAttach = block
      if (block.kind === 'primitive') {
        blockToAttach = {
          ...block,
          data: {
            valueType: parent.data.valueType,
            value: defaultValueForType(parent.data.valueType),
          },
        }
      }

      if (!canValueSlotAcceptBlock(parent.data.valueType, blockToAttach)) {
        return { next: prev, accepted: false }
      }
      return {
        next: {
          ...prev,
          blocks: updateNestedVariableValue(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            blockToAttach,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'statement-body') {
      if (!canStatementBodyAcceptBlock(block)) return { next: prev, accepted: false }
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || !isValidStatementBodyParent(parent, target.region)) {
        return { next: prev, accepted: false }
      }
      let blockToAttach = block
      if (block.kind === 'functionCall') {
        const fn = findFunctionByName(prev.blocks, block.data.functionName)
        if (fn) {
          blockToAttach = linkFunctionCallToTarget(block, fn)
        }
      }
      return {
        next: {
          ...prev,
          blocks: appendToStatementBody(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            target.region,
            blockToAttach,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'type-variable') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'type') return { next: prev, accepted: false }
      if (!canTypeVariableAcceptBlock(block)) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: appendToTypeVariables(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            block,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'function-signature') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'function') return { next: prev, accepted: false }
      if (parent.data.signature) return { next: prev, accepted: false }
      if (!canFunctionSignatureAcceptBlock(block)) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateFunctionSignature(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            block,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'call-arg') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'functionCall') {
        return { next: prev, accepted: false }
      }
      const arg = parent.data.arguments.find((a) => a.portId === target.argPortId)
      if (!arg || !canCallArgAcceptBlock(arg.type, block)) {
        return { next: prev, accepted: false }
      }
      return {
        next: {
          ...prev,
          blocks: updateCallArgValue(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            target.argPortId,
            block,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'print-value') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'print') return { next: prev, accepted: false }
      if (!canPrintValueAcceptBlock(block)) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updatePrintValue(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            block,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'if-condition') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'if') return { next: prev, accepted: false }
      if (!canIfConditionAcceptBlock(block)) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateIfCondition(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            block,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'expression-operand') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'expression') return { next: prev, accepted: false }
      const expected = getExpressionOperandType(parent.data.operator)
      const blockToAttach = coercePrimitive(block, expected)
      if (!canExpressionOperandAcceptBlock(parent, blockToAttach)) {
        return { next: prev, accepted: false }
      }
      return {
        next: {
          ...prev,
          blocks: updateExpressionOperand(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            target.side,
            blockToAttach,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'for-init') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'for') return { next: prev, accepted: false }
      const blockToAttach = coercePrimitive(block, 'number')
      if (!canTypedValueSlotAcceptBlock('number', blockToAttach)) {
        return { next: prev, accepted: false }
      }
      return {
        next: {
          ...prev,
          blocks: updateForInit(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            blockToAttach,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'for-condition') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'for') return { next: prev, accepted: false }
      if (!canIfConditionAcceptBlock(block)) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateForCondition(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            block,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'for-increment') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'for') return { next: prev, accepted: false }
      const blockToAttach = coercePrimitive(block, 'number')
      if (!canTypedValueSlotAcceptBlock('number', blockToAttach)) {
        return { next: prev, accepted: false }
      }
      return {
        next: {
          ...prev,
          blocks: updateForIncrement(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            blockToAttach,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    if (target.kind === 'while-condition') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'while') return { next: prev, accepted: false }
      if (!canIfConditionAcceptBlock(block)) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateWhileCondition(
            prev.blocks.filter((b) => b.id !== block.id),
            target.parentBlockId,
            block,
          ),
          placements: prev.placements.filter((p) => p.blockId !== block.id),
        },
        accepted: true,
      }
    }

    return { next: prev, accepted: false }
  }

  const attachBlockToSlot = useCallback(
    (block: BlockNode, target: SlotTarget): boolean => {
      let accepted = false
      setProgram((prev) => {
        const result = attachBlockToSlotInner(prev, block, target)
        accepted = result.accepted
        return result.next
      })
      return accepted
    },
    [],
  )

  const attachBlockIdToSlot = useCallback(
    (blockId: string, target: SlotTarget): boolean => {
      let accepted = false
      setProgram((prev) => {
        const topLevel = findTopLevelBlock(prev, blockId)
        if (topLevel) {
          const result = attachBlockToSlotInner(prev, topLevel, target)
          accepted = result.accepted
          return result.accepted
            ? applyProgramUpdate(result.next, result.next.blocks)
            : result.next
        }

        const inTree = findBlockInTree(prev.blocks, blockId)
        if (!inTree) return prev

        const detachedBlocks = detachBlockFromTree(prev.blocks, blockId)
        const result = attachBlockToSlotInner(
          { ...prev, blocks: detachedBlocks },
          inTree,
          target,
        )
        accepted = result.accepted
        return result.accepted
          ? applyProgramUpdate(result.next, result.next.blocks)
          : prev
      })
      return accepted
    },
    [],
  )

  const assignInScopeReference = useCallback(
    (sourceBlockId: string, target: SlotTarget): boolean => {
      let accepted = false
      setProgram((prev) => {
        const result = assignReferenceToSlot(prev, sourceBlockId, target)
        accepted = result.accepted
        return result.next
      })
      return accepted
    },
    [],
  )

  const getInScopeValues = useCallback(
    (consumerBlockId: string) =>
      getInScopeValuesForConsumer(program.blocks, consumerBlockId),
    [program.blocks],
  )

  const attachNewBlockToSlot = useCallback(
    (kind: BlockKind, target: SlotTarget): boolean => {
      if (kind === 'main') return false
      const block = createBlockFromKind(kind)
      return attachBlockToSlot(block, target)
    },
    [attachBlockToSlot],
  )

  const detachNestedBlock = useCallback((blockId: string) => {
    setProgram((prev) => {
      const parent = findBlockParent(prev.blocks, blockId)
      let connections = removeUsageConnectionsForBlock(prev.connections, blockId)

      if (
        parent &&
        (parent.target.kind === 'print-value' ||
          parent.target.kind === 'if-condition' ||
          parent.target.kind === 'variable-value' ||
          parent.target.kind === 'call-arg' ||
          parent.target.kind === 'expression-operand' ||
          parent.target.kind === 'for-init' ||
          parent.target.kind === 'for-condition' ||
          parent.target.kind === 'for-increment' ||
          parent.target.kind === 'while-condition')
      ) {
        connections = removeUsageConnectionAtPort(
          connections,
          parent.parentBlockId,
          getUsageInPortId(parent.target),
        )
      }

      const blocks = detachBlockFromTree(prev.blocks, blockId)
      return applyProgramUpdate(prev, blocks, connections)
    })
  }, [])

  const removeTopLevelBlock = useCallback((blockId: string) => {
    setProgram((prev) => {
      const block = findTopLevelBlock(prev, blockId)
      if (!block || block.kind === 'main') return prev
      return {
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== blockId),
        placements: prev.placements.filter((p) => p.blockId !== blockId),
        connections: prev.connections.filter(
          (c) => c.from.blockId !== blockId && c.to.blockId !== blockId,
        ),
      }
    })
  }, [])

  return {
    program,
    panelPositions,
    addBlock,
    moveBlock,
    movePanel,
    resetProgram,
    updateBlockType,
    updateBlockValue,
    updateVariableName,
    updateFunctionReturnType,
    updateFunctionName,
    addTypeParamRow,
    removeTypeParamRow,
    updateTypeParamRow,
    updateFunctionCallName,
    updateExpressionOperator,
    updateExpressionResultName,
    updateBlockLayout,
    attachBlockIdToSlot,
    assignInScopeReference,
    getInScopeValues,
    attachNewBlockToSlot,
    detachNestedBlock,
    removeTopLevelBlock,
    findTopLevelBlock: (id: string) => findTopLevelBlock(program, id),
  }
}
