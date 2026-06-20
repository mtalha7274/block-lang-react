import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  getInScopeValuesForConsumer,
  resolveInScopeReferenceSource,
  shouldUseInScopeReference,
} from './scope'

describe('scope', () => {
  it('exposes earlier function body value sources to return block consumer', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const variable = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    variable.data.name = 'count'
    const ret = createBlockFromKind('return')
    fn.data.body = [variable, ret]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, ret.id)
    expect(inScope.some((v) => v.blockId === variable.id && v.label === 'count')).toBe(true)
  })

  it('prefers in-scope variable when linking a nested expression to if conditions', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const flagExpr = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    flagExpr.data.resultType = 'boolean'
    const flagVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    flagVar.data.name = 'flag'
    flagVar.data.valueType = 'boolean'
    flagVar.data.value = flagExpr
    const ifBlock = createBlockFromKind('if')
    main.data.body = [flagVar, ifBlock]
    const blocks = [main]

    expect(
      resolveInScopeReferenceSource(blocks, flagExpr.id, {
        kind: 'if-condition',
        parentBlockId: ifBlock.id,
      }),
    ).toBe(flagVar.id)

    expect(
      shouldUseInScopeReference(blocks, flagExpr.id, {
        kind: 'if-condition',
        parentBlockId: ifBlock.id,
      }),
    ).toBe(true)
  })

  it('exposes variable names to later if blocks in main', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const flagVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    flagVar.data.name = 'flag'
    flagVar.data.valueType = 'boolean'
    flagVar.data.value = createBlockFromKind('primitive')
    if (flagVar.data.value.kind === 'primitive') {
      flagVar.data.value.data.valueType = 'boolean'
      flagVar.data.value.data.value = true
    }
    const ifBlock = createBlockFromKind('if')
    main.data.body = [flagVar, ifBlock]
    const blocks = [main]

    const inScope = getInScopeValuesForConsumer(blocks, ifBlock.id)
    expect(inScope.some((v) => v.blockId === flagVar.id && v.label.startsWith('flag'))).toBe(true)
  })
})
