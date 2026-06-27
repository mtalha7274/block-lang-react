import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { linkFunctionCallToTarget } from './callWire'
import { deriveFunctionParams, syncCallsToFunction } from './functionParams'

describe('functionParams', () => {
  it('reads inline params from function blocks', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    fn.data.params = [
      { id: 'p1', name: 'x', type: 'number' },
      { id: 'p2', name: 'msg', type: 'string' },
    ]

    expect(deriveFunctionParams(fn)).toEqual([
      { id: 'p1', name: 'x', type: 'number' },
      { id: 'p2', name: 'msg', type: 'string' },
    ])
  })

  it('syncs linked call argument slots when function params change', () => {
    const main = createBlockFromKind('main')
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    fn.data.name = 'greet'
    fn.data.params = [{ id: 'p1', name: 'name', type: 'string' }]

    const call = createBlockFromKind('functionCall') as Extract<BlockNode, { kind: 'functionCall' }>
    const linkedCall = linkFunctionCallToTarget(
      {
        ...call,
        data: { ...call.data, targetFunctionId: fn.id, functionName: fn.data.name },
      },
      fn,
    )

    fn.data.params = [
      { id: 'p1', name: 'name', type: 'string' },
      { id: 'p2', name: 'age', type: 'number' },
    ]

    const blocks = syncCallsToFunction([main, fn, linkedCall], fn.id)
    const syncedCall = blocks.find((b) => b.id === call.id)
    expect(syncedCall?.kind).toBe('functionCall')
    if (syncedCall?.kind === 'functionCall') {
      expect(syncedCall.data.arguments).toHaveLength(2)
      expect(syncedCall.data.arguments[1]).toMatchObject({
        portId: 'p2',
        name: 'age',
        type: 'number',
      })
    }
  })
})
