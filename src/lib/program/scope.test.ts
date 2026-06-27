import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { functionParamSourceId } from './functionParams'
import {
  getInScopeValuesForConsumer,
  resolveInScopeReferenceSource,
  resolveScopeConsumerId,
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

  it('exposes earlier function body variables inside an if branch expression', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    const ifBlock = createBlockFromKind('if')
    const branchExpr = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    if (ifBlock.kind === 'if') {
      ifBlock.data.trueBranch = [branchExpr]
    }
    fn.data.body = [countVar, ifBlock]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, branchExpr.id)
    expect(inScope.some((v) => v.blockId === countVar.id && v.label === 'count')).toBe(true)
  })

  it('exposes for-loop init to expressions in the loop body', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const forBlock = createBlockFromKind('for')
    const initVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    initVar.data.name = 'i'
    const bodyExpr = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    if (forBlock.kind === 'for') {
      forBlock.data.init = initVar
      forBlock.data.body = [bodyExpr]
    }
    main.data.body = [forBlock]
    const blocks = [main]

    const inScope = getInScopeValuesForConsumer(blocks, bodyExpr.id)
    expect(inScope.some((v) => v.blockId === initVar.id && v.label === 'i')).toBe(true)
  })

  it('resolves expression operand slots to the parent expression scope consumer', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    const ifBlock = createBlockFromKind('if')
    const conditionExpr = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    if (ifBlock.kind === 'if') {
      ifBlock.data.condition = conditionExpr
    }
    main.data.body = [countVar, ifBlock]
    const blocks = [main]

    expect(
      resolveScopeConsumerId(blocks, {
        kind: 'expression-operand',
        parentBlockId: conditionExpr.id,
        side: 'left',
      }),
    ).toBe(conditionExpr.id)

    const inScope = getInScopeValuesForConsumer(blocks, conditionExpr.id)
    expect(inScope.some((v) => v.blockId === countVar.id)).toBe(true)
  })

  it('exposes earlier function body variables to variable value slots', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    const totalVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    totalVar.data.name = 'total'
    fn.data.body = [countVar, totalVar]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, totalVar.id)
    expect(inScope.some((v) => v.blockId === countVar.id && v.label === 'count')).toBe(true)
  })

  it('exposes function params to statements inside the function body', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-a', name: 'amount', type: 'number' as const }
    fn.data.params = [paramRow]
    const ret = createBlockFromKind('return')
    fn.data.body = [ret]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, ret.id)
    expect(
      inScope.some(
        (v) =>
          v.blockId === functionParamSourceId(fn.id, paramRow.id) &&
          v.label === 'amount' &&
          v.kind === 'functionParam',
      ),
    ).toBe(true)
  })

  it('allows linking a function param into a return value slot', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-b', name: 'value', type: 'number' as const }
    fn.data.params = [paramRow]
    const ret = createBlockFromKind('return')
    fn.data.body = [ret]
    const blocks = [fn]
    const paramSourceId = functionParamSourceId(fn.id, paramRow.id)

    expect(
      shouldUseInScopeReference(blocks, paramSourceId, {
        kind: 'return-value',
        parentBlockId: ret.id,
      }),
    ).toBe(true)
  })
})
