import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  canCreateValueReference,
  canUseAsStatement,
  getBlockValueType,
  getMiniBlockView,
  isValueReturningBlock,
} from './blockContract'

function voidFunctionCall(): BlockNode {
  return {
    ...(createBlockFromKind('functionCall') as Extract<BlockNode, { kind: 'functionCall' }>),
    data: {
      functionName: 'log',
      returnType: 'void',
      arguments: [],
    },
  }
}

function numberFunctionCall(): BlockNode {
  return createBlockFromKind('functionCall')
}

describe('blockContract', () => {
  it('treats primitives as value-returning but not statements or refs', () => {
    const primitive = createBlockFromKind('primitive')
    expect(getBlockValueType(primitive)).toBe('number')
    expect(isValueReturningBlock(primitive)).toBe(true)
    expect(canUseAsStatement(primitive)).toBe(false)
    expect(canCreateValueReference(primitive)).toBe(false)
  })

  it('excludes void function calls from value slots', () => {
    const voidCall = voidFunctionCall()
    expect(getBlockValueType(voidCall)).toBeNull()
    expect(isValueReturningBlock(voidCall)).toBe(false)
    expect(canCreateValueReference(voidCall)).toBe(false)
  })

  it('includes non-void function calls as value sources', () => {
    const call = numberFunctionCall()
    expect(getBlockValueType(call)).toBe('number')
    expect(isValueReturningBlock(call)).toBe(true)
    expect(canCreateValueReference(call)).toBe(true)
  })

  it('allows void function calls as statements', () => {
    const voidCall = voidFunctionCall()
    expect(canUseAsStatement(voidCall)).toBe(true)
  })

  it('does not allow expressions as standalone statements', () => {
    const expression = createBlockFromKind('expression')
    expect(canUseAsStatement(expression)).toBe(false)
  })

  it('shows valueRef condition label in if mini view', () => {
    const ifBlock: BlockNode = {
      ...(createBlockFromKind('if') as Extract<BlockNode, { kind: 'if' }>),
      data: {
        condition: {
          id: 'ref-1',
          kind: 'valueRef',
          data: {
            sourceBlockId: 'var-1',
            valueType: 'boolean',
            label: 'flag',
          },
        },
        trueBranch: [],
        falseBranch: [],
      },
    }
    expect(getMiniBlockView(ifBlock).label).toBe('If flag')
  })

  it('defaults if mini view without condition ref', () => {
    const ifBlock = createBlockFromKind('if')
    expect(getMiniBlockView(ifBlock).label).toBe('If / Else')
  })

  it('shows return mini labels', () => {
    const retWithRef: BlockNode = {
      ...(createBlockFromKind('return') as Extract<BlockNode, { kind: 'return' }>),
      data: {
        value: {
          id: 'ref-1',
          kind: 'valueRef',
          data: {
            sourceBlockId: 'var-1',
            valueType: 'number',
            label: 'count',
          },
        },
      },
    }
    expect(getMiniBlockView(retWithRef).label).toBe('count')

    const retWithValue = createBlockFromKind('return') as Extract<BlockNode, { kind: 'return' }>
    retWithValue.data.value = createBlockFromKind('primitive')
    expect(getMiniBlockView(retWithValue).label).toBe('…')

    const plainReturn = createBlockFromKind('return')
    expect(getMiniBlockView(plainReturn).label).toBe('…')
  })
})
