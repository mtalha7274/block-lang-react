import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { findFunctionByName } from './callWire'
import { ensureFunctionForCall } from './ensureFunctionForCall'

function functionCall(name = 'myFunc'): Extract<BlockNode, { kind: 'functionCall' }> {
  const call = createBlockFromKind('functionCall')
  if (call.kind !== 'functionCall') throw new Error('expected functionCall')
  return {
    ...call,
    data: { ...call.data, functionName: name },
  }
}

describe('ensureFunctionForCall', () => {
  it('creates a function stub when none exists', () => {
    const main = createBlockFromKind('main')
    const call = functionCall()

    const result = ensureFunctionForCall([main], call)

    expect(result.created).toBe(true)
    expect(result.fn.kind).toBe('function')
    expect(result.fn.data.name).toBe('myFunc')
    expect(result.blocks).toHaveLength(2)
    expect(findFunctionByName(result.blocks, 'myFunc')).toEqual(result.fn)
  })

  it('reuses an existing function with the same name when linking by name', () => {
    const main = createBlockFromKind('main')
    const existingFn = createBlockFromKind('function')
    if (existingFn.kind !== 'function') throw new Error('expected function')
    const call = functionCall('myFunc')

    const result = ensureFunctionForCall([main, existingFn], call, {
      linkToExistingByName: true,
    })

    expect(result.created).toBe(false)
    expect(result.fn.id).toBe(existingFn.id)
    expect(result.blocks).toHaveLength(2)
  })

  it('creates a uniquely named function when the default name already exists', () => {
    const main = createBlockFromKind('main')
    const existingFn = createBlockFromKind('function')
    if (existingFn.kind !== 'function') throw new Error('expected function')
    const call = functionCall('myFunc')

    const result = ensureFunctionForCall([main, existingFn], call)

    expect(result.created).toBe(true)
    expect(result.fn.id).not.toBe(existingFn.id)
    expect(result.fn.data.name).toBe('myFunc2')
    expect(result.blocks).toHaveLength(3)
  })

  it('does not self-link when dropping a fresh call inside an existing function body', () => {
    const main = createBlockFromKind('main')
    const parentFn = createBlockFromKind('function')
    if (parentFn.kind !== 'function') throw new Error('expected function')
    parentFn.data.name = 'myFunc'

    const nestedCall = functionCall('myFunc')
    const result = ensureFunctionForCall([main, parentFn], nestedCall)

    expect(result.created).toBe(true)
    expect(result.fn.id).not.toBe(parentFn.id)
    expect(result.fn.data.name).toBe('myFunc2')
  })

  it('does not add a placement entry for auto-created functions', () => {
    const main = createBlockFromKind('main')
    const call = functionCall()

    const result = ensureFunctionForCall([main], call)

    expect(result.created).toBe(true)
    expect(result.blocks.some((b) => b.id === result.fn.id)).toBe(true)
  })
})
