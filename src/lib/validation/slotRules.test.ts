import { describe, expect, it } from 'vitest'
import type { BlockNode, SlotTarget } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  canAttachBlockToSlot,
  canAttachPaletteKindToSlot,
  normalizeBlockForSlot,
} from './slotRules'

function findBlockFactory(blocks: BlockNode[]) {
  return (id: string) => blocks.find((b) => b.id === id)
}

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

describe('slotRules', () => {
  it('rejects void function calls in print-value slots', () => {
    const printBlock = createBlockFromKind('print')
    const target: SlotTarget = {
      kind: 'print-value',
      parentBlockId: printBlock.id,
    }
    const findBlock = findBlockFactory([printBlock])
    const voidCall = voidFunctionCall()

    expect(canAttachBlockToSlot(target, voidCall, findBlock)).toBe(false)
  })

  it('accepts non-void function calls in print-value slots', () => {
    const printBlock = createBlockFromKind('print')
    const target: SlotTarget = {
      kind: 'print-value',
      parentBlockId: printBlock.id,
    }
    const findBlock = findBlockFactory([printBlock])
    const call = createBlockFromKind('functionCall')

    expect(canAttachBlockToSlot(target, call, findBlock)).toBe(true)
  })

  it('accepts void function calls in statement-body slots', () => {
    const main = createBlockFromKind('main')
    const target: SlotTarget = {
      kind: 'statement-body',
      parentBlockId: main.id,
      region: 'main',
    }
    const findBlock = findBlockFactory([main])
    const voidCall = voidFunctionCall()

    expect(canAttachBlockToSlot(target, voidCall, findBlock)).toBe(true)
  })

  it('accepts primitives on typed variable-value slots via coercion', () => {
    const variable: BlockNode = {
      ...(createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>),
      data: {
        name: 'msg',
        valueType: 'string',
      },
    }
    const target: SlotTarget = {
      kind: 'variable-value',
      parentBlockId: variable.id,
    }
    const findBlock = findBlockFactory([variable])
    const numberPrimitive = createBlockFromKind('primitive')

    expect(canAttachBlockToSlot(target, numberPrimitive, findBlock)).toBe(true)
  })

  it('coerces primitives to the slot expected type on attach', () => {
    const variable: BlockNode = {
      ...(createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>),
      data: {
        name: 'msg',
        valueType: 'string',
      },
    }
    const target: SlotTarget = {
      kind: 'variable-value',
      parentBlockId: variable.id,
    }
    const findBlock = findBlockFactory([variable])
    const primitive = createBlockFromKind('primitive')

    expect(
      canAttachBlockToSlot(
        target,
        normalizeBlockForSlot(target, primitive, findBlock),
        findBlock,
      ),
    ).toBe(true)

    const normalized = normalizeBlockForSlot(target, primitive, findBlock)
    expect(normalized.kind).toBe('primitive')
    if (normalized.kind === 'primitive') {
      expect(normalized.data.valueType).toBe('string')
      expect(normalized.data.value).toBe('')
    }
  })

  it('allows palette primitive kind on typed value slots', () => {
    const variable: BlockNode = {
      ...(createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>),
      data: {
        name: 'msg',
        valueType: 'string',
      },
    }
    const target: SlotTarget = {
      kind: 'variable-value',
      parentBlockId: variable.id,
    }
    const findBlock = findBlockFactory([variable])

    expect(canAttachPaletteKindToSlot(target, 'primitive', findBlock)).toBe(true)
    expect(canAttachPaletteKindToSlot(target, 'variable', findBlock)).toBe(false)
  })

  it('types return-value slot to enclosing function returnType', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    fn.data.returnType = 'string'
    const ret = createBlockFromKind('return')
    fn.data.body = [ret]
    const blocks = [fn]
    const findBlock = (id: string) => {
      if (id === fn.id) return fn
      if (id === ret.id) return ret
      return undefined
    }
    const target: SlotTarget = {
      kind: 'return-value',
      parentBlockId: ret.id,
    }
    const stringPrimitive: BlockNode = {
      ...(createBlockFromKind('primitive') as Extract<BlockNode, { kind: 'primitive' }>),
      data: { valueType: 'string', value: '' },
    }
    const numberPrimitive = createBlockFromKind('primitive')

    expect(canAttachBlockToSlot(target, stringPrimitive, findBlock, {}, () => blocks)).toBe(true)
    expect(canAttachBlockToSlot(target, numberPrimitive, findBlock, {}, () => blocks)).toBe(true)
    const normalized = normalizeBlockForSlot(target, numberPrimitive, findBlock, {}, () => blocks)
    if (normalized.kind === 'primitive') {
      expect(normalized.data.valueType).toBe('string')
    }
  })

  it('rejects return-value slot for void functions', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    fn.data.returnType = 'void'
    const ret = createBlockFromKind('return')
    fn.data.body = [ret]
    const blocks = [fn]
    const findBlock = (id: string) => {
      if (id === fn.id) return fn
      if (id === ret.id) return ret
      return undefined
    }
    const target: SlotTarget = {
      kind: 'return-value',
      parentBlockId: ret.id,
    }
    const primitive = createBlockFromKind('primitive')

    expect(canAttachBlockToSlot(target, primitive, findBlock, {}, () => blocks)).toBe(false)
  })

  it('accepts expression palette kind in boolean if-condition slots', () => {
    const ifBlock = createBlockFromKind('if')
    const target: SlotTarget = {
      kind: 'if-condition',
      parentBlockId: ifBlock.id,
    }
    const findBlock = findBlockFactory([ifBlock])

    expect(canAttachPaletteKindToSlot(target, 'expression', findBlock)).toBe(true)
  })

  it('coerces expression blocks for boolean condition slots on attach', () => {
    const ifBlock = createBlockFromKind('if')
    const target: SlotTarget = {
      kind: 'if-condition',
      parentBlockId: ifBlock.id,
    }
    const blocks = [ifBlock]
    const findBlock = findBlockFactory(blocks)
    const expression = createBlockFromKind('expression')

    expect(canAttachBlockToSlot(target, expression, findBlock, {}, () => blocks)).toBe(true)

    const normalized = normalizeBlockForSlot(target, expression, findBlock, {}, () => blocks)
    expect(normalized.kind).toBe('expression')
    if (normalized.kind === 'expression') {
      expect(normalized.data.operator).toBe('==')
      expect(normalized.data.resultType).toBe('boolean')
      expect(normalized.data.resultName).toBe('cond')
    }
  })

  it('accepts expression blocks in for and while condition slots', () => {
    const forBlock = createBlockFromKind('for')
    const whileBlock = createBlockFromKind('while')
    const blocks = [forBlock, whileBlock]
    const findBlock = (id: string) => blocks.find((b) => b.id === id)
    const expression = createBlockFromKind('expression')

    expect(
      canAttachBlockToSlot(
        { kind: 'for-condition', parentBlockId: forBlock.id },
        expression,
        findBlock,
        {},
        () => blocks,
      ),
    ).toBe(true)
    expect(
      canAttachBlockToSlot(
        { kind: 'while-condition', parentBlockId: whileBlock.id },
        expression,
        findBlock,
        {},
        () => blocks,
      ),
    ).toBe(true)
  })

  it('accepts expression blocks in typed variable-value slots', () => {
    const variable: BlockNode = {
      ...(createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>),
      data: {
        name: 'total',
        valueType: 'number',
      },
    }
    const target: SlotTarget = {
      kind: 'variable-value',
      parentBlockId: variable.id,
    }
    const blocks = [variable]
    const findBlock = findBlockFactory(blocks)
    const expression = createBlockFromKind('expression')

    expect(canAttachBlockToSlot(target, expression, findBlock, {}, () => blocks)).toBe(true)
  })

  it('rejects expression palette kind in statement-body slots', () => {
    const main = createBlockFromKind('main')
    const target: SlotTarget = {
      kind: 'statement-body',
      parentBlockId: main.id,
      region: 'main',
    }
    const findBlock = (id: string) => (id === main.id ? main : undefined)

    expect(canAttachPaletteKindToSlot(target, 'expression', findBlock)).toBe(false)
  })

  it('preserves primitive template values when allowPrimitiveTypeInit is set', () => {
    const variable = createBlockFromKind('variable')
    const primitive: BlockNode = {
      id: 'prim-14',
      kind: 'primitive',
      data: { valueType: 'number', value: 14 },
    }
    const target: SlotTarget = {
      kind: 'variable-value',
      parentBlockId: variable.id,
    }
    const findBlock = (id: string) => (id === variable.id ? variable : undefined)

    const normalized = normalizeBlockForSlot(
      target,
      primitive,
      findBlock,
      { allowPrimitiveTypeInit: true },
      () => [variable],
    )
    expect(normalized.kind).toBe('primitive')
    if (normalized.kind !== 'primitive') return
    expect(normalized.data.value).toBe(14)
  })

  it('normalizes expression to boolean comparison for if-condition attach', () => {
    const ifBlock = createBlockFromKind('if')
    const expression = createBlockFromKind('expression')
    const target: SlotTarget = {
      kind: 'if-condition',
      parentBlockId: ifBlock.id,
    }
    const findBlock = (id: string) => (id === ifBlock.id ? ifBlock : undefined)

    const normalized = normalizeBlockForSlot(target, expression, findBlock, {}, () => [ifBlock])
    expect(normalized.kind).toBe('expression')
    if (normalized.kind !== 'expression') return

    expect(normalized.data.operator).toBe('==')
    expect(normalized.data.resultName).toBe('cond')
    expect(canAttachBlockToSlot(target, normalized, findBlock, {}, () => [ifBlock])).toBe(true)
  })

  it('accepts return statements only inside function bodies', () => {
    const fn = createBlockFromKind('function')
    const main = createBlockFromKind('main')
    const blocks = [fn, main]
    const findBlock = (id: string) => blocks.find((b) => b.id === id)

    expect(
      canAttachPaletteKindToSlot(
        {
          kind: 'statement-body',
          parentBlockId: fn.id,
          region: 'function',
        },
        'return',
        findBlock,
        () => blocks,
      ),
    ).toBe(true)

    expect(
      canAttachPaletteKindToSlot(
        {
          kind: 'statement-body',
          parentBlockId: main.id,
          region: 'main',
        },
        'return',
        findBlock,
        () => blocks,
      ),
    ).toBe(false)
  })
})
