import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  getInScopeValuesForConsumer,
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

  it('prefers in-scope references when attaching earlier expressions to if conditions', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const flagExpr = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    flagExpr.data.resultName = 'flag'
    flagExpr.data.resultType = 'boolean'
    const ifBlock = createBlockFromKind('if')
    main.data.body = [flagExpr, ifBlock]
    const blocks = [main]

    expect(
      shouldUseInScopeReference(blocks, flagExpr.id, {
        kind: 'if-condition',
        parentBlockId: ifBlock.id,
      }),
    ).toBe(true)

    main.data.body = [ifBlock, flagExpr]
    expect(
      shouldUseInScopeReference(blocks, flagExpr.id, {
        kind: 'if-condition',
        parentBlockId: ifBlock.id,
      }),
    ).toBe(false)
  })

  it('exposes expression result names to later if blocks in main', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const flagExpr = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    flagExpr.data.resultName = 'flag'
    flagExpr.data.resultType = 'boolean'
    const ifBlock = createBlockFromKind('if')
    main.data.body = [flagExpr, ifBlock]
    const blocks = [main]

    const inScope = getInScopeValuesForConsumer(blocks, ifBlock.id)
    expect(inScope.some((v) => v.blockId === flagExpr.id && v.label.startsWith('flag'))).toBe(true)
  })
})
