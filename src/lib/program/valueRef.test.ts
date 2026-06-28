import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { functionParamSourceId } from './functionParams'
import { syncValueRefLabels } from './valueRef'

describe('valueRef', () => {
  it('upgrades variable valueRefs to direct variable name blocks', () => {
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    const valueRef: BlockNode = {
      id: 'ref-1',
      kind: 'valueRef',
      data: {
        sourceBlockId: countVar.id,
        label: 'count',
        valueType: 'number',
      },
    }
    const expr = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    expr.data.left = valueRef
    const blocks = [countVar, expr]

    const synced = syncValueRefLabels(blocks)
    const left = synced.find((b) => b.id === expr.id)
    expect(left?.kind).toBe('expression')
    if (left?.kind !== 'expression') return

    expect(left.data.left?.kind).toBe('variable')
    if (left.data.left?.kind === 'variable') {
      expect(left.data.left.id).toBe('ref-1')
      expect(left.data.left.data.name).toBe('count')
      expect(left.data.left.data.valueType).toBe('number')
    }
  })

  it('upgrades param valueRefs to direct variable name blocks', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-a', name: 'amount', type: 'number' as const }
    fn.data.params = [paramRow]
    const valueRef: BlockNode = {
      id: 'ref-2',
      kind: 'valueRef',
      data: {
        sourceBlockId: functionParamSourceId(fn.id, paramRow.id),
        label: 'amount',
        valueType: 'number',
      },
    }
    const ret = createBlockFromKind('return')
    if (ret.kind === 'return') ret.data.value = valueRef
    fn.data.body = [ret]
    const blocks = [fn]

    const synced = syncValueRefLabels(blocks)
    const fnBlock = synced[0]
    expect(fnBlock.kind).toBe('function')
    if (fnBlock.kind !== 'function') return

    const value = fnBlock.data.body[0]
    expect(value.kind).toBe('return')
    if (value.kind !== 'return') return

    expect(value.data.value?.kind).toBe('variable')
    if (value.data.value?.kind === 'variable') {
      expect(value.data.value.data.name).toBe('amount')
    }
  })
})
