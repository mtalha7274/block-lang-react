import { describe, expect, it } from 'vitest'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { resolveBlockEditorTargetId } from './callWire'
import { ensureFunctionForCall } from './ensureFunctionForCall'

describe('resolveBlockEditorTargetId', () => {
  it('routes function call chips to the call editor', () => {
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

    expect(resolveBlockEditorTargetId(linkedCall, ensured.blocks)).toBe(linkedCall.id)
    expect(resolveBlockEditorTargetId(main, ensured.blocks)).toBe(main.id)
  })

  it('routes nested calls to their own call editor', () => {
    const main = createBlockFromKind('main')
    const parentFn = createBlockFromKind('function')
    if (parentFn.kind !== 'function') throw new Error('expected function')
    parentFn.data.name = 'myFunc'

    const nestedCall = createBlockFromKind('functionCall')
    if (nestedCall.kind !== 'functionCall') throw new Error('expected functionCall')

    const ensured = ensureFunctionForCall([main, parentFn], nestedCall)
    const linkedCall = {
      ...nestedCall,
      data: {
        ...nestedCall.data,
        targetFunctionId: ensured.fn.id,
        functionName: ensured.fn.data.name,
      },
    }

    expect(ensured.fn.id).not.toBe(parentFn.id)
    expect(resolveBlockEditorTargetId(linkedCall, ensured.blocks)).toBe(linkedCall.id)
    expect(resolveBlockEditorTargetId(linkedCall, ensured.blocks)).not.toBe(parentFn.id)
  })
})
