import { describe, expect, it } from 'vitest'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { resolveBlockEditorTargetId } from './callWire'
import { ensureFunctionForCall } from './ensureFunctionForCall'

describe('resolveBlockEditorTargetId', () => {
  it('routes function call chips to the linked function editor', () => {
    const main = createBlockFromKind('main')
    const call = createBlockFromKind('functionCall')
    if (call.kind !== 'functionCall') throw new Error('expected functionCall')

    const ensured = ensureFunctionForCall([main], call)
    const linkedCall = {
      ...call,
      data: {
        ...call.data,
        targetFunctionId: ensured.fn.id,
        functionName: ensured.fn.data.name,
      },
    }

    expect(resolveBlockEditorTargetId(linkedCall, ensured.blocks)).toBe(ensured.fn.id)
    expect(resolveBlockEditorTargetId(main, ensured.blocks)).toBe(main.id)
  })
})
