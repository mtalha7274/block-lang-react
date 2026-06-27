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
import { defaultValueForType } from '../lib/validation/typeChecker'
import {
  canAttachBlockToSlot,
  normalizeBlockForSlot,
  type AttachOptions,
} from '../lib/validation/slotRules'
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
  updateReturnValue,
  updateIfCondition,
  updateExpressionOperand,
  updateForInit,
  updateForCondition,
  updateForIncrement,
  updateWhileCondition,
} from '../lib/program/blockTree'
import { createDefaultPanelPositions } from '../lib/workspace/panelDefaults'
import { getInScopeValuesForConsumer, isValueSourceBlock, resolveInScopeReferenceSource, resolveScopeConsumerId, shouldUseInScopeReference } from '../lib/program/scope'
import { getBlockValueType } from '../lib/program/blockContract'
import {
  linkFunctionCallToTarget,
} from '../lib/program/callWire'
import { ensureFunctionForCall } from '../lib/program/ensureFunctionForCall'
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

function slotAcceptsReference(
  target: SlotTarget,
  valueRef: BlockNode,
  blocks: BlockNode[],
): boolean {
  if (valueRef.kind !== 'valueRef') return false
  return canAttachBlockToSlot(
    target,
    valueRef,
    (id) => findBlockInTree(blocks, id),
    {},
    () => blocks,
  )
}

function assignReferenceToSlot(
  prev: ProgramDocument,
  sourceBlockId: string,
  target: SlotTarget,
): { next: ProgramDocument; accepted: boolean } {
  const resolvedSourceId = resolveInScopeReferenceSource(prev.blocks, sourceBlockId, target)
  const source = findBlockInTree(prev.blocks, resolvedSourceId)
  if (!source || !isValueSourceBlock(source)) {
    return { next: prev, accepted: false }
  }

  const consumerId = resolveScopeConsumerId(prev.blocks, target)
  const inScope = getInScopeValuesForConsumer(prev.blocks, consumerId)
  if (!inScope.some((v) => v.blockId === resolvedSourceId)) {
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
  } else if (target.kind === 'return-value') {
    blocks = updateReturnValue(blocks, consumerId, valueRef)
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
    resolvedSourceId,
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

  const loadProgram = useCallback((doc: ProgramDocument) => {
    setProgram(doc)
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
          const nestedType = nested ? getBlockValueType(nested) : null
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
        const call = findBlockInTree(prev.blocks, blockId)
        if (!call || call.kind !== 'functionCall') return prev

        const callWithName: Extract<BlockNode, { kind: 'functionCall' }> = {
          ...call,
          data: { ...call.data, functionName: name },
        }
        const ensured = ensureFunctionForCall(prev.blocks, callWithName, {
          linkToExistingByName: true,
        })
        const blocks = updateBlockInTree(ensured.blocks, blockId, (block) => {
          if (block.kind !== 'functionCall') return block
          return linkFunctionCallToTarget(block, ensured.fn, name)
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
    options: AttachOptions = {},
  ): { next: ProgramDocument; accepted: boolean; createdFunctionId?: string } => {
    const findInPrev = (id: string) => findBlockInTree(prev.blocks, id)
    const getBlocks = () => prev.blocks
    const blockToAttach = normalizeBlockForSlot(
      target,
      block,
      findInPrev,
      options,
      getBlocks,
    )
    if (!canAttachBlockToSlot(target, blockToAttach, findInPrev, options, getBlocks)) {
      return { next: prev, accepted: false }
    }

    const blocksWithoutSource = prev.blocks.filter((b) => b.id !== block.id)
    const placementsWithoutSource = prev.placements.filter((p) => p.blockId !== block.id)

    if (target.kind === 'variable-value') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'variable') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateNestedVariableValue(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'statement-body') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || !isValidStatementBodyParent(parent, target.region)) {
        return { next: prev, accepted: false }
      }
      let statementToAttach = blockToAttach
      let blocksForAttach = blocksWithoutSource
      let createdFunctionId: string | undefined
      if (blockToAttach.kind === 'functionCall') {
        const linkedFn = blockToAttach.data.targetFunctionId
          ? blocksWithoutSource.find(
              (b): b is Extract<BlockNode, { kind: 'function' }> =>
                b.kind === 'function' && b.id === blockToAttach.data.targetFunctionId,
            )
          : undefined
        if (linkedFn) {
          blocksForAttach = blocksWithoutSource
          statementToAttach = linkFunctionCallToTarget(blockToAttach, linkedFn)
        } else {
          const ensured = ensureFunctionForCall(blocksWithoutSource, blockToAttach)
          blocksForAttach = ensured.blocks
          if (ensured.created) createdFunctionId = ensured.fn.id
          statementToAttach = linkFunctionCallToTarget(blockToAttach, ensured.fn)
        }
      }
      return {
        next: {
          ...prev,
          blocks: appendToStatementBody(
            blocksForAttach,
            target.parentBlockId,
            target.region,
            statementToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
        createdFunctionId,
      }
    }

    if (target.kind === 'type-variable') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'type') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: appendToTypeVariables(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'function-signature') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'function') return { next: prev, accepted: false }
      if (parent.data.signature) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateFunctionSignature(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
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
      if (!arg) return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateCallArgValue(
            blocksWithoutSource,
            target.parentBlockId,
            target.argPortId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'print-value') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'print') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updatePrintValue(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'return-value') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'return') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateReturnValue(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'if-condition') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'if') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateIfCondition(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'expression-operand') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'expression') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateExpressionOperand(
            blocksWithoutSource,
            target.parentBlockId,
            target.side,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'for-init') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'for') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateForInit(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'for-condition') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'for') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateForCondition(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'for-increment') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'for') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateForIncrement(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    if (target.kind === 'while-condition') {
      const parent = findBlockInTree(prev.blocks, target.parentBlockId)
      if (!parent || parent.kind !== 'while') return { next: prev, accepted: false }
      return {
        next: {
          ...prev,
          blocks: updateWhileCondition(
            blocksWithoutSource,
            target.parentBlockId,
            blockToAttach,
          ),
          placements: placementsWithoutSource,
        },
        accepted: true,
      }
    }

    return { next: prev, accepted: false }
  }

  const attachBlockIdToSlot = useCallback(
    (blockId: string, target: SlotTarget): boolean => {
      let accepted = false
      setProgram((prev) => {
        const resolvedSourceId = resolveInScopeReferenceSource(prev.blocks, blockId, target)
        if (shouldUseInScopeReference(prev.blocks, resolvedSourceId, target)) {
          const refResult = assignReferenceToSlot(prev, resolvedSourceId, target)
          if (refResult.accepted) {
            accepted = true
            return applyProgramUpdate(refResult.next, refResult.next.blocks)
          }
        }

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
    (
      kind: BlockKind,
      target: SlotTarget,
    ): { accepted: boolean; createdFunctionId?: string } => {
      if (kind === 'main') return { accepted: false }
      const block = createBlockFromKind(kind)
      let result = { accepted: false, createdFunctionId: undefined as string | undefined }
      setProgram((prev) => {
        const inner = attachBlockToSlotInner(prev, block, target, {
          allowPrimitiveTypeInit: true,
        })
        result = {
          accepted: inner.accepted,
          createdFunctionId: inner.createdFunctionId,
        }
        return inner.next
      })
      return result
    },
    [],
  )

  const attachTemplateBlockToSlot = useCallback(
    (template: BlockNode, target: SlotTarget): { accepted: boolean; createdFunctionId?: string } => {
      let result = { accepted: false, createdFunctionId: undefined as string | undefined }
      setProgram((prev) => {
        const inner = attachBlockToSlotInner(prev, template, target, {
          allowPrimitiveTypeInit: true,
        })
        result = {
          accepted: inner.accepted,
          createdFunctionId: inner.createdFunctionId,
        }
        return inner.next
      })
      return result
    },
    [],
  )

  const ensureTopLevelFunction = useCallback(
    (fn: Extract<BlockNode, { kind: 'function' }>) => {
      setProgram((prev) => {
        if (prev.blocks.some((b) => b.id === fn.id)) return prev
        return applyProgramUpdate(prev, [...prev.blocks, fn])
      })
    },
    [],
  )

  const detachNestedBlock = useCallback((blockId: string) => {
    setProgram((prev) => {
      const parent = findBlockParent(prev.blocks, blockId)
      let connections = removeUsageConnectionsForBlock(prev.connections, blockId)

      if (
        parent &&
        (parent.target.kind === 'print-value' ||
          parent.target.kind === 'return-value' ||
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
    moveBlock,
    movePanel,
    resetProgram,
    loadProgram,
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
    attachTemplateBlockToSlot,
    ensureTopLevelFunction,
    detachNestedBlock,
    removeTopLevelBlock,
    findTopLevelBlock: (id: string) => findTopLevelBlock(program, id),
  }
}
